from rest_framework.routers import DefaultRouter
from django.conf.urls import url
from .views import GetEmpViewSet, GetEmpFlattenedViewSet, GetO2CEmpCategoryViewSet, PlatformDataViewSet, ProxyViewSet, GetTaskListViewSet, GetTasksViewSet, AttendanceViewSet

router = DefaultRouter(trailing_slash=False)
app_name = 'organisation_bff'

router.register('emp/', GetEmpViewSet, basename='get_emp')
router.register('emp_flattened/', GetEmpFlattenedViewSet, basename='get_emp_flattened')
router.register('o2cempaddresscategory/', GetO2CEmpCategoryViewSet, basename='get_emp_address_category')
router.register('vision_path/', ProxyViewSet, basename='vision_path')
router.register('absent-employee-list/', AttendanceViewSet, basename='absent_employee_list')


urlpatterns = [
    url('platform/',
        PlatformDataViewSet.as_view({'post': 'post'}), name='platform_data'),
    url('task_list/',
        GetTaskListViewSet.as_view({'post': 'post'}), name='task_list'),
    url('tasks/',
        GetTasksViewSet.as_view({'post': 'post'}), name='get_tasks'),
] + router.urls
