from rest_framework.routers import DefaultRouter

router = DefaultRouter(trailing_slash=False)
app_name = 'org_internal'

urlpatterns = [
    *router.urls
]
