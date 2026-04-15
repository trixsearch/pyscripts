from django.contrib import admin
from import_export.admin import ImportExportActionModelAdmin
from .models import Department, DepartmentDetail
from .resources import DepartmentDetailResource
from admin_adv_search_builder.filters import AdvancedSearchBuilder

class DepartmentAdmin(admin.ModelAdmin):
    list_display=['name']
    search_fields=['department']
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)


class DepartmentDetailAdmin(ImportExportActionModelAdmin,admin.ModelAdmin):
    list_display=['department_name', "head_email", 'created_at', 'updated_at']
    resource_class = DepartmentDetailResource
    search_fields = ['department__name']
    list_per_page = 10
    list_filter   = (AdvancedSearchBuilder,)

    def department_name(self, instance):
        return instance.department.name

    def head_email(self, instance):
        return instance.head.email

    def created_at(self, instance):
        return instance.department.created_at

    def updated_at(self, instance):
        return instance.department.updated_at

# admin.site.register(Department, DepartmentAdmin)
# admin.site.register(DepartmentDetail, DepartmentDetailAdmin)
