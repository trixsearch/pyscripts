from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.translation import gettext as _

from utils.loggerwrapper import Logger, getMessage, getLogMessage

from .models import EntityImport
from .serializers import EntityImportSerializer
from .internal_errors import org_import_errors

logger = Logger(__name__)

class EntityImportViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = EntityImport
    queryset = EntityImport.objects.all()
    serializer_class = EntityImportSerializer
    lookup_field = 'transaction_id'

    def list(self, request, tenant=None):
        logger.info("{} requested the list of Import Data for tenant: {}.".format(request.user.email, tenant))
        try:
            if "entity" in request.query_params:
                entity_type = request.query_params["entity"]
                obj = self.model.objects.filter(tenant=tenant, entity_type=entity_type, user_id=str(request.user.id)).order_by('-started_at')

                pagination_data = None
                page = self.paginate_queryset(obj)
                if page is not None:
                    serializer = self.serializer_class(page, many=True)
                    pagination_data = self.get_paginated_response(serializer.data)
                else:
                    serializer = self.serializer_class(
                        self.get_queryset(), many=True)
                context = {
                    "success": True, "message": _("Import Data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
                logger.info("{} Import Data returned successfully for tenant: {}.".format(request.user.email, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 14001
            context = {
                "success": False, "message": _(getMessage(org_import_errors, internal_error)), 'error' : 'Bad Request', 'internal_error': internal_error}
            logger.error(getLogMessage(org_import_errors, internal_error).format(request.user.email), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 14002
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_import_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_import_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, transaction_id=None, tenant=None):
        logger.info("{} requested to retrieve Import Data for tenant: {}.".format(request.user.email, tenant))
        try:
            try:
                obj = self.model.objects.get(transaction_id = transaction_id, tenant=None)
            except Exception as error:
                internal_error = 14003
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_import_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_import_errors, internal_error).format(request.user.email, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {
                "success": True, "message": _("Import data retrieved successfully"), "data": serializer.data}
            logger.info("{} Import data retrieved successfully for tenant: {}.".format(request.user.email), tenant)
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 14004
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_import_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_import_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)
