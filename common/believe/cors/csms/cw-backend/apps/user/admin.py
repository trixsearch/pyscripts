from django.contrib import admin

from .models import User
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin
class UserAdmin(MyTenantFilterAdmin):
    list_display=['email', 'created_at', 'updated_at', 'tenant']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10


admin.site.register(User, UserAdmin)
