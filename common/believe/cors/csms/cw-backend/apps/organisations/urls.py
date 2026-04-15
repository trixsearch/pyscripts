from rest_framework.routers import DefaultRouter

from .views import OrganisationLicenseViewSet, ManifestViewSet, ScheduledReportViewSet, OrganisationSMSViewSet, OrganisationViewSet

router = DefaultRouter(trailing_slash=False)


router.register('license', OrganisationLicenseViewSet,
                basename="organisation_licenses")
router.register('manifest', ManifestViewSet,
                basename='manifest')

router.register('scheduled_report', ScheduledReportViewSet, basename='organisation_scheduled_report')
router.register('', OrganisationViewSet, basename='organisations')
router.register('org_sms', OrganisationSMSViewSet, basename="org_sms")

urlpatterns = [
    *router.urls,
]
