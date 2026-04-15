from rest_framework.routers import DefaultRouter

from .views import DepartmentDetailViewSet

router = DefaultRouter(trailing_slash=False)

router.register('', DepartmentDetailViewSet, basename='departmentdetails')

urlpatterns = [
    *router.urls
]
