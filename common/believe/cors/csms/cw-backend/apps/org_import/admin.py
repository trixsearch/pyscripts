from django.contrib import admin

from .models import EntityImport
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin
from apps.org_users.models import OrganisationUser

@admin.register(EntityImport)
class EntityAdmin(MyTenantFilterAdmin):
    list_display = ('user__email', 'status', 'started_at', 'created_at', 'updated_at', 'tenant')
    ordering = ['-started_at']
    search_fields = ['user__email']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user" and request.user.tenant:
            kwargs["queryset"] = OrganisationUser.objects.filter(tenant=request.user.tenant)
        return super(EntityAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)

    def user__email(self, instance):
        if instance.user and instance.user.email:
            return instance.user.email
    