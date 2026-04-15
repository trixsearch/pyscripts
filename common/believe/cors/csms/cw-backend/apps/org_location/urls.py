from rest_framework.routers import DefaultRouter

from .views import LocationViewSet

router = DefaultRouter(trailing_slash=False)

router.register('', LocationViewSet, basename='location')

urlpatterns = [
    *router.urls
]
