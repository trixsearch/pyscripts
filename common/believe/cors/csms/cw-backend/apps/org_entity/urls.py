from django.conf.urls import url
from rest_framework.routers import DefaultRouter

from .views import (OrganisationEntityMasterModelViewSet,
                        OrganisationEntityMasterDataViewSet,
                        OrganisationEntityViewsViewSet,
                        OrganisationEntityAuditLogViewSet, OrganisationEntityMasterDataDeleteViewSet, CandidateHistoryViewSet)

router = DefaultRouter(trailing_slash=False)

app_name = 'organisation_entity'

router.register('master/data', OrganisationEntityMasterDataViewSet, basename='master_data')
router.register('master/audit_log', OrganisationEntityAuditLogViewSet, basename="entity_audit_log")
router.register('master/entity_views', OrganisationEntityViewsViewSet, basename='entity_views')
router.register('master/audit', CandidateHistoryViewSet, basename='audit_history')
router.register('master', OrganisationEntityMasterModelViewSet, basename='master_model')


urlpatterns = [
    url('^model/(?P<entity_key>.+)/(?P<search_key>.+)/(?P<search_value>.+)',
        OrganisationEntityMasterDataDeleteViewSet.as_view({'delete': 'delete'}), name="entity_delete"),
] + router.urls
