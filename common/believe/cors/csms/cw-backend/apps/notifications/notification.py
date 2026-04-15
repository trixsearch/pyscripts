import uuid
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.sites.shortcuts import get_current_site
import process_engine
from django.db.models import Q

from ezedox.settings import VERY_LOW_PRIORITY_TASK
from ezedox.celery import app
from apps.org_users.models import OrganisationUser
from apps.organisations.models import OrganisationLicense, Organisation
from apps.notifications.utils import get_system_filter_value
from apps.notifications.constants import NotificationConstant
from apps.notifications.serializers import NotificationSerializer
from apps.notifications.models import Notification
from apps.notifications.utils import get_user_group, get_notification_group_name, get_tenant_room_name
from apps.org_group.models import OrganisationGroup
from apps.org_users.utils import get_tenant
from apps.org_users.utils import send_simple_email
from utils.loggerwrapper import Logger, getMessage
from utils.utils import is_process_completed
from utils.process_engine_proxy import call
from .internal_errors import notifications_errors
logger = Logger(__name__)

def get_tenant_from_tenant_obj(tenant):
    return Organisation.objects.get(id=tenant)

def get_tasks(tenant_id, query_params):
    tasksApi =process_engine.TasksApi
    listTasks= tasksApi.list_tasks
    res_action = call(module = tasksApi, func = listTasks, data=query_params, tenant_id= tenant_id, type="get", read_replica=True)[0]
    tasks = res_action["data"]
    return tasks


def get_process_variable(tenant_id, process_instance_id):
    ProcessInstanceVariables = process_engine.ProcessInstanceVariablesApi
    list_process_instance =ProcessInstanceVariables.list_process_instance_variables
    req_id ={}
    req_id["process_instance_id"]=process_instance_id
    res_action = call(module = ProcessInstanceVariables, func = list_process_instance, data=req_id, tenant_id= tenant_id, type="get", read_replica=True)[0]
    variables = res_action
    return variables


def send_user_notification(instance, tenant):
    try:
        data = instance.to_json()
        channel_layer = get_channel_layer()
        count = Notification.objects.filter(recipient=instance.recipient, is_seen=False).count()
        channel_user_group = get_user_group(get_tenant_from_tenant_obj(tenant), instance.recipient.id)
        async_to_sync(channel_layer.group_send)(
            channel_user_group, {
                "type": "user_message",
                "notifications": [data],
                "unread_count": count,
            })
    except Exception as error:
        logger.exception("Failed to send user notification, due to {}".format(str(error)))


def send_group_notification_or_individual_notification(instance, id, tenant_name, send_individual=False):
    try:
        data = instance.to_json()
        channel_layer = get_channel_layer()
        if send_individual:
            channel_name = get_user_group(tenant_name, id)
        else:
            channel_name = get_notification_group_name(tenant_name,id)
        async_to_sync(channel_layer.group_send)(
            channel_name, {
                "type": "new_group_task",
                "notifications": [data],
            })
    except Exception as error:
        logger.exception("Failed to send group notification due to - {}".format(str(error)))



def send_group_notification_without_filter(meta_content, group_id, notification_data, tenant_name):
    try:
        last_obj = None
        group_instance = OrganisationGroup.objects.filter(id=group_id).first()
        for user in group_instance.users.all():
            meta_content['group_id'] = group_id
            notification_data['meta_content'] = meta_content
            notification_data['recipient'] = str(user.id)
            serializer = NotificationSerializer(data=notification_data, fields=('meta_content', 'sender', 'notification_type', 'recipient', 'task_id'))
            if serializer.is_valid():
                last_obj = serializer.save()
        send_group_notification_or_individual_notification(last_obj, group_id, tenant_name, False)
        logger.info('Sending notification to group:{} {}'.format(group_instance.name, str(group_instance.id)))
    except Exception as error:
        internal_error = 5010
        logger.exception(getMessage(notifications_errors, internal_error).format(group_id, error), internal_error)


#will triggered for each user if group task filter is applied and save and send notification to user
@app.task(bind=True, name="inapp_notification_to_individual_user_in_filter_group")
def send_notification_to_individual_user_in_group(self, value, group_id, user_id, meta_content, notification_data, tenant_name):
    group_instance = OrganisationGroup.objects.filter(Q(id=group_id) | Q(key=group_id))[0]
    user = OrganisationUser.objects.get(id=user_id)
    user_filter_value = get_system_filter_value(group_instance.filter_by, user)
    if value in user_filter_value:
        meta_content['group_id'] = group_id
        notification_data['meta_content'] = meta_content
        notification_data['recipient'] = str(user.id)
        serializer = NotificationSerializer(data=notification_data, fields=('meta_content', 'sender', 'notification_type', 'recipient', 'task_id'))
        if serializer.is_valid():
            instance = serializer.save()
            logger.info('Sending filtered notification to group:{} {}'.format(group_instance.name, str(group_instance.id)))
            send_group_notification_or_individual_notification(instance, str(user.id), tenant_name, send_individual=True)
        else:
            logger.error('Notification in group filer failed. Due to {}'.format(str(serializer.errors)))



