from django.contrib import admin
from django.urls import reverse
from django import forms
from django.utils.html import format_html
from import_export.admin import ImportExportActionModelAdmin
from .resources import OrganisationWorkflowResource, WorkflowAccessResource
from .models import OrganisationWorkflow, WorkflowAccess, ProcessVarSync
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin
from apps.org_form.models import OrganisationForm
from apps.org_jobs.models import HiringState
from apps.org_portals.models import Portals
from apps.org_users.models import PlatformPolicy

@admin.register(OrganisationWorkflow)
class ProcessModelGeneration(ImportExportActionModelAdmin,MyTenantFilterAdmin):

    list_display = ['name','is_open','process_diagram','date_filter','view_process','tenant']
    fields =['is_process_initiable_from_app_context', 'app_key','is_open','is_admin_initiable','name','description','icon_class','process_key',
    'open_forms','open_form_link','portal','selected_form_fields','selected_forms','bulk_sample_url','is_global','bulk_support','process_state_list', 
    'process_search_list', 'order_id', 'tenant','kafka_topic', 'kafka_domain_name','kafka_topic_action','process_view_column', 'task_view_column','filters','process_name', 'custom_default_filter', 'entity']
    readonly_fields = ('open_form_link',)
    search_fields = ['name']
    autocomplete_fields = ['tenant']

    resource_class = OrganisationWorkflowResource
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "open_forms" and request.user.tenant:
            kwargs["queryset"] = OrganisationForm.objects.filter(tenant=request.user.tenant)
        if db_field.name == "portal" and request.user.tenant:
            kwargs["queryset"] = Portals.objects.filter(tenant=request.user.tenant)
        return super(ProcessModelGeneration, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "forms" and request.user.tenant:
            kwargs["queryset"] = OrganisationForm.objects.filter(tenant=request.user.tenant)
        return super(ProcessModelGeneration, self).formfield_for_manytomany(db_field, request, **kwargs)

    def process_diagram(self, instance):

        return format_html(
            '<a class="button process-diagram" data-url="{}" href="#">Get diagram</a>',
            reverse('organisation_apps:app-get-diagram', kwargs = {'tenant' : instance.tenant.id, 'pk' : instance.id}),
        )


    def date_filter(self, instance):
        url = reverse('organisation_apps:dated_process_count-detail', kwargs={'tenant' : instance.tenant.id, 'pk': instance.id})
        return format_html(
            'From : <input type="date" class={fromdate} name="from"> To : <input type="date" class={todate} name="to">  <button name={buttonName} data-id={id} class="button submitdate" data1={url}>Go</button>'.format(fromdate=str(instance.id)+'f',todate=str(instance.id)+'t',buttonName=instance.id,url=url,id=instance.id)
        )


    def view_process(self, instance):
        process_key = instance.process_key
        tenant = instance.tenant.id
        return format_html(
            '''<a class='button view-process' data-processkey='{}' data-tenant='{}'>View Process</a>'''.format(process_key, tenant)
        )
    class Media:
        js = (  "admin/js/processdiagram.js",
                "admin/js/processcount.js",
                "admin/js/viewprocess.js",
             )


class PlatformPolicyChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        return 'Name: {} Tenant: {}'.format(obj.name, obj.tenant.name)

class WorkflowChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        return 'Name: {} Tenant: {}'.format(obj.name, obj.tenant.name)

@admin.register(WorkflowAccess)
class WorkflowAccessAdmin(ImportExportActionModelAdmin,admin.ModelAdmin):
    list_display=['app','policy', 'created_at', 'updated_at']
    resource_class = WorkflowAccessResource
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'policy':
            return PlatformPolicyChoiceField(queryset=PlatformPolicy.objects.all())
        if db_field.name == 'app':
            return WorkflowChoiceField(queryset=OrganisationWorkflow.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(ProcessVarSync)
class ProcessVarSyncAdmin(ImportExportActionModelAdmin,admin.ModelAdmin):
    list_display=['app','kafka_topic', 'kafka_domain_name', 'kafka_topic_action']
    autocomplete_fields = ['app', 'tenant']
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)