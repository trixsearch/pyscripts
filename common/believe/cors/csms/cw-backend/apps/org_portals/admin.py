from django.contrib import admin
from import_export.admin import ImportExportActionModelAdmin
from .resources import PortalsResource, ContentsResource, PortalContentOrderResource
from admin_adv_search_builder.filters import AdvancedSearchBuilder
# Register your models here.
from .models import Portals, Content, PortalContentOrder
from apps.organisations.admin import MyTenantFilterAdmin


class PortalsAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display = ['name', 'created_at', 'updated_at', 'tenant']
    resource_class = PortalsResource
    search_fields = ['name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

class ContentAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display = ['name', 'created_at', 'updated_at', 'tenant']
    search_fields = ['name']
    resource_class = ContentsResource
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

class PortalContentOrderAdmin(ImportExportActionModelAdmin, admin.ModelAdmin):
    list_display = ['portal', 'content', 'order', 'created_at', 'updated_at', 'tenant']
    search_fields = ['portal__name','content__name']
    resource_class = PortalContentOrderResource
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

    def tenant(self, obj):
        if obj.portal.tenant:
            return obj.portal.tenant

    def get_queryset(self, request):
        qs = super(PortalContentOrderAdmin, self).get_queryset(request)
        if request.user.tenant:
            return qs.filter(portal__tenant=request.user.tenant)
        return qs
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "portal" and request.user.tenant:
            kwargs["queryset"] = Portals.objects.filter(tenant=request.user.tenant)
        if db_field.name == "content" and request.user.tenant:
            kwargs["queryset"] = Content.objects.filter(tenant=request.user.tenant)
        return super(PortalContentOrderAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(Portals, PortalsAdmin)
admin.site.register(Content, ContentAdmin)
admin.site.register(PortalContentOrder, PortalContentOrderAdmin)
