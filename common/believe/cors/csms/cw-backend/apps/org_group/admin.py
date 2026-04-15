from django.contrib import admin
from import_export.admin import ImportExportActionModelAdmin
from .resources import OrganisationGroupResource
from .models import OrganisationGroup
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin
from apps.org_users.models import OrganisationUser

class OrganisationGroupAdmin(ImportExportActionModelAdmin,MyTenantFilterAdmin):
    list_display=['name', 'created_at', 'updated_at', 'tenant']
    resource_class = OrganisationGroupResource
    search_fields = ['name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "users" and request.user.tenant:
            kwargs["queryset"] = OrganisationUser.objects.filter(tenant=request.user.tenant)
        return super(OrganisationGroupAdmin, self).formfield_for_manytomany(db_field, request, **kwargs)

admin.site.register(OrganisationGroup, OrganisationGroupAdmin)
