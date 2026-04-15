from rest_framework.routers import DefaultRouter

from .views import OrganisationListsViewSet, OrganisationAdvancedListsViewSet

router = DefaultRouter(trailing_slash=False)
app_name = 'organisation_lists'

router.register('advanced', OrganisationAdvancedListsViewSet, basename='org_advanced_lists')
router.register('', OrganisationListsViewSet, basename='org_lists')

urlpatterns = [
    *router.urls
]
