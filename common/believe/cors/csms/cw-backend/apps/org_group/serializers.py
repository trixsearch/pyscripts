from rest_framework import serializers

from apps.org_users.serializers import OrganisationUserBasicDetailsSerializer
from .models import OrganisationGroup


class GroupSerializer(serializers.ModelSerializer):

    users = OrganisationUserBasicDetailsSerializer(many=True)

    class Meta:
        model = OrganisationGroup
        fields = ('id', 'name', 'key', 'users','filter_by', 'tenant')

class GroupDesignerSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    def get_id(self, obj):
        return obj.key
    class Meta:
        model = OrganisationGroup
        fields = ('id', 'name')


class CreateGroupSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrganisationGroup
        fields = ('id', 'name', 'key', 'users','filter_by', 'tenant')


class OrgGroupBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganisationGroup
        fields = ('name','filter_by', 'tenant')

class GroupDeploySerializer(serializers.ModelSerializer):

    class Meta:
        model = OrganisationGroup
        fields = ('id', 'name', 'filter_by')
        extra_kwargs = {
                'id': {'read_only': False}
            }
