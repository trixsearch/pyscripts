from rest_framework.routers import DefaultRouter

from apps.notifications.views import TaskReminder

router = DefaultRouter(trailing_slash=False)

router.register('', TaskReminder, basename='task_reminder')

urlpatterns = [

    *router.urls
]
