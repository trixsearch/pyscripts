import json
import requests
from django.db.models.signals import pre_delete
from django.dispatch import receiver
import process_engine

from ezedox.celery import app
from ezedox.settings import ( EMAIL_HOST_USER, VERY_LOW_PRIORITY_TASK, PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_USER, PROCESS_IDM_URL, PROCESS_ENGINE_URL, PROCESS_MODELER_URL )
from apps.org_users.utils import send_simple_email
from apps.org_apps.utils_urls import ( MODELER_APP_DEFINITION, MODELER_PROCESS_MODEL, APP_DEFINITION,
    MODELER_APP_DEFINITION_DELETE, MODELER_PROCESS_MODEL_DELETE, IDM_AUTHENTICATION, APP_DEFINITION_DELETE, MODELER_DECISION_TABLE, MODELER_DECISION_TABLE_DELETE, GET_ALL_USERS, DELETE_USER )
from utils.process_engine_proxy import call
from utils.loggerwrapper import Logger
from .serializers import OrganisationSerializer
from .models import Organisation, OrganisationLicense, Domain

logger = Logger('__name__')


@app.task(bind=True, name='create_org_and_owner')
def create_org_and_owner(self, scheme, request_data):
    try:
        obj = None
        serializer = OrganisationSerializer(data=request_data)
        if serializer.is_valid():
            #org schema will be created on .save()
            obj = serializer.save()
            #payload to create owner
            user_data = {}
            user_data['middle_name'] = request_data.get('middle_name')
            user_data['first_name'] = request_data.get('first_name')
            user_data['last_name'] = request_data.get('last_name')
            user_data['email'] = request_data.get('email')
            user_data['domain_url'] = request_data.get('domain_url')
            user_data['skip_app_installation'] = request_data.get('skip_app_installation')
            user_data['package'] = request_data.get('package')

            #making this post call instead of creating admin here because the request was not made on sub-domain so request.tenant is not availabe
            owner_register_url = '{}://{}/api/users/org_users/register'.format(scheme, request_data['domain_url'])
            response = requests.post(owner_register_url, data=json.dumps(user_data), headers={"Content-Type" : "application/json"})
            #TODO send mail to user if owner creation failed and delete org and schema
            if response.status_code != 200:
                logger.exception("User creation failed with response code " + str(response.status_code))
                raise Exception
        else:
            message = 'Hi {}, your request for creation of organisation {} has failed due to some error.'.format(
                request_data.get('first_name'), request_data.get('domain_url')
            )
            message2 = 'We request you to try again after sometime.'
            subject = 'Organisation creation failed'
            send_simple_email(request_data.get('email'), subject, message, message2, '')
            logger.error('Failed to create organisation {} due to invalid data submitted'.format(request_data.get('domain_url')))
    except Exception as error:
        #sending mail to user
        message = 'Hi {}, your request for creation of organisation {} has failed.'.format(
            request_data.get('first_name'), request_data.get('domain_url')
        )
        message2 = 'We request you to try again after sometime.'
        subject = 'Organisation creation failed'
        send_simple_email(request_data.get('email'), subject , message, message2, '')
        #sending mail to admin
        message = 'Failed to create {} '.format(request_data.get('domain_url'))
        message2 = 'Hi, a user named {} with email {} has tried to create a organisation {} but has failed due to {}'.format(
            request_data.get('first_name'), request_data.get('email'), request_data.get('domain_url'), str(error)
        )
        subject = 'Organisation creation failed due to exception'
        send_simple_email(EMAIL_HOST_USER, subject, message, message2, '')

        logger.exception('Failed to create organisation {}'.format(request_data.get('name')))
        try:
            if obj:
                name = obj.name
                obj.delete()
                logger.info('Organisation {} deleted due to exception'.format(name))
        except Exception as error:
            logger.exception('Organisation deleting failed due to {}'.format(str(error)))