def send_group_notification_with_filter(tenant_id, processInstance_id, group_instance, tenant_name, meta_content, notification_data):
    logger.info('Filter found in group. Sending notification to user that passes the filter.')
    try:
        variables = get_process_variable(tenant_id, processInstance_id)
        if isinstance(variables, list):
            filter_value_in_process = None
            for item in variables:
                if item['name'] == group_instance.filter_by:
                    filter_value_in_process = item['value']
            if filter_value_in_process:
                for user in group_instance.users.all():
                    send_notification_to_individual_user_in_group.apply_async(args=[filter_value_in_process, str(group_instance.id), user.id , meta_content, notification_data, tenant_name], priority=VERY_LOW_PRIORITY_TASK)
            else:
                logger.error('Filter field - {} - not found in user data'.format(str(group_instance.filter_by)))
        else:
            logger.error('Process Variables not found for process instance id {}'.format(processInstance_id))

    except Exception as error:
        logger.exception('Error occured in sending notification to group due to {}'.format(str(error)))



@app.task(bind=True, name="inapp_notification")
def celery_send_inapp_notification(self, user_id,tenant_id, tenant_name, processInstance_id, current_task_id, notification_type, scheme, current_site, is_retried ):
    try: # pylint: disable=too-many-nested-blocks
        tenant = Organisation.objects.get(id=tenant_id)
        engineurl = OrganisationLicense.objects.get(organisation=tenant).processengine
        query_params = {}
        query_params['process_instance_id'] = processInstance_id
        tasks = get_tasks(tenant_id, query_params)
        if len(tasks) == 0 and is_retried is False:
            if not is_process_completed(processInstance_id, tenant_id):
                logger.info('No task found, will retry to get task again after 10 seconds.')
                celery_send_inapp_notification.apply_async(
                        args=[user_id,tenant_id, tenant_name, processInstance_id, current_task_id, notification_type, scheme, current_site, True],
                        priority=VERY_LOW_PRIORITY_TASK,
                        countdown=10
                    )
        else:
            for usertask in tasks:
                task_id = usertask.get('id')
                if notification_type == NotificationConstant.REASSIGN_CHOICE:
                    if task_id != current_task_id:
                        continue

                assignee = usertask.get('assignee')
                notification_data = dict()
                notification_data['sender'] = user_id
                notification_data['task_id'] = task_id
                #filling extra details in meta
                meta_content = dict()
                meta_content['workflow'] = None
                meta_content['group_id'] = None
                meta_content['task_name'] = usertask.get('name')
                meta_content['assignor'] = ''
                org_user_qs = OrganisationUser.default_manager.filter(id=user_id)


                if org_user_qs.exists():
                    meta_content['assignor'] = org_user_qs.first().first_name
                # if there is assignee then we will send notification to assignee(email) or it is a group task
                if assignee:
                    org_user = OrganisationUser.default_manager.filter(email=assignee).first()
                    if org_user:
                        # we dont want to send notification again for same task
                        prev_noti = Notification.objects.filter(task_id=task_id, recipient=org_user, notification_type=notification_type)
                        if prev_noti.exists():
                            prev_noti.delete()

                        notification_data['notification_type'] = notification_type
                        notification_data['recipient'] = str(org_user.id)

                        meta_content['url'] = "{0}://{1}/org{2}{3}".format(scheme, current_site, '/tasks/', task_id)
                        notification_data['meta_content'] = meta_content
                        serializer = NotificationSerializer(data=notification_data, fields=('meta_content', 'sender', 'notification_type', 'recipient', 'task_id'))
                        if serializer.is_valid():
                            obj = serializer.save()
                            logger.info('Sending in-app-notification and email notification to user {}'.format(org_user.email))
                            send_user_notification(obj, tenant)
                            email_message1 = 'A new task `{}` has been assigned to you.'.format(meta_content.get('task_name'))
                            email_message2 = 'You can view it on {} .'.format(meta_content.get('url'))
                            send_simple_email(org_user.email, 'New Task Assigned', email_message1, email_message2,'This is a system generated notification.' )
                        else:
                            logger.error('Notification cannot be sent. error - {}'.format(serializer.errors))
                    else:
                        logger.debug('Assignee found. But user {} is not organization user'.format(assignee))

                elif notification_type != NotificationConstant.REASSIGN_CHOICE:
                    logger.info('No assignee found. Checking if there is a group task or not.')
                    req_id = {}
                    req_id["task_id"] = task_id
                    TaskIdentityLinks = process_engine.TaskIdentityLinksApi
                    list_tasks_instance_identity = TaskIdentityLinks.list_tasks_instance_identity_links
                    res_action = call(module = TaskIdentityLinks, func= list_tasks_instance_identity, data=req_id, tenant_id= tenant_id, type="get", read_replica=True)[0]
                    for group_task in res_action:
                        try:
                            uuid.UUID(group_task['group'])
                            group_id = group_task['group']
                        except ValueError:
                            group_id = str(OrganisationGroup.objects.get(key=group_task['group']).id)
                        if not Notification.objects.filter(task_id=task_id, notification_type=NotificationConstant.GROUP_TASK_CHOICE).exists():
                            group_instance = None
                            try:
                                group_instance = OrganisationGroup.objects.filter(Q(id=group_id) | Q(key=group_id))[0]
                            except Exception as error:
                                logger.error('Group does not exist with id {}'.format(group_id))
                            if group_instance:
                                logger.info('Sending notification to group {}'.format(group_instance.name))
                                # if group have filter by then sending notification to individual users  else sending to group
                                meta_content['url'] = "{0}://{1}/org{2}{3}".format(scheme, current_site, '/tasks?taskType=', group_id)
                                notification_data['notification_type'] = NotificationConstant.GROUP_TASK_CHOICE
                                meta_content_copy = meta_content.copy()
                                notification_data_copy = notification_data.copy()
                                if group_instance.filter_by:
                                    send_group_notification_with_filter(tenant_id, processInstance_id, group_instance,get_tenant_from_tenant_obj(tenant), meta_content_copy, notification_data_copy )
                                else:
                                    send_group_notification_without_filter(meta_content_copy, group_id, notification_data_copy, get_tenant_from_tenant_obj(tenant))
    except Exception as error:
        logger.exception(str(error))


