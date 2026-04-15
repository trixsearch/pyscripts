# Third-Party imports
from django.db.models import Q
from rest_framework import serializers
from utils.dynamic_serializers import DynamicFieldsModelSerializer

# Application imports
from .models import OrganisationWorkflow,ProcessView, WorkflowAccess

class OrganisationWorkflowListSerializer(serializers.ListSerializer):
    def update(self, instance, validated_data):
        # Maps for id->instance and id->data item.
        org_workflow_mapping = {
            org_workflow.id: org_workflow for org_workflow in instance}
        data_mapping = {item['id']: item for item in validated_data}

        # Perform creations and updates.
        modified_objects = []
        for org_workflow_id, data in data_mapping.items():
            org_workflow = org_workflow_mapping.get(
                org_workflow_id, None)
            if org_workflow is None:
                # modified_objects.append(self.child.create(data))
                pass
            else:
                modified_objects.append(self.child.update(org_workflow, data))
        return modified_objects


class OrganisationWorkflowPortalSerializer(DynamicFieldsModelSerializer):
    id = serializers.UUIDField()

    class Meta:
        model = OrganisationWorkflow
        fields = '__all__'
        list_serializer_class = OrganisationWorkflowListSerializer


class OrganisationWorkflowSerializer(serializers.ModelSerializer):
    view_permission = serializers.SerializerMethodField()
    reassign_permission = serializers.SerializerMethodField()
    withdraw_permission = serializers.SerializerMethodField()
    remind_permission = serializers.SerializerMethodField()
    initiate_permission = serializers.SerializerMethodField()
    view_report_permission = serializers.SerializerMethodField()
    download_report_permission = serializers.SerializerMethodField()
    upload_document_permission = serializers.SerializerMethodField()
    bulk_email_permission = serializers.SerializerMethodField()
    system_filter = serializers.SerializerMethodField()

    def get_view_permission(self, obj):
        return True

    def get_reassign_permission(self, obj):
        return True

    def get_withdraw_permission(self, obj):
        return True

    def get_remind_permission(self, obj):
        return True

    def get_initiate_permission(self, obj):
        return True

    def get_view_report_permission(self, obj):
        return True

    def get_download_report_permission(self, obj):
        return True

    def get_upload_document_permission(self, obj):
        return True

    def get_bulk_email_permission(self, obj):
        return True

    def get_system_filter(self, obj):
        return ""
    class Meta:
        model = OrganisationWorkflow
        fields = ('id', 'name', 'description', 'icon_class', 'app_key', 'process_key', 'portal',
                  'view_permission', 'reassign_permission', 'withdraw_permission',
                  'remind_permission', 'initiate_permission', 'view_report_permission',
                  'download_report_permission','upload_document_permission', 'bulk_email_permission', 'is_open',
                  'is_admin_initiable','is_global','bulk_support', 'process_state_list', 'process_search_list',
                  'system_filter', 'is_process_initiable_from_app_context',
                  'process_view_column', 'task_view_column','filters', 'custom_default_filter')


class OrganisationWorkflowDetailsSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrganisationWorkflow
        fields = ('id', 'name', 'description', 'icon_class', 'app_key', 'process_key', 'is_global', 'bulk_support')

class WorkflowAccessSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkflowAccess
        fields = ('id', 'app_id', 'policy_id', 'view', 'reassign', 'withdraw', 'bulk_initiate', 'initiate', 'upload', 'filter_on_task')


class ProcessViewSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProcessView
        fields = '__all__'


class OrganisationWorkflowAllSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = OrganisationWorkflow
        fields = '__all__'
        extra_kwargs = {
                'id': {'read_only': False}
            }

class WorkflowSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = OrganisationWorkflow
        exclude = ('id', 'process_state_list')