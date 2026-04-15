# Third-Party imports
from rest_framework import serializers

# Application imports
from utils.cipher import AESCipher
from utils.dynamic_serializers import DynamicFieldsModelSerializer
from django.contrib.auth.models import Group
from .models import SMTPSettings,ReportTemplate,DocumentTemplate,EmailIdentity,CustomAttribute, EmailDigest, DashboardView, JobConfigView, EventConfigView, ChartName

cipher_obj = AESCipher()



class OrganisationSMTPSerializer(DynamicFieldsModelSerializer):
    """
    Organisation SMTP Serializer which give details of forms specific to organisation
    """
    class Meta:
        model = SMTPSettings
        fields = '__all__'

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        validated_data['password'] = cipher_obj.encrypt(password)
        validated_data['email'] = cipher_obj.encrypt(email)
        return super().create(validated_data)

    def update(self, instance, validated_data):

        if 'password' in validated_data:
            password = validated_data.pop('password')
            validated_data['password'] = cipher_obj.encrypt(password)
        if 'email' in validated_data:
            email = validated_data.pop('email')
            validated_data['email'] = cipher_obj.encrypt(email)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        # Displaying choice field actual value
        # instance.encryption = instance.get_encryption_display()
        instance.email = cipher_obj.decrypt(instance.email)
        instance.password = cipher_obj.decrypt(instance.password)
        return super().to_representation(instance)

class ReportTemplateSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = ReportTemplate
        fields = '__all__'

class DocumentTemplateSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = DocumentTemplate
        fields = '__all__'

class DocumentTemplateDeploySerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = DocumentTemplate
        fields = '__all__'
        extra_kwargs = {
                'id': {'read_only': False}
            }

class EmailIdentitySerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = EmailIdentity
        fields = '__all__'


class EmailSettingsSerializer(DynamicFieldsModelSerializer):

    ses     = serializers.SerializerMethodField()
    smtp    = serializers.SerializerMethodField()

    def get_ses(self, obj):
        serializer_class = EmailIdentitySerializer
        query_set = EmailIdentity.objects.first()
        serializer =  serializer_class(data = query_set)
        return serializer.data

    def get_smtp(self, obj):
        serializer_class = OrganisationSMTPSerializer
        query_set = SMTPSettings.objects.first()
        serializer =  serializer_class(data = query_set)
        return serializer.data
    class Meta:
        model = EmailIdentity
        fields = ('ses','smtp',)


class CustomAttributeSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = CustomAttribute
        fields = '__all__'


class CustomAttributeDeploySerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = CustomAttribute
        fields = '__all__'
        extra_kwargs = {
                'id': {'read_only': False}
            }

class EmailDigestSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = EmailDigest
        fields = '__all__'

class DashboardViewSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = DashboardView
        fields = ('id', 'name', 'description', 'grid_data', 'updated_at','tenant')
    
class JobConfigViewSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = JobConfigView
        fields = ('id', 'name', 'description', 'grid_data', 'updated_at', 'tenant')

class EventConfigViewSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = EventConfigView
        fields = ('id', 'name', 'description', 'grid_data', 'updated_at', 'tenant')

class ChartNameSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = ChartName
        fields = '__all__'