from rest_framework.routers import DefaultRouter
from .views import LicenseViewSet

router = DefaultRouter(trailing_slash=False)

router.register('', LicenseViewSet, basename='categories')

urlpatterns = [
    *router.urls
]