def get_cookies(idm_url, tenant_id):
    #getting cookies
    url = IDM_AUTHENTICATION.format(idm_url)
    user_id = PROCESS_ENGINE_USER
    password = PROCESS_ENGINE_PASSWORD
    payload = "j_username=" + user_id + "&j_password=" + password + "&_spring_security_remember_me=true"
    headers = {'Content-Type': "application/x-www-form-urlencoded"}
    logger.info('Getting cookies from IDM for user {} for tenant {}'.format(user_id, tenant_id))
    idm_response = requests.request("POST", url, data=payload, headers=headers)
    if idm_response.status_code == 200:
        logger.debug('Cookies fetch successfully for user {}'.format(user_id))
        return idm_response.cookies
    else:
        logger.critical('Cookies fetch failed for user {}'.format(user_id))
        raise ValueError('Failed to authenticate user {} through IDM for tenant {}'.format(user_id, tenant_id))
    return None


@app.task(bind=True, name="tenant_cleanup_from_flowable")
def flowable_cleanup_for_tenant(self, tenant_id, designer_url, idm_url, processengine_url):
    try:
        def get_deployment_ids(req_body, for_tenant_id):
            return call(module=process_engine.DeploymentApi,func= process_engine.DeploymentApi.list_deployments, data=req_body, type="get", is_public=True, for_tenant_id=tenant_id)

        if tenant_id is None:
            raise ValueError("Tenant is not passed")
        size = 100
        all_deployments = []
        req_body={
            "size": size,
            "start": 0
            }
        response, status_code = get_deployment_ids(req_body, tenant_id)
        if status_code == 200:
            total = response.get('total')
            for start in range(0, total, size):
                req_body['start'] = start
                logger.info('Getting deployment for {} of size {} and start {}'.format(tenant_id, size, start))
                response, status_code = get_deployment_ids(req_body, tenant_id)
                if status_code != 200:
                    raise ValueError('Failed to get all deployments for {}'.format(tenant_id))
                dep_ids = [item['id'] for item in response.get("data")]
                all_deployments += dep_ids
            all_deployments = list(set(all_deployments))
            logger.info('Deleting all {} deployments - {}'.format(len(all_deployments), all_deployments))
            for item in all_deployments:
                req_body = {}
                req_body['deployment_id'] = item
                req_body['cascade'] = True
                response, status_code = call(module=process_engine.DeploymentApi, func=process_engine.DeploymentApi.delete_deployment, data=req_body, type="delete", is_public=True, for_tenant_id=tenant_id)
                if status_code == 204:
                    logger.info("Deployment {} for tenant {} deleted Successfully".format(item, tenant_id))
                else:
                    logger.critical("Failed to Delete Deployment {} for tenant {} .".format(item, tenant_id))

            cookie = get_cookies(idm_url, tenant_id)

            # getting and deleting apps
            app_url = MODELER_APP_DEFINITION.format(designer_url)
            app_response = requests.get(app_url, cookies=cookie)
            app_definations = [i['id'] for i in app_response.json()['data'] if i['tenantId'] == tenant_id]
            logger.info('Deleting {} app definations - {} for tenant {} '.format(len(app_definations), app_definations, tenant_id))
            for item in app_definations:
                logger.info('Deleting app {} for tenant {} '.format(item, tenant_id))
                app_delete_url = MODELER_APP_DEFINITION_DELETE.format(designer_url, item)
                app_delete_response = requests.delete(app_delete_url, cookies=cookie)
                if app_delete_response.status_code == 200:
                    logger.debug('App {} deleted for tenant {} '.format(item, tenant_id))
                else:
                    logger.critical('App {} delete fail for tenant {} '.format(item, tenant_id))

            # getting and deleting models
            model_url = MODELER_PROCESS_MODEL.format(designer_url)
            model_response = requests.get(model_url, cookies=cookie)
            process_models = [i['id'] for i in model_response.json()['data'] if i['tenantId'] == tenant_id]
            logger.info('Deleting {} process models - {} for tenant {}.'.format(len(process_models), process_models, tenant_id))
            for item in process_models:
                logger.info('Deleting model {} for tenant {} '.format(item, tenant_id))
                model_delete_url = MODELER_PROCESS_MODEL_DELETE.format(designer_url, item)
                model_delete_response = requests.delete(model_delete_url, cookies=cookie)
                if model_delete_response.status_code == 200:
                    logger.debug('Model {} deleted for tenant {} '.format(item, tenant_id))
                else:
                    logger.critical('Model {} delete fail for tenant {} '.format(item, tenant_id))

            # getting and deleting decision table
            decision_table_url = MODELER_DECISION_TABLE.format(designer_url)
            table_response = requests.get(decision_table_url, cookies=cookie)
            decision_tables = [i['id'] for i in table_response.json()['data'] if i['tenantId'] == tenant_id]
            logger.info('Deleting {} decision tables - {} for tenant {}.'.format(len(decision_tables), decision_tables, tenant_id))
            for item in decision_tables:
                logger.info('Deleting decision table {} for tenant {} '.format(item, tenant_id))
                decision_table_delete = MODELER_DECISION_TABLE_DELETE.format(designer_url, item)
                model_delete_response = requests.delete(decision_table_delete, cookies=cookie)
                if model_delete_response.status_code == 200:
                    logger.debug('Decision table {} deleted for tenant {} '.format(item, tenant_id))
                else:
                    logger.critical('Decision table {} delete fail for tenant {} '.format(item, tenant_id))

            # Get and delete Parent Deployment Id
            deployment_url = APP_DEFINITION.format(processengine_url)
            query_params = {}
            query_params["tenantId"] = tenant_id
            query_params["size"] = 500
            deployment_response = requests.get(deployment_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), params=query_params)
            deployments = [i['deploymentId'] for i in deployment_response.json()['data'] if i['tenantId'] == tenant_id]
            logger.info('Deleting {} App repository definations - {} for tenant {}.'.format(len(deployments), deployments, tenant_id))
            for item in deployments:
                delete_deployment_url = APP_DEFINITION_DELETE.format(processengine_url, item)
                deployment_delete_response = requests.delete(delete_deployment_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD))
                if deployment_delete_response.status_code == 204:
                    logger.debug('App repository definations {} deleted for tenant {} '.format(item, tenant_id))
                else:
                    logger.critical('App repository defination {} delete fail for tenant {} '.format(item, tenant_id))
            
            # Modeller user deletion
            user_data_url = GET_ALL_USERS.format(processengine_url)
            query_params = {}
            query_params["tenantId"] = tenant_id
            user_response = requests.get(user_data_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), params=query_params)
            logger.info('Deleting modeller user for tenant {}.'.format(tenant_id))
            for item in user_response.json()['data']:
                delete_user_url = DELETE_USER.format(processengine_url, item['id'])
                deleted_user_response = requests.delete(delete_user_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD))
                if deleted_user_response.status_code == 204:
                    logger.info('modeller user with email:  {} deleted for tenant {} '.format(item['email'], tenant_id))
                else:
                    logger.critical('modeller user with email: {} deletion failed for tenant {} '.format(item['email'], tenant_id))

            logger.info('Deployments, Apps and Model deleted successfully for Organisation {}.'.format(tenant_id))
    except ValueError as error:
        logger.exception("While deleting deployments, {}".format(str(error)))
    except Exception as error:
        logger.critical("Failed to cleanup flowable data for {}, Due to - {}".format(tenant_id, str(error)))


@receiver(pre_delete, sender=Organisation, dispatch_uid='organisation_delete_signal')
def delete_organisation(sender, instance, using, **kwargs):
    tenant_id = instance.id
    license_qs = OrganisationLicense.objects.filter(organisation = instance)
    designer_url = PROCESS_MODELER_URL
    idm_url = PROCESS_IDM_URL
    processengine_url = PROCESS_ENGINE_URL
    if license_qs.exists():
        license_obj = license_qs.first()
        designer_url = license_obj.process_modeler
        idm_url = license_obj.process_idm
        processengine_url = license_obj.processengine

    if get_cookies(idm_url, tenant_id):
        flowable_cleanup_for_tenant.apply_async(args=[tenant_id, designer_url, idm_url, processengine_url ], priority=VERY_LOW_PRIORITY_TASK)
    else:
        raise Exception('Failed to get authenticate user and get cookies')
