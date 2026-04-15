from utils.dynamic_serializers import DynamicFieldsModelSerializer
from .models import Sequence

class SequenceSerializers(DynamicFieldsModelSerializer):
    class Meta:
        model = Sequence
        fields = "__all__"

class SequenceDeploySerializers(DynamicFieldsModelSerializer):
    class Meta:
        model = Sequence
        fields = "__all__"
        extra_kwargs = {
            'id': {'read_only': False}
        }
