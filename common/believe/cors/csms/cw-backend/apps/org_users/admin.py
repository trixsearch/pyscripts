import os
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django import forms
from django.contrib.auth.models import Permission
from django.utils.translation import gettext_lazy as _
from django.utils.encoding import force_text
from .utils import send_forgot_password_email
from .models import InternalUser, ExternalUser, OrganisationUser, OpenExternalUser, PlatformPolicy
from .resources import ExternalUserResource, OrgUserResources
from import_export.admin import ImportExportActionModelAdmin
from admin_adv_search_builder.filters import AdvancedSearchBuilder
from ezedox.settings import BASE_ORG_DOMAIN_URL
from apps.organisations.admin import MyTenantFilterAdmin
from apps.org_location.models import Location
"""
 the models here to publish them in the Django Admin Panel
"""

@admin.register(InternalUser)
class InternalUserAdmin(MyTenantFilterAdmin):
    list_display=['email', 'first_name', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    search_fields = ['first_name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

@admin.register(ExternalUser)
class ExternalUserAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['email', 'first_name', 'mobile', 'created_at', 'updated_at', 'tenant']
    resource_class = ExternalUserResource
    date_hierarchy = 'created_at'
    search_fields = ['id','first_name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

class UserListFilter(admin.SimpleListFilter):
    title = _('Is Deleted ?')
    parameter_name = 'is_deleted'

    def choices(self, changelist):
        yield {
            'selected': self.value() is None,
            'query_string': changelist.get_query_string({}, [self.parameter_name]),
            'display': 'No',
        }
        for lookup, title in self.lookup_choices:
            yield {
                'selected': self.value() == force_text(lookup),
                'query_string': changelist.get_query_string({self.parameter_name: lookup}, []),
                'display': title,
            }

    def lookups(self, request, model_admin):
        return (
            ('1', _('Yes')),
            ('2', _('All')),
        )

    def queryset(self, request, queryset):

        if self.value() == '1':
            return OrganisationUser.default_manager.deleted_set()
        if self.value() == '2':
            return OrganisationUser.default_manager.all_with_deleted()


def recover_user(modeladmin, request, queryset):
    for user in queryset:
        status = user.is_deleted
        if status:
            user.is_deleted = False
            user.save()
            send_forgot_password_email(request, user)
            modeladmin.message_user(request, "email to reset password has sent to email id %s" % user.email)

def erase_user(modeladmin, request, queryset):
    for user in queryset:
        user.erase()

class PlatformPolicyField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        return 'Name: {} Tenant: {}'.format(obj.name, obj.tenant.name)
    
@admin.register(OrganisationUser)
class OrganisationUserAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display = ['email', 'first_name', 'credentials', 'created_at', 'updated_at', 'tenant']
    list_filter = [UserListFilter, AdvancedSearchBuilder,]
    resource_class = OrgUserResources
    # actions = [recover_user, erase_user]
    date_hierarchy = 'created_at'
    search_fields = ['first_name', 'email']
    list_per_page = 10
    raw_id_fields = ['manager']

    def get_actions(self, request):
        actions = super().get_actions(request)
        actions['recover_user'] = (recover_user, 'recover_user', 'Recover User %(verbose_name_plural)s')
        actions['erase_user'] = (erase_user, 'erase_user', 'Erase User %(verbose_name_plural)s')
        return actions
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "manager" and request.user.tenant:
            kwargs["queryset"] = OrganisationUser.objects.filter(tenant=request.user.tenant)
        if db_field.name == "location" and request.user.tenant:
            kwargs["queryset"] = Location.objects.filter(tenant=request.user.tenant)
        if db_field.name == 'platform_policy':
            return PlatformPolicyField(queryset=PlatformPolicy.objects.all())
        return super(OrganisationUserAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def credentials(self, instance):
        base_org_domain_url = BASE_ORG_DOMAIN_URL
        # user = Permission.objects.filter(group__user=instance).values_list('codename',flat=True)
        if instance.tenant:
            url = reverse('users:get_credentials', kwargs = {'tenant' : str(instance.tenant.id)})
            # if "manage_modeller" in user and not instance.is_deleted:
            if not instance.is_deleted:
                return format_html(
                    '<button name={buttonName} class="button clickme1" data1={url} data2={base_org_domain_url}>Get Credentials</button>'.format(buttonName=instance.id,url=url, base_org_domain_url=base_org_domain_url)
                )

    class Media:
        js = ("admin/js/credentials.js", )

@admin.register(OpenExternalUser)
class OpenExternalUserAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_display=['email', 'first_name', 'mobile', 'created_at', 'updated_at', 'tenant']
    date_hierarchy = 'created_at'
    search_fields = ['id','first_name']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10


@admin.register(PlatformPolicy)
class PlatformPolicyAdmin(ImportExportActionModelAdmin, MyTenantFilterAdmin):
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10
    search_fields = ['id','first_name']
    list_display = ['name', 'policy_id', 'created_at', 'tenant']
