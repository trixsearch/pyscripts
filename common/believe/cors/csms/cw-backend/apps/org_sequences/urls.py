from rest_framework.routers import DefaultRouter

from .views import SequenceViewSet

router = DefaultRouter(trailing_slash=False)
app_name = 'organisation_sequences'

router.register('', SequenceViewSet, basename='sequences')

urlpatterns = [
    *router.urls
]
