from django.urls import reverse
from rest_framework import serializers

# Application imports
from apps.org_users.serializers import DyanamicUserSerializer
from apps.org_users.models import OrganisationUser, ExternalUser
from .models import OrganisationFile, OrganisationForm, Transaction
from .utils import FileUploadTokenController,get_label, get_file_label_in_json


class OrganisationFormSerializer(serializers.ModelSerializer):
    """
    Organisation Form Serializer which give details of forms specific to organisation
    """

    class Meta:
        model = OrganisationForm
        fields = ('id', 'name', 'key', 'description',
                  'content', 'version', 'created_at', 'language_option', 'tenant', 'is_bulk_supported')

    def create(self, validated_data):
        if 'content' in validated_data and not validated_data['content']:
            validated_data.pop('content')
        return super().create(validated_data)


class GetListOrganisationFormSerializer(serializers.ModelSerializer):
    """
    Organisation Form Serializer which give details of forms specific to organisation
    """

    class Meta:
        model = OrganisationForm
        fields = ('id', 'name', 'key', 'description', 'version', 'created_at', 'language_option', 'is_bulk_supported')


class GetOrganisationFormSerializer(serializers.ModelSerializer):
    """
    Organisation Form Serializer which give details of forms specific to organisation
    """
    content = serializers.SerializerMethodField()
    file_fields = serializers.SerializerMethodField()
    client_info = serializers.SerializerMethodField()

    def get_file_fields(self, obj):
        return get_file_label_in_json(obj.keytypepair)

    def get_client_info(self, obj):
        request = self.context.get("request")
        user_agent = ""
        ip = ""
        if request:
            if  'HTTP_X_REAL_IP' in  request.META:
                ip = request.META.get('HTTP_X_REAL_IP')
            if  'HTTP_USER_AGENT' in  request.META:
                user_agent = request.META.get('HTTP_USER_AGENT')
        client_info = {
                "user_agent" : user_agent,
                "ip" : ip
        }
        return client_info



    def get_content(self, obj):
        if obj.content:
            return FileUploadTokenController(obj.content, self.context.get("transactionId")).get_components()
        return obj.content

    class Meta:
        model = OrganisationForm
        fields = ('id', 'name', 'key', 'description',
                  'content', 'file_fields', 'version', 'created_at', 'client_info','language_option','is_bulk_supported')

class OrganisationFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        return reverse('org_forms_and_files:upload_files-detail', kwargs={'pk': obj.id, 'tenant': str(obj.tenant.id)})

    def get_user(self, obj):
        if not obj.user:
            return obj.user
        serializer_class = DyanamicUserSerializer
        if OrganisationUser.default_manager.all_with_deleted().filter(email__iexact = obj.user.email).exists():
            user = OrganisationUser.default_manager.get(email__iexact = obj.user.email)
            model = OrganisationUser
        else:
            user = ExternalUser.objects.get(email__iexact = obj.user.email)
            model = ExternalUser
        serializer_class.Meta.model = model

        serializer = serializer_class(user)
        return serializer.data

    class Meta:
        model = OrganisationFile
        fields = ('id', 'name', 'content_type', 'doc_type', 'file_url', 'file', 'uploaded_at', 'user', 'file_label', 'process_instance_id')
        extra_kwargs = {'file': {'write_only': True}}



class OrganisationFormEntitySerializer(serializers.ModelSerializer):
    """
    Organisation Form Serializer which give details of forms specific to organisation
    """

    class Meta:
        model = OrganisationForm
        fields = ('name',)

    def create(self, validated_data):
        if 'content' in validated_data and not validated_data['content']:
            validated_data.pop('content')

class OrganisationFormDeploySerializer(serializers.ModelSerializer):
    """
    Organisation Form Serializer which give details of forms specific to organisation
    """

    class Meta:
        model = OrganisationForm
        fields = ('id', 'name', 'key', 'description',
                  'content', 'version', 'created_at', 'language_option','is_bulk_supported')
        extra_kwargs = {
                'id': {'read_only': False}
            }

    def create(self, validated_data):
        if 'content' in validated_data and not validated_data['content']:
            validated_data.pop('content')
        return super().create(validated_data)


class GetFormSerializer(serializers.ModelSerializer):
    """
    Organisation Form Serializer which give details of forms specific to organisation
    """
    content = serializers.SerializerMethodField()
    file_fields = serializers.SerializerMethodField()
    client_info = serializers.SerializerMethodField()

    def get_file_fields(self, obj):
        return get_file_label_in_json(obj.keytypepair)

    def get_client_info(self, obj):
        request = self.context.get("request")
        user_agent = ""
        ip = ""
        if request:
            if  'HTTP_X_REAL_IP' in  request.META:
                ip = request.META.get('HTTP_X_REAL_IP')
            if  'HTTP_USER_AGENT' in  request.META:
                user_agent = request.META.get('HTTP_USER_AGENT')
        client_info = {
                "user_agent" : user_agent,
                "ip" : ip
        }
        return client_info

    def get_content(self, obj):
        if obj.content:
            return FileUploadTokenController(obj.content, self.context.get("transactionId")).get_components()
        return obj.content

    class Meta:
        model = OrganisationForm
        fields = ('id', 'name', 'key', 'description',
                  'content', 'file_fields', 'version', 'created_at', 'client_info','language_option', 'keytypepair','is_bulk_supported')

class TransactionSerializer(DyanamicUserSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'