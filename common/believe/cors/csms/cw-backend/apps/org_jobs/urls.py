from rest_framework.routers import DefaultRouter

router = DefaultRouter(trailing_slash=False)
app_name = 'organisation_jobs'

urlpatterns = [
    *router.urls
]
