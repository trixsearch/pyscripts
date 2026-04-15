from django.utils.translation import gettext_lazy as _
from datetime import datetime

from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action

from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.serializers import EmptySerializer

from rest_framework.permissions import AllowAny
from .models import Sequence
from .internal_errors import org_sequences_errors

logger = Logger(__name__)

# Create your views here.

def get_next_value(
    sequence_name='default', initial_value=1, reset_value=None,
    *, nowait=False, using=None, last=None):
    if last is None:
        last = initial_value
        return last
    last = last+1
    return last



class SequenceViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = Sequence
    queryset = Sequence.objects.all()
    serializer_class = EmptySerializer

    # def get_permissions(self):
    #     permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #     return [permission([]) for permission in permission_classes]

    def list(self, request, tenant=None):
        logger.info("{} requested the sequences for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            sequence_data = Sequence.objects.filter(name = request.GET.get('name'), tenant__id=tenant)
            if not sequence_data:
                internal_error = 21001
                context = {'success': False, 'message': _(getMessage(org_sequences_errors, internal_error)), 'internal_error': internal_error}
                logger.exception(getLogMessage(org_sequences_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            sequence_name = sequence_data[0].name
            initial_value = sequence_data[0].initial_value
            prefix = sequence_data[0].prefix
            suffix = sequence_data[0].suffix
            last = sequence_data[0].last
            digits_in_sequence_number = sequence_data[0].digits_in_sequence_number
            CREATE_DATE_YEAR = datetime.now().year
            CREATE_DATE_MONTH = datetime.now().month
            CREATE_DATE_DAY = datetime.now().day
            unique_number = get_next_value(sequence_name, initial_value=initial_value, last=last)
            unique_sequence = str(unique_number)
            unique_sequence_lenght = len(unique_sequence)
            if unique_sequence_lenght < digits_in_sequence_number:
                for x in range(unique_sequence_lenght,digits_in_sequence_number):
                    unique_sequence = '0'+unique_sequence
            if prefix:
                unique_sequence =  eval(prefix) + unique_sequence
            if suffix:
                unique_sequence =  unique_sequence +  eval(suffix)
            sequence_data[0].last = unique_number
            sequence_data[0].save()
            context = {
                "success": True, "message": _("Sequence generated successfully."), "unique_id": unique_sequence}
            logger.info("{},Sequence generated successfully of sequence: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser",sequence_name))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 21002
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_sequences_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_sequences_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser",error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['get'], name='last-value')
    def last_value(self, request, tenant=None):
        logger.info("{} requested the sequences for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            obj = Sequence.objects.filter(name=request.GET.get('name',''), tenant__id=tenant)
            if not obj:
                internal_error = 21003
                context = {'success': False, 'message': _(getMessage(org_sequences_errors, internal_error)), 'internal_error': internal_error}
                logger.exception(getLogMessage(org_sequences_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            last_value = obj[0].last
            context = {
                "success": True, "message": _("last value returned successfully."), "last_value": last_value}
            logger.info("{},Last value returned successfully of sequence: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser",obj[0].name))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 21004
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_sequences_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_sequences_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser",error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, tenant=None):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, tenant=None, pk=None):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, tenant=None, pk=None):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, tenant=None, pk=None):
        context = {'error': '', 'success': False,
                   'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)
