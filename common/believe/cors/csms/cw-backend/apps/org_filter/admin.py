from django.contrib import admin
from .models import OrganisationFilter
from admin_adv_search_builder.filters import AdvancedSearchBuilder
# Register your models here.

class OrganisationFilterAdmin(admin.ModelAdmin):
    list_display = ['user', 'processDefinitionKey', "created_at", "updated_at"]
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

admin.site.register(OrganisationFilter, OrganisationFilterAdmin)
