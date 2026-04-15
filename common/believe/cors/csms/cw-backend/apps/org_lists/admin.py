from import_export.admin import ImportExportActionModelAdmin
from django.contrib import admin
from django import forms
from django.core.validators import FileExtensionValidator
from apps.org_apps.utils import get_uploaded_file
from .models import OrganisationLists, OrganisationAdvancedLists
from .resources import ListResource, AdvancedListResource
from .utils import get_csv_data
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin

# Register your models here.


class AdvancedListsForm(forms.ModelForm):
    file = forms.FileField(validators=[FileExtensionValidator(['csv'])])
    class Meta:
        model = OrganisationAdvancedLists
        fields = ['name', 'key', 'file', 'tenant']


class OrganisationListsAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['name', 'created_at', 'updated_at', 'tenant']
    resource_class = ListResource
    search_fields = ['name']
    list_filter   =  (AdvancedSearchBuilder,)
    list_per_page = 10

class OrganisationAdvancedListsAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['name', 'created_at', 'updated_at', 'tenant']
    resource_class = AdvancedListResource
    search_fields = ['name']
    list_filter   =  (AdvancedSearchBuilder,)
    list_per_page = 10

    def get_form(self, request, obj=None, **kwargs):
        if obj:
            self.form = forms.ModelForm
        else:
            self.form = AdvancedListsForm
        return super(OrganisationAdvancedListsAdmin, self).get_form(request, obj, **kwargs)

    def save_model(self, request, obj, form, change):
        if 'file' in request.FILES:
            csv_file_path = get_uploaded_file(request.FILES['file'])
            obj.lists = get_csv_data(csv_file_path)
            obj.save()
        super().save_model(request, obj, form, change)


admin.site.register(OrganisationLists, OrganisationListsAdmin)

admin.site.register(OrganisationAdvancedLists, OrganisationAdvancedListsAdmin)
