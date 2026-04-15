from rest_framework import serializers
from .models import OrganisationFilter

class CreateFilterSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrganisationFilter
        fields = '__all__'
