from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from apps.notifications.utils import get_user_group
from apps.org_users.models import OrganisationUser
from apps.org_apps.models import OrganisationWorkflow
from apps.org_users.utils import get_tenant
# from apps.org_users.utils import task_notification_via_email
from apps.license.decorators import license_required
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from .internal_errors import notifications_errors

logger = Logger(__name__)

class TaskReminder(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    model = Notification
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def create(self, request, **args):
        try:
            internal_error = 5001
            if not 'task_id' in request.data or not request.data['task_id']:
                context = {'error': None, "success": False,
                           "message": getMessage(notifications_errors, internal_error), 'internal_error': internal_error}
                logger.error(getMessage(notifications_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            request_data = request.data.copy()
            meta_content = dict()
            meta_content['workflow'] = None
            if 'process_key' in request.data and request.data['process_key']:
                org_workflow = OrganisationWorkflow.objects.filter(
                    process_key=request.data['process_key'])
                if org_workflow:
                    meta_content['workflow'] = org_workflow.first(
                    ).name

            meta_content['assignor'] = OrganisationUser.default_manager.filter(
                id=request.user.id).first().first_name

            meta_content['url'] = "{0}://{1}{2}{3}".format(
                request.scheme, request.get_host(), '/tasks/', request.data['task_id'])

            meta_content['task_id'] = request.data['task_id']

            request_data['meta_content'] = meta_content
            request_data['sender'] = request.user.id

            serializer = self.serializer_class(
                data=request_data, fields=('meta_content', 'sender', 'notification_type', 'recipient'))

            if serializer.is_valid():
                obj = serializer.save()

                # Sending as notification to recipient

                data = obj.to_json()
                channel_layer = get_channel_layer()
                count = Notification.objects.filter(
                    recipient=obj.recipient, is_seen=False).count()
                channel_user_group = get_user_group(
                    get_tenant(request), obj.recipient.id)

                async_to_sync(channel_layer.group_send)(
                    channel_user_group, {
                        "type": "user_message",
                        "notifications": [data],
                        "unread_count": count
                    })
                # SEND EMAIL
                # task_notification_via_email(request, data, obj)

                context = {
                    "success": True, "message": "New notification created successfully.", "data": self.serializer_class(obj).data}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 5002
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": getMessage(notifications_errors, internal_error), 'internal_error': internal_error}
            logger.error(getLogMessage(notifications_errors, internal_error).format(serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 5003
            context = {'error': str(error), 'success': False,
                       'message': getMessage(notifications_errors, internal_error), 'internal_error': internal_error}
            logger.exception(getLogMessage(notifications_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, pk=None):
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                context = {'error': str(
                    error), 'success': False, 'message': 'ID not found'}
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            serializer = self.serializer_class(
                obj, data=request.data, partial=True, fields=('is_read', 'is_seen'))

            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": "Notification details updated successfully.",
                           "data": self.serializer_class(obj).data}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 5004
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": getMessage(notifications_errors, internal_error),  'internal_error': internal_error}
            logger.error(getLogMessage(notifications_errors, internal_error).format(serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 5005
            context = {'error': str(
                error), 'success': False, 'message': getMessage(notifications_errors, internal_error),  'internal_error': internal_error}
            logger.exception(getLogMessage(notifications_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)


    def destroy(self, request, pk=None):
        try:
            try:
                instance = self.get_object()
            except Exception:
                internal_error = 5006
                context = {'success': False,'message': getMessage(notifications_errors, internal_error), 'internal_error': internal_error}
                logger.error(getMessage(notifications_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            self.perform_destroy(instance)
            context = {'success': True,'message': 'Notification deleted succesfully.'}
            return Response( context, status=status.HTTP_204_NO_CONTENT)
        except Exception as error:
            internal_error = 5007
            context = {'error': str(error), 'success': False,
                       'message': getMessage(notifications_errors, internal_error), 'internal_error': internal_error}
            logger.exception(getLogMessage(notifications_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def update(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)


    @method_decorator(license_required(["notifications.change_notification", ]))
    @action(detail=False, methods=['post'], name='clear_notification')
    def clear_notification(self, request, pk=None):
        try:
            for noti in Notification.objects.filter(recipient=request.user, is_seen=False):
                noti.is_read=True
                noti.is_seen=True
                noti.save()
            context = {'success': True, 'message': 'All notification cleared'}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 5008
            context = {'success': False, 'message': getMessage(notifications_errors, internal_error), 'error': str(error), 'internal_error': internal_error}
            logger.exception(getLogMessage(notifications_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
