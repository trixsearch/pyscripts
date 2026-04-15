from rest_framework.routers import DefaultRouter

from .views import EntityImportViewSet

router = DefaultRouter(trailing_slash=True)
app_name = "org_imports"

router.register('', EntityImportViewSet, basename="entity_import")

urlpatterns = [
    *router.urls
]
