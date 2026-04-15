from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.encoding import force_text
from django.utils.html import format_html
from django.db import connection
from django.core.validators import FileExtensionValidator
from django import forms
from import_export.admin import ImportExportActionModelAdmin
from apps.organisations.models import OrganisationLicense
from .models import (OrganisationEntityMasterModel,
                    OrganisationEntityMasterData,
                    OrganisationEntityView,
                    OrganisationEntityAuditLog,
                    CandidateHistoryModel)
from .resources import OrganisationEntityMasterModelResource, OrganisationEntityViewResource
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin
from apps.org_form.models import OrganisationForm
from apps.org_apps.models import OrganisationWorkflow

# Register your models here.
class EntityListFilter(admin.SimpleListFilter):
    title = _('Is Deleted ?')
    parameter_name = 'is_deleted'

    def choices(self, changelist):

        yield {
            'selected': self.value() is None,
            'query_string': changelist.get_query_string({}, [self.parameter_name]),
            'display': 'No',
        }
        for lookup, title in self.lookup_choices:
            yield {
                'selected': self.value() == force_text(lookup),
                'query_string': changelist.get_query_string({self.parameter_name: lookup}, []),
                'display': title,
            }

    def lookups(self, request, model_admin):

        return (
            ('1', _('Yes')),
            ('2', _('All')),
        )

    def queryset(self, request, queryset):

        if self.value() == '1':
            return OrganisationEntityMasterData.objects.deleted_set()
        if self.value() == '2':
            return OrganisationEntityMasterData.objects.all_with_deleted()

class OrganisationEntityMasterModelAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display = ['name', 'key','is_visible', 'created_at', 'updated_at', 'tenant']
    resource_class = OrganisationEntityMasterModelResource
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "entity_views" and request.user.tenant:
            kwargs["queryset"] = OrganisationEntityView.objects.filter(tenant=request.user.tenant)
        if db_field.name == "entity_forms" and request.user.tenant:
            kwargs["queryset"] = OrganisationForm.objects.filter(tenant=request.user.tenant)
        return super(OrganisationEntityMasterModelAdmin, self).formfield_for_manytomany(db_field, request, **kwargs)

class OrganisationEntityMasterDataAdmin(admin.ModelAdmin):
    list_display = ['candidateId', 'entity_model', 'entity_name', "created_at", "updated_at", "tenant"]
    list_filter = (EntityListFilter, AdvancedSearchBuilder,)
    search_fields = ['entity_name']
    date_hierarchy = 'created_at'
    list_per_page = 10

    def tenant(self, obj):
        if obj.entity_model.tenant:
            return obj.entity_model.tenant

    def get_queryset(self, request):
        qs = super(OrganisationEntityMasterDataAdmin, self).get_queryset(request)
        if request.user.tenant:
            return qs.filter(entity_model__tenant=request.user.tenant)
        return qs
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "entity_model" and request.user.tenant:
            kwargs["queryset"] = OrganisationEntityMasterModel.objects.filter(tenant=request.user.tenant)
        return super(OrganisationEntityMasterDataAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)

class OrganisationEntityViewAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display = ['entity_master_model', 'created_at', 'updated_at', 'tenant']
    resource_class = OrganisationEntityViewResource
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "entity_master_model" and request.user.tenant:
            kwargs["queryset"] = OrganisationEntityMasterModel.objects.filter(tenant=request.user.tenant)
        return super(OrganisationEntityViewAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "entity_workflows" and request.user.tenant:
            kwargs["queryset"] = OrganisationWorkflow.objects.filter(tenant=request.user.tenant)
        if db_field.name == "entity_forms" and request.user.tenant:
            kwargs["queryset"] = OrganisationForm.objects.filter(tenant=request.user.tenant)
        return super(OrganisationEntityViewAdmin, self).formfield_for_manytomany(db_field, request, **kwargs)

class OrganisationEntityAuditLogAdmin(MyTenantFilterAdmin):
    list_display = ['name', 'assignee', "created_at", "updated_at", 'tenant']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

class CandidateAuditLogAdmin(MyTenantFilterAdmin):
    list_display = ['candidate', 'owner', "activity_type", 'tenant']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

admin.site.register(OrganisationEntityMasterModel, OrganisationEntityMasterModelAdmin)
admin.site.register(OrganisationEntityMasterData, OrganisationEntityMasterDataAdmin)
admin.site.register(OrganisationEntityView, OrganisationEntityViewAdmin)
admin.site.register(OrganisationEntityAuditLog, OrganisationEntityAuditLogAdmin)
admin.site.register(CandidateHistoryModel, CandidateAuditLogAdmin)
