# Third-Party imports

from utils.dynamic_serializers import DynamicFieldsModelSerializer

# Application imports
from .models import OrganisationLists, OrganisationAdvancedLists

class OrganisationListsSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = OrganisationLists
        fields = '__all__'

class OrganisationListsDeploySerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = OrganisationLists
        fields = '__all__'
        extra_kwargs = {
                'id': {'read_only': False}
            }

class OrganisationAdvancedListsSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = OrganisationAdvancedLists
        fields = '__all__'

class OrganisationAdvancedListsDeploySerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = OrganisationAdvancedLists
        fields = '__all__'
        extra_kwargs = {
                'id': {'read_only': False}
            }
