from rest_framework.routers import DefaultRouter

from .views import PortalViewSet, ContentViewSet, PortalContentViewSet, PortalContentOrderViewSet

router = DefaultRouter(trailing_slash=False)

router.register('external', PortalContentViewSet, basename='portal_content')
router.register('content/order', PortalContentOrderViewSet,
                basename='portal_content_order')

router.register('content', ContentViewSet, basename='content')
router.register('', PortalViewSet, basename='portal')


urlpatterns = [
    *router.urls
]
