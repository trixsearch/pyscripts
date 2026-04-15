from rest_framework.routers import DefaultRouter

from .views import GroupViewSet

router = DefaultRouter(trailing_slash=False)

router.register('', GroupViewSet, basename='groups')

urlpatterns = [
    *router.urls
]
