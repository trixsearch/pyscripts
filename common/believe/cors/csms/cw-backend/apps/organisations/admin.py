from django.contrib import admin
from .models import Organisation, OrganisationLicense, ScheduledReport
from import_export.admin import ImportExportActionModelAdmin
from admin_adv_search_builder.filters import AdvancedSearchBuilder

class MyTenantFilterAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super(MyTenantFilterAdmin, self).get_queryset(request)
        if request.user.tenant:
            return qs.filter(tenant=request.user.tenant)
        return qs

    def render_change_form(self, request, context, *args, **kwargs):
        context['adminform'].form.fields['tenant'].queryset = Organisation.objects.all()
        if request.user.tenant:
            context['adminform'].form.fields['tenant'].queryset = Organisation.objects.filter(id=request.user.tenant.id)
        return super(MyTenantFilterAdmin, self).render_change_form(request, context, *args, **kwargs)


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display=['name', 'Licence', 'support_notification', 'created_at', 'updated_at', 'id']
    ordering = ['-created_at']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10
    search_fields=['name']
    
    def get_queryset(self, request):
        qs = super(OrganisationAdmin, self).get_queryset(request)
        if request.user.tenant:
            return qs.filter(id=request.user.tenant.id)
        return qs

    def Licence(self, instance):
        return instance.organisationlicense.license.name

@admin.register(OrganisationLicense)
class OrganisationLicenseAdmin(admin.ModelAdmin):
    list_display=['license', 'organisation', 'created_at', 'updated_at', 'organisation']
    list_filter   = (AdvancedSearchBuilder,)
    list_per_page = 10

    def get_queryset(self, request):
        qs = super(OrganisationLicenseAdmin, self).get_queryset(request)
        if request.user.tenant:
            return qs.filter(organisation=request.user.tenant)
        return qs
    
    def render_change_form(self, request, context, *args, **kwargs):
        context['adminform'].form.fields['organisation'].queryset = Organisation.objects.all()
        if request.user.tenant:
            context['adminform'].form.fields['organisation'].queryset = Organisation.objects.filter(id=request.user.tenant.id)
        return super(OrganisationLicenseAdmin, self).render_change_form(request, context, *args, **kwargs)

admin.site.register(ScheduledReport)
admin.site.site_header = 'Ezedox administration'
admin.site.site_title = 'Ezedox'
admin.site.index_template = 'admin/custom_index.html'
