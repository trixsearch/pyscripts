# Third-Party imports
from rest_framework import serializers
from utils.dynamic_serializers import DynamicFieldsModelSerializer
from apps.org_users.models import OrganisationUser
from apps.org_users.serializers import OrganisationUserBasicDetailsSerializer
from apps.org_config.models import CustomAttribute

# Application imports
from .models import Location


class LocationSerializer(serializers.ModelSerializer):
    """
    Location Serializer which give details of locations
    """
    class Meta:
        model = Location
        exclude = ['slug']