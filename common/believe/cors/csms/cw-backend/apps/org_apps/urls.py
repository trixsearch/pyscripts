from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import (DashboardChartViewSet,
                    OrganisationWorkflowViewSet, ProcessCountViewSet,
                    StartProcessFormViewSet, StartProcessOpenFormViewSet,
                    DatedProcessCountViewSet, ProcessDataViewset, 
                    ProcessViewViewSet, OrganisationWorkflowAccessViewSet
                )

router = DefaultRouter(trailing_slash=False)
app_name = 'organisation_apps'
router.register('dated_count', DatedProcessCountViewSet, basename='dated_process_count')
router.register('count', ProcessCountViewSet, basename='process_count')
router.register('process-instances', ProcessDataViewset, basename='process-instances')
router.register('chart', DashboardChartViewSet, basename='process_chart')
router.register('start-form', StartProcessFormViewSet, basename='start_process_form')
router.register('start-open-form', StartProcessOpenFormViewSet, basename='start_open_process_form')
router.register('process_view',ProcessViewViewSet, basename="process_view")
router.register('workflow_access', OrganisationWorkflowAccessViewSet, basename='workflow_access')
router.register('', OrganisationWorkflowViewSet, basename='app')

urlpatterns = [
    *router.urls
]
