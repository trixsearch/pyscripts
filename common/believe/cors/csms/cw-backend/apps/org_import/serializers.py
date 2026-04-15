from rest_framework import serializers

from .models import EntityImport

class EntityImportSerializer(serializers.ModelSerializer):
    """
    LocatDepartmention Serializer which give details of departments
    """
    class Meta:
        model = EntityImport
        exclude = ('id', 'entity_type', 'file')

class EntityImportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityImport
        fields = '__all__'

class EntityImportToJsonSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityImport
        exclude = ['user','file']
