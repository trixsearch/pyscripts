from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import OrganisationFormViewSet, OrganisationFileViewSet, UserFileViewSet, ModelerFormViewSet, AadhaarHashViewset, TransactionModelViewSet
app_name = 'org_forms_and_files'

router = DefaultRouter(trailing_slash=False)

router.register('user_files', UserFileViewSet, basename="user_files")
router.register('files', OrganisationFileViewSet, basename="upload_files")
router.register('modeler', ModelerFormViewSet, basename="modeler_forms")
router.register('transaction', TransactionModelViewSet, basename='transactions')
router.register('', OrganisationFormViewSet, basename='org_forms')

urlpatterns = [
    *router.urls,
    path('aadhaar_hash/', AadhaarHashViewset.as_view(), name='hash_aadhaar')
]
