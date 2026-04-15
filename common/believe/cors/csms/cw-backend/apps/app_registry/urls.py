from rest_framework.routers import DefaultRouter

app_name = 'app_registry'

router = DefaultRouter(trailing_slash=False)

urlpatterns = [
    *router.urls
]
