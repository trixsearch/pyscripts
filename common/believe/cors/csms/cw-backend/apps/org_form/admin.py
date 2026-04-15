from django.contrib import admin
from django.utils.html import format_html
from django.dispatch import receiver

from import_export.admin import ImportExportActionModelAdmin
from import_export.signals import post_import
from django.db.models.signals import post_save

from utils.cache import delete_cache, set_cache
from utils.loggerwrapper import Logger

from ezedox.settings import FILE_DOMAIN_URL, DJANGO_ADMIN_DOMAIN_URL
from .models import OrganisationForm, OrganisationFile, Transaction
from .resources import FormResource
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from apps.organisations.admin import MyTenantFilterAdmin
from apps.org_users.models import OrganisationUser
logger = Logger(__name__)

class OrganisationFormAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['name', 'tenant_name', 'key', 'version', 'form_link', 'created_at', 'updated_at', 'tenant']
    date_hierarchy = 'created_at'
    resource_class = FormResource
    search_fields = ['name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

    def tenant_name(self, instance):
        return instance.tenant.name
    tenant_name.short_description = 'Tenant'

    def form_link(self, instance):
        return format_html(
            '''<a class="button process-diagram" onclick="editForm('{0}','{1}','{2}','{3}','{4}')">Edit Form</a>'''.format(FILE_DOMAIN_URL, str(instance.tenant.id), instance.key, instance.version, DJANGO_ADMIN_DOMAIN_URL)
        )

    class Media:
        js = (  "admin/js/edit_form.js",)

class OrganisationFileAdmin(MyTenantFilterAdmin):
    list_display=['name', 'created_at', 'updated_at', 'tenant']
    date_hierarchy = 'uploaded_at'
    search_fields = ['name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10
    raw_id_fields = ['transaction_id', 'user']

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user" and request.user.tenant:
            kwargs["queryset"] = OrganisationUser.objects.filter(tenant=request.user.tenant)
        if db_field.name == "transaction_id" and request.user.tenant:
            kwargs["queryset"] = Transaction.objects.filter(tenant=request.user.tenant)
        return super(OrganisationFileAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)


# @receiver(post_import, dispatch_uid='form_import')
# def _post_import(sender, model, **kwargs):
#     if model == OrganisationForm:
#         form_qs = model.objects.all()
#         for form_obj in form_qs:
#             delete_cache(form_obj.key + "::" + str(form_obj.version) + str(form_obj.tenant.id))
#             logger.info('Cleared cache for {}::{}'.format(form_obj.key, form_obj.version))

@receiver(post_save, sender=OrganisationForm, dispatch_uid="form_cache")
def form_cache(sender, instance, created, **kwargs):
    cache_key = instance.key + "::" + str(instance.version) + str(instance.tenant.id)
    if created:
        set_cache(cache_key, instance)
    else:
        delete_cache(cache_key)
        set_cache(cache_key, instance)


admin.site.register(OrganisationForm, OrganisationFormAdmin)
admin.site.register(OrganisationFile, OrganisationFileAdmin)
