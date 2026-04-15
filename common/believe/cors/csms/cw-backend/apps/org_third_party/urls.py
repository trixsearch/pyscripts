from rest_framework.routers import DefaultRouter
from .views import OCRViewSet, PennydropViewSet, MaskAadhaarViewSet

router = DefaultRouter(trailing_slash=False)

app_name = 'third_party'

router.register('ocr', OCRViewSet, basename='ocr_data')
router.register('bank', PennydropViewSet, basename='pennydrop')
router.register('maskAadhaar', MaskAadhaarViewSet, basename='mask_data')
urlpatterns = [
    *router.urls
]
