from django.conf import settings
from django.db import models

from apps.notifications.constants import NotificationConstant
from apps.app_registry.models import MyBaseModel

class Notification(MyBaseModel):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='%(class)s_sender', null=True)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='%(class)s_recipient')
    notification_type = models.IntegerField(
        choices=NotificationConstant.NOTIFICATION_CHOICES, default=NotificationConstant.TEST_NOTIFICATION_CHOICE)
    is_read = models.BooleanField(default=False)
    is_seen = models.BooleanField(default=False)
    task_id = models.UUIDField(null=True, blank=True)
    meta_content = models.JSONField(default=dict, blank=True, null=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        unique_together = [['recipient', 'notification_type', 'task_id'],]

    def __str__(self):
        return '{}'.format(self.notification_type)

    def to_json(self):
        notification_type = NotificationConstant.get_notification_from_type_choice(self.notification_type)
        return {
            "subject": NotificationConstant.SUBJECT[notification_type],
            "message": NotificationConstant.MESSAGE[notification_type].format(**self.meta_content),
            "data": self.meta_content,
            "is_read": self.is_read,
            "created": self.created_at.timestamp(),
            "id": str(self.id),
            "is_seen": self.is_seen,
            "task_id": str(self.task_id) if self.task_id else None
        }
