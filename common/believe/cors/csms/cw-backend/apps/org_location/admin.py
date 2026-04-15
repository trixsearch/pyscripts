from django.contrib import admin
from import_export.admin import ImportExportActionModelAdmin
from .models import Location
from .resources import LocationResource
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin

class LocationAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['name', 'platform_id', 'tenant']
    resource_class = LocationResource
    search_fields = ['name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10


admin.site.register(Location, LocationAdmin)