@app.task(bind=True, name="inapp_updates_to_all_users")
def celery_send_update_to_users(self, choice, channel_user_group):
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            channel_user_group, {
                "type": "send_update",
                "update_type": choice,
                "data": [],
            })
    except Exception as error:
        logger.exception("Failed to send updates to all users - {}".format(str(error)))



# for sending Updates to all org user at once
def send_update_to_users(choice, tenant):
    try:
        celery_send_update_to_users.apply_async(args=[choice, get_tenant_room_name(tenant)], priority=VERY_LOW_PRIORITY_TASK)
    except Exception as error:
        logger.exception('Failed to send updates to user. Due to {}'.format(str(error)))

# for sending task related notification
def send_inapp_notification(request, processInstance_id, notification_type, task_id):
    try:
        if request.tenant.support_notification:
            tenant_name = get_tenant(request)
            user_id = request.user.id
            current_site = get_current_site(request).domain
            celery_send_inapp_notification.apply_async(args=[user_id, request.tenant.id, tenant_name, processInstance_id, task_id, notification_type, request.scheme, current_site, False], priority=VERY_LOW_PRIORITY_TASK)
    except Exception as error:
        logger.exception('Failed to send in app notification. Due to {}'.format(str(error)))


# for sending notification to individual users
def send_notification(user, message, text, tenant, url):
    try:
        if tenant.support_notification:
            notification_data = dict()
            notification_data['recipient'] = user.id
            notification_data['notification_type'] = NotificationConstant.OTHER_NOTIFICATION_CHOICE

            #filling extra details in meta
            meta_content = dict()
            meta_content['message'] = message
            meta_content['notification_text'] = text
            meta_content['url'] = url
            notification_data['meta_content'] = meta_content
            serializer = NotificationSerializer(data=notification_data, fields=('meta_content', 'notification_type', 'recipient'))
            if serializer.is_valid():
                instance = serializer.save()
                send_user_notification(instance, tenant)
                logger.info('Sending notification to user {}'.format(user.email))
            else:
                logger.error('Notification cannot be sent. error - {}'.format(serializer.errors))

    except Exception as error:
        logger.exception("Failed to send notification to user due to - {}".format(str(error)))


# for sending updates to individual user
def send_updates(tenant, user, choice, data):
    try:
        channel_user_group = get_user_group(get_tenant_from_tenant_obj(tenant), user.id)
        logger.debug("Sending Updates to User {}".format(user.email))
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            channel_user_group, {
                "type": "send_update",
                "update_type": choice,
                "data": data,
            })
    except Exception as error:
        logger.exception("Failed to send updates to user due to - {}".format(str(error)))

@app.task(bind=True, name="inapp_user_related_updates")
def send_user_related_updates(self, tenant_id, user, choice, data):
    try:
        tenant = Organisation.objects.get(id=tenant_id)
        channel_user_group = get_user_group(get_tenant_from_tenant_obj(tenant), user['id'])
        logger.debug("Sending Updates about User with email id{}".format(user['email']))
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            channel_user_group, {
                "type" : "send_update",
                "update_type": choice,
                "data": data
            })
    except Exception as error:
        logger.exception("Failed to send user related updates due to - {}".format(str(error)))
