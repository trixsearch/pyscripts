from django.contrib import admin
from .models import License
from admin_adv_search_builder.filters import AdvancedSearchBuilder

@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display=['name', 'transactions', 'created_at', 'updated_at']
    search_fields = ('slug',)
    ordering = ('slug',)
    filter_horizontal = ('permissions',)
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)
