from django import forms
from django.contrib import admin
from import_export.admin import ImportExportActionModelAdmin
from .models import (
                    ReportTemplate,
                    DocumentTemplate,
                    CustomAttribute, ProcessInstanceCleanupConfig, ProcessInstanceCleanupLog
                    )
from .resources import DocumentTemplateResource, ReportTemplateResource, CustomAttributeResource
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from django import forms
from apps.organisations.admin import MyTenantFilterAdmin
from apps.org_entity.models import OrganisationEntityMasterModel
from apps.org_apps.models import OrganisationWorkflow

class ReportTemplateAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['name', 'created_at', 'updated_at', 'tenant']
    resource_class = ReportTemplateResource
    search_fields = ['name']
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "apps" and request.user.tenant:
            kwargs["queryset"] = OrganisationWorkflow.objects.filter(tenant=request.user.tenant)
        if db_field.name == "entity_master_model" and request.user.tenant:
            kwargs["queryset"] = OrganisationEntityMasterModel.objects.filter(tenant=request.user.tenant)
        return super(ReportTemplateAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)

class DocumentTemplateForm(forms.ModelForm):

    class Meta:
        model = DocumentTemplate
        fields = ['name', 'key', 'version', 'description', 'html', 'tenant']

    class Media:
        js = ("admin/js/DocTemplatePreview.js",
            )
        css = {
            "all": ("admin/css/templatePreview.css",
            )
        }
class DocumentTemplateAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['name', 'key', 'version', 'created_at', 'updated_at', 'tenant']
    resource_class = DocumentTemplateResource
    search_fields = ['name', 'key']
    form = DocumentTemplateForm
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)


class CustomAttributeAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['type', 'created_at', 'updated_at', 'tenant']
    resource_class = CustomAttributeResource
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)

admin.site.register(ReportTemplate, ReportTemplateAdmin)
admin.site.register(DocumentTemplate, DocumentTemplateAdmin)
admin.site.register(CustomAttribute, CustomAttributeAdmin)

@admin.register(ProcessInstanceCleanupConfig)
class ProcessInstanceCleanupConfigAdmin(admin.ModelAdmin):
    list_display = ['batch_size', 'cleanup_after_days', 'batch_limit']
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)

@admin.register(ProcessInstanceCleanupLog)
class ProcessInstanceCleanupLogAdmin(admin.ModelAdmin):
    list_display = ['start_time', 'end_time', 'total_process_instances', 'status_code', 'failure', 'failure_text']
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)