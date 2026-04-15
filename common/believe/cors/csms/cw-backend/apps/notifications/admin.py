from django.contrib import admin
from .models import Notification
from admin_adv_search_builder.filters import AdvancedSearchBuilder
# Register your models here.
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient','is_seen','created_at','updated_at']
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)
