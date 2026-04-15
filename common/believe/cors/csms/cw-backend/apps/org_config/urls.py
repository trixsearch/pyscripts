from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (OrganisationSMTPViewSet,
                    ReportDownloadViewSet, TenantEmail, DocGenerator,ReportTemplateViewSet,
                    DocumentTemplates,EmailViewSet, EmailSettingsViewSet,
                    MultiEmailViewSet, TenantSMS, OrganisationCustomAttributeViewSet, ParseJinjaTemplate, 
                    EmailDigestViewSet, ConfigDashboardViewSet, JobConfigViewSet, EventConfigViewSet, ChartNameViewSet)

app_name = 'org_config'

router = DefaultRouter(trailing_slash=False)

router.register('doc', DocGenerator, basename="doc_generator")
router.register('document', DocumentTemplates,
                basename="document_template")
router.register('report/template', ReportTemplateViewSet,
                basename="report_template")
router.register('report', ReportDownloadViewSet, basename="report")
router.register('email_digest', EmailDigestViewSet, basename='org_email_digest')
router.register('smtp', OrganisationSMTPViewSet, basename='org_smtp')
router.register('custom_attribute', OrganisationCustomAttributeViewSet,
                basename="custom_attribute")
router.register('dashboard', ConfigDashboardViewSet, basename="org_config_dashbiard")
router.register('job_config', JobConfigViewSet, basename="view_config_job")
router.register('event_config', EventConfigViewSet, basename="event_config_job")
router.register('chart_name', ChartNameViewSet, basename="chart_name")

urlpatterns = [
    path("parse_jinja", ParseJinjaTemplate.as_view(),
         name="parse_jinja"),
    path("sms", TenantSMS.as_view(), name="org_sms"),
    path("email", TenantEmail.as_view(), name="org_email"),
    path("bulkemail", EmailViewSet.as_view(), name="org_bulk_email"),
    path("email_settings", EmailSettingsViewSet.as_view(), name="org_email_settings"),
    path("multiemail", MultiEmailViewSet.as_view(), name="org_multi_email"),
    *router.urls,
]
