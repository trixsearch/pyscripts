
from apps.notifications.models import Notification
from utils.dynamic_serializers import DynamicFieldsModelSerializer


class NotificationSerializer(DynamicFieldsModelSerializer):
    """
    Notifications serializer

    Arguments:
        serializers.ModelSerializer  -- class which provides a useful shortcut for creating
                                            serializers that deal with model instances
                                            and querysets.
    """
    class Meta:
        model = Notification
        fields = '__all__'
