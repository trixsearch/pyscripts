# Third-Party imports

from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.license.decorators import permission_and_license_required
from utils.loggerwrapper import Logger, getMessage, getLogMessage
# Application imports
from .models import License
from .serializers import LicenseSerializer
from .internal_errors import license_errors

logger = Logger(__name__)
# Create your views here.
class LicenseViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    model = License
    queryset = License.objects.all()
    serializer_class = LicenseSerializer

    @method_decorator(permission_and_license_required(["license.view_license", ]))
    def list(self, request):
        try:
            pagination_data = None
            page = self.paginate_queryset(self.get_queryset())
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(
                    self.get_queryset(), many=True)
            context = {
                "success": True, "message": _("License data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 4001
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(license_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(license_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @method_decorator(permission_and_license_required(["license.view_license", ]))
    def retrieve(self, request, pk=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                context = {'error': str(
                    error), 'success': False, 'message': _('ID not found')}
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {
                "success": True, "message": _("License details retrieved successfully."), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 4002
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(license_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(license_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
