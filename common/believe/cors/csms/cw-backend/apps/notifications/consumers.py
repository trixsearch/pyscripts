import json
import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from rest_framework_jwt.serializers import VerifyJSONWebTokenSerializer
from django.db import connection
from django.core.paginator import Paginator
from django.contrib.auth.models import AnonymousUser
from django.http import QueryDict
from utils.utils import get_tenant_model

from apps.notifications.constants import MessageTypeConstant
from apps.notifications.models import Notification
from apps.notifications.utils import get_user_group, get_notification_group_name, get_tenant_room_name
from apps.org_group.models import OrganisationGroup
from apps.organisations.models import Domain
logger = logging.getLogger(__name__)

def remove_www(hostname):
    """
    Removes www. from the beginning of the address. Only for
    routing purposes. www.test.com/login/ and test.com/login/ should
    find the same tenant.
    """
    if hostname.startswith("www."):
        return hostname[4:]

    return hostname

def hostname_from_request(request):
    """ Extracts hostname from request. Used for custom requests filtering.
        By default removes the request's port and common prefixes.
    """
    if request.get('server') and ('localhost' in request['server'] or '127.0.0.1' in request['server']):
        origin = dict(request['headers'])[b'origin'].decode("utf-8")
        return remove_www(origin.split('://')[-1]).lower()
    else:
        return remove_www(request['server'].split(':')[0]).lower()

def get_tenant(request):
    # TenantModel = get_tenant_model()
    # hostname = hostname_from_request(request)
    # DomainModel = get_tenant_domain_model()
    # tenant = DomainModel.objects.get(domain=hostname).tenant
    request['tenant'] = request.tenant
    return tenant

class NotificationAndUpdatesConsumer(WebsocketConsumer):

    def remove_connected_user(self):
        try:
            logger.info("Removing channel: {} from all connected group".format(self.channel_name))
            # Leave room-group for all 3 types of group
            async_to_sync(self.channel_layer.group_discard)(
                    self.individual_user_group,
                    self.channel_name
                )
            async_to_sync(self.channel_layer.group_discard)(
                self.org_group_name,
                self.channel_name
            )
            if self.notification_enabled:
                connection.set_tenant(self.scope['tenant'])
                if self.user_group_qs:
                    for group in self.user_group_qs:
                        async_to_sync(self.channel_layer.group_discard)(
                            get_notification_group_name(self.org_domain, group.id),
                            self.channel_name
                        )

        except Exception as error:
            logger.critical('Failed to remove channels from group - {}'.format(str(error)))


    def connect(self):
        try:
            """
            Called when the websocket is handshaking as part of initial connection.
            """
            self.scope['tenant'] = get_tenant(self.scope)
            connection.set_tenant(self.scope['tenant'])

            try:
                self.scope['user'] = VerifyJSONWebTokenSerializer().validate({'token':QueryDict(self.scope.get('query_string'))["token"]})['user']
            except:
                self.scope['user'] = AnonymousUser()

            # Are they logged in? or org have support_notification enabled
            self.notification_enabled = self.scope['tenant'].support_notification
            if self.scope["user"].is_anonymous:
                # Reject the connection
                logger.info("Rejecting websocket connection request from channel: {}".format(self.channel_name))
                self.close()
            else:
                logger.info("Accepting websocket connection request from channel: {}".format(self.channel_name))
                # Accept the connection
                self.accept()

            # self.org_domain = self.scope['tenant'].domain_url.split(".")[0]
            self.org_domain = Domain.objects.get(tenant=self.scope['tenant']).domain.split(".")[0]
            self.user_id = self.scope["user"].id

            #join the group-rooms (1.Personal-group, 2.Domain-level group  3.all org-group of the user)
            # creating Individual channel-room
            self.individual_user_group = get_user_group(self.org_domain, self.user_id)
            logger.debug("Adding channel: {} to the group: {}".format(self.channel_name, self.individual_user_group))
            async_to_sync(self.channel_layer.group_add)(
                self.individual_user_group,
                self.channel_name
            )

            # creating Organisation channel-room
            self.org_group_name = get_tenant_room_name(self.scope['tenant'])
            logger.debug("Adding channel: {} to the group: {}".format(self.channel_name, self.org_group_name))
            async_to_sync(self.channel_layer.group_add)(
                self.org_group_name,
                self.channel_name
            )

            # creating Organisation Group channel-room
            self.user_group_qs = OrganisationGroup.objects.filter(users=self.scope['user'])
            if self.notification_enabled:
                if self.user_group_qs.exists():
                    for group in self.user_group_qs:
                        logger.debug( "Adding channel: {} to the group: {}".format(self.channel_name, group.id))
                        async_to_sync(self.channel_layer.group_add)(
                            get_notification_group_name(self.org_domain, group.id),
                            self.channel_name
                        )
                self.send_paginated_notification(page=1)

        except Exception as error:
            logger.exception('Failed to initiate the connection due to {}'.format(str(error)))
            self.remove_connected_user()


    # send paginated response
    def send_paginated_notification(self, page=1):
        notifications = []
        notification_queryset = Notification.objects.filter(
            recipient=self.scope["user"], is_read=False).order_by('-created_at')
        pages = Paginator(notification_queryset, 10)
        if page in pages.page_range:
            for notification in pages.page(page):
                notifications.append(
                    notification.to_json()
                )
        async_to_sync(self.channel_layer.group_send)(self.individual_user_group, {
            "type": "user_message",
            "notifications": notifications,
            "page": page,
            "unread_count": notification_queryset.count(),
        })


# called when ws connection is disconnected
    def disconnect(self, close_code):
        self.remove_connected_user()


# called when client send message
    def receive(self, text_data=None, bytes_data=None):
        try:
            connection.set_tenant(self.scope['tenant'])
            message = json.loads(text_data)
            if 'page' in message:
                self.send_paginated_notification(page=int(message.get('page')))
        except Exception as error:
            logger.exception(str(error))


    def user_message(self, event):
        logger.debug(json.dumps({
            'type': 'user_message',
            'notifications': event['notifications'],
            'unread_count': event['unread_count']
        }))
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'user_message',
            'notifications': event['notifications'],
            'unread_count': event['unread_count'],
            'page': event.get('page'),
            'message_type': MessageTypeConstant.NOTIFICATIONS
        }))


    def new_group_task(self, event):
        logger.debug(json.dumps({
            'notifications': event['notifications'],
            'type': 'new_group_task',
        }))
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'new_group_task',
            'notifications': event['notifications'],
            'message_type': MessageTypeConstant.NOTIFICATIONS
        }))

    def send_update(self, event):
        logger.debug(json.dumps({
            'type': event['update_type'],
        }))
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': event['update_type'],
            'message_type': MessageTypeConstant.UPDATES,
            'data': event["data"],
        }))
