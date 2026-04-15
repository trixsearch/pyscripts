from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets, filters
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

import process_engine

from apps.org_apps.models import OrganisationWorkflow
from apps.license.decorators import permission_and_license_required
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger ,getMessage, getLogMessage
from utils.process_engine_proxy import call
from utils.CustomSearch import CustomSearchFilter, get_filter_fields

from .models import Content, PortalContentOrder, Portals
from .serializers import (ContentSerializer, GetContentSerializer,
                          PortalContentOrderBasicSerializer,
                          PortalContentOrderSerializer,
                          PortalContentOrderUpdateSerializer,
                          PortalContentSerializer, PortalSerializer)
from .internal_errors import org_portals_errors
from .filters import Portals_filter_fields, Content_filter_fields


logger = Logger(__name__)

class PortalViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = Portals
    queryset = Portals.objects.all()
    serializer_class = PortalSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = Portals_filter_fields
    filter_fields = get_filter_fields(Portals_filter_fields)
    ordering_fields = Portals_filter_fields

    # @method_decorator(permission_and_license_required(["org_portals.view_portals", ]))
    def list(self, request, tenant=None, *args, **kwargs):
        logger.info("{} requested the list of Portals for tenant: {}".format(request.user.email, tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset()).filter(tenant__id=tenant)
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True, fields=('id', 'name', 'description', 'tenant'))
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True, fields=('id', 'name', 'description', 'tenant'))
            context = {"success": True, "message": _("Portal data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Portal data returned successfully.".format(request.user.email))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 19001
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.view_portals", ]))
    def retrieve(self, request, pk=None, tenant=None, *args, **kwargs):
        logger.info("{} requested to retrieve Portal details for id: {} for tenant: {}.".format(request.user.email, pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 19002
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("Portal details retrieved successfully"), "data": serializer.data}
            logger.info("{} Portal details retrieved successfully for id: {} for tenant: {}.".format(request.user.email, pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 19003
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.add_portals", ]))
    def create(self, request, tenant=None, *args, **kwargs):
        logger.info("{} send data to create Portal for tenant: {}".format(request.user.email, tenant))
        try:
            req_name = request.data.get('name','').lower().strip().replace(" ", "_")
            portal_obj = Portals.objects.filter(slug=req_name)
            if portal_obj:
                internal_error = 19004
                context = {'error': "Portal with this name already exists", "success": False, "message": _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, request.data.get('name','')), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            request.data['tenant'] = tenant # Adding tenant to the request.data dict, so that we'll be able to serialize the data having tenant data.
            serializer = self.serializer_class(data=request.data, fields=('id', 'name', 'description', 'tenant'))
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("Portal has been added successfully."), "data": self.serializer_class(obj, fields=('id', 'name', 'description', 'tenant')).data}
                logger.info("{} Portal has been added successfully for tenant: {}.".format(request.user.email, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 19005
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 19006
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, tenant=None, *args, **kwargs):
        logger.info("{} requested to update Portal for id: {} for tenant: {}".format(request.user.email, pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 19007
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            req_name = request.data.get('name','')
            if obj.name != req_name:
                req_name = request.data.get('name','').lower().strip().replace(" ", "_")
                portal_obj = Portals.objects.filter(slug=req_name)
                if portal_obj:
                    internal_error = 19008
                    context = {'error': "Portal with this name already exists", "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
                    logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, request.data.get('name','')), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Portal details updated successfully"), "data": self.serializer_class(obj, fields=('id', 'name', 'description')).data}
                logger.info("{} Portal details updated successfully for id: {} for tenant: {}".format(request.user.email, pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 19009
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 19010
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.delete_portals", ]))
    def destroy(self, request, pk=None, tenant=None, *args, **kwargs):
        logger.info("{} requested to delete Portal for id: {}".format(request.user.email, pk))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 19011
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {"success": True, "message": _("Portal details deleted successfully"), "data": None}
            logger.info("{} Portal details deleted successfully for id: {} for tenant: {}".format(request.user.email, pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 19012
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ContentViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = Content
    queryset = Content.objects.all()
    serializer_class = ContentSerializer
    list_serializer_class = GetContentSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = Content_filter_fields
    filter_fields = get_filter_fields(Content_filter_fields)
    ordering_fields = Content_filter_fields

    # @method_decorator(permission_and_license_required(["org_portals.view_content", ]))
    def list(self, request, tenant=None, *args, **kwargs):
        logger.info("{} requested the list of Content for tenant: {}".format(request.user.email, tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset()).filter(tenant__id=tenant)
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.list_serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.list_serializer_class(filtered_queryset, many=True)
            context = {"success": True, "message": _("Content data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Content data returned successfully for tenant: {}.".format(request.user.email, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 19013
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.view_content", ]))
    def retrieve(self, request, pk=None, tenant=None, *args, **kwargs):
        logger.info("{} requested to retrieve Content details for id: {} for tenant: {}".format(request.user.email, pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 19014
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.list_serializer_class(obj)
            context = {"success": True, "message": _("Content details retrieved successfully"), "data": serializer.data}
            logger.info("{}, Content details retrieved successfully for id: {}".format(request.user.email, pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 19015
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.add_content", ]))
    def create(self, request, tenant=None, *args, **kwargs):
        logger.info("{} send data to create Content for tenant: {}".format(request.user.email, tenant))
        try:
            req_name = request.data.get('name','').lower().strip().replace(" ", "_")
            content_obj = Content.objects.filter(slug=req_name, tenant__id=tenant)
            if content_obj:
                internal_error = 19016
                context = {'error': "Content with this name already exists", "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, request.data.get('name','')), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            request.data['tenant'] = tenant
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("Content has been added successfully."), "data": self.list_serializer_class(obj).data}
                logger.info("{} Content has been added successfully.".format(request.user.email))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 19017
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 19018
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, tenant=None, *args, **kwargs):
        logger.info("{} requested to update Content details for id: {} for tenant: {}".format(request.user.email, pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 19019
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            req_name = request.data.get('name','')
            if obj.name != req_name:
                req_name = request.data.get('name','').lower().strip().replace(" ", "_")
                content_obj = Content.objects.filter(slug=req_name)
                if content_obj:
                    internal_error = 19020
                    context = {'error': "Content with this name already exists", "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
                    logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, request.data.get('name','')), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            #TODO Don't unpublish published content
            if "is_published" in request.data and not request.data["is_published"] and PortalContentOrder.objects.filter(content=obj).exists():
                internal_error = 19021
                context = {"error":_("This content is already being used in some of your portals. Please remove this content from the related portals and then unpublish."),
                 "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            request.data['tenant'] = tenant
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Content details updated successfully"), "data": self.list_serializer_class(obj).data}
                logger.info("{} Content details updated successfully of id: {}".format(request.user.email, pk))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 19022
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 19023
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.delete_content", ]))
    def destroy(self, request, pk=None, tenant=None, *args, **kwargs):
        logger.info("{} requested to delete Content details for id: {} for tenant: {}".format(request.user.email, pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 19024
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {"success": True, "message": _("Content details deleted successfully"), "data": None}
            logger.info("{} Content details deleted successfully for id: {}".format(request.user.email, pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 19025
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PortalContentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    model = Portals
    queryset = Portals.objects.all()
    serializer_class = PortalContentSerializer

    def list(self, request, tenant=None):
        logger.info("{} requested the list of Portal Content for tenant: {}".format(request.user.email, tenant))
        try:
            HistoryProcess = process_engine.HistoryProcessApi
            list_historic_process = HistoryProcess.list_historic_process_instances
            Query = process_engine.QueryApi
            query_historic_process = Query.query_historic_process_instance
            ProcessDefinitions = process_engine.ProcessDefinitionsApi
            get_process = ProcessDefinitions.get_process_definition

            query_params = {}
            query_params["involved_user"] = request.user.email
            action = call(module=HistoryProcess,func= list_historic_process,data=query_params, request=request, type="get", tenant_id=tenant)[0]
            if action["size"] == 0:
                req_body = {}
                req_body["sort"] = "startTime"
                req_body["order"] = "desc"
                req_body["size"] = 1
                var_body = {}
                var_body["name"] = "initiator"
                var_body["operation"] = "equals"
                var_body["variableOperation"] = "EQUALS"
                var_body["value"] = request.user.userId
                req_body["variables"] = []
                req_body["variables"].append(var_body)
                action = call(module=Query,func= query_historic_process,data=req_body, request=request, type="post", tenant_id=tenant, read_replica=True)[0]
            if action["size"] == 0:
                context = {'success': True, 'message': _('User Not involved in any process.')}
                logger.info("{} User Not involved in any process for tenant: {}.".format(request.user.email, tenant))
                return Response(context, status=status.HTTP_200_OK)
            data={}
            data["process_definition_id"]=action["data"][0]["processDefinitionId"]
            res = call(module=ProcessDefinitions,func= get_process,data=data, request=request, type="get", tenant_id=tenant, read_replica=True)[0]
            workflow_key = res["key"]
            try:
                workflow = OrganisationWorkflow.objects.get(process_key=workflow_key, tenant__id=tenant)
                portal = self.model.objects.get(id=workflow.portal.pk, tenant__id=tenant)
                serializer = self.serializer_class(portal)
                context = {"success": True, "message": _("Portal retrieved successfully"), "data": serializer.data}
                logger.info("{} Portal retrieved successfully for tenant: {}.".format(request.user.email, tenant))
                return Response(context, status=status.HTTP_200_OK)
            except Exception as error:
                internal_error = 19026
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
        except Exception as error:
            internal_error = 19027
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None):
        context = {'error': 'Method not allowed.', 'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    #     try:
    #         try:
    #             obj = self.model.objects.get(id=workflow.portal.pk)
    #         except Exception as error:
    #             context = {'error': str(error), 'success': False, 'message': _('ID not found')}
    #             return Response(context, status=status.HTTP_404_NOT_FOUND)
    #         serializer = self.serializer_class(obj)
    #         context = {"success": True, "message": _("Content details for an portal retrieved successfully"), "data": serializer.data}
    #         return Response(context, status=status.HTTP_200_OK)
    #     except Exception as error:
    #         context = {'error': str(error), 'success': False, 'message': _('Failed to retrieve portal details')}
    #         return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PortalContentOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = PortalContentOrder
    queryset = PortalContentOrder.objects.all().order_by('order')
    serializer_class = PortalContentOrderBasicSerializer
    update_serializer_class = PortalContentOrderUpdateSerializer
    parsed_serializer_class = PortalContentOrderSerializer

    # @method_decorator(permission_and_license_required(["org_portals.view_portalcontentorder", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Portal Content Order".format(request.user.email))
        try:
            page = self.paginate_queryset(self.get_queryset().filter(portal__tenant=tenant))
            if page is not None:
                serializer = self.parsed_serializer_class(self.get_queryset(), many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.parsed_serializer_class(self.get_queryset(), many=True)
            context = {
                "success": True, "message": _("Portal content order details returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Portal content order details returned successfully for tenant: {}.".format(request.user.email, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 19028
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None, tenant=None):
        context = {'error': 'Method not allowed.', 'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # @method_decorator(permission_and_license_required(["org_portals.change_portalcontentorder", ]))
    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Portal Content Order for id: {} for tenant: {}".format(request.user.email, pk, tenant))
        try:
            portal_content_objects = PortalContentOrder.objects.filter(portal=pk, portal__tenant=tenant)
            if not portal_content_objects:
                internal_error = 19029
                context = {'error': None, 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            serializer = self.update_serializer_class(portal_content_objects, data=request.data, many=True, partial=True, fields=('id', 'order'))
            if serializer.is_valid():
                modified_objects = serializer.save()
                serialized_data = self.parsed_serializer_class(modified_objects, many=True).data
                context = {"success": True, "message": _("Portal content order changed successfully"), "error": None, "data": serialized_data}
                logger.info("{} Portal content order changed successfully for id: {} for tenant: {}".format(request.user.email, pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 19030
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 19031
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.add_portalcontentorder", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create Portal Content Order for tenant: {}".format(request.user.email, tenant))
        try:
            for item in request.data:
                item["tenant"] = tenant
            serializer = self.serializer_class(data=request.data, many=True)
            if serializer.is_valid():
                objects = serializer.save()
                context = {
                    "success": True, "message": _("Portal content order created successfully."), "data": self.parsed_serializer_class(objects, many=True).data}
                logger.info("{} Portal content order created successfully for tenant: {}.".format(request.user.email, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 19032
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_portals_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_portals_errors, internal_error).format(request.user.email, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 19033
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.delete_portalcontentorder", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete Portal Content Order for id: {}".format(request.user.email, pk))
        try:
            try:
                obj = self.model.objects.get(id=pk, portal__tenant=tenant)
            except Exception as error:
                internal_error = 19034
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
                logger.info(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            self.perform_destroy(obj)

            context = {
                "success": True, "message": _("Portal content order deleted successfully."), "data": None}
            logger.info("{} Portal content order deleted successfully for id: {} for tenant: {}".format(request.user.email, pk, tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 19035
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_portals_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_portals_errors, internal_error).format(request.user.email, pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
