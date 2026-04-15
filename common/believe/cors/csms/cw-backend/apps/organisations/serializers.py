# Third-Party imports

from io import BytesIO

from PIL import Image

from django.core.files.base import ContentFile
from rest_framework import serializers
from utils.dynamic_serializers import DynamicFieldsModelSerializer
from ezedox.settings import BASE_ORG_DOMAIN_URL

# Application imports
from .models import Organisation, OrganisationLicense, ScheduledReport, OrganisationSMS


class OrganisationDataInSerializer(DynamicFieldsModelSerializer):
    org_logo = serializers.SerializerMethodField()
    org_name = serializers.SerializerMethodField()
    org_pan = serializers.SerializerMethodField()
    org_gstn = serializers.SerializerMethodField()
    org_cin = serializers.SerializerMethodField()
    org_address = serializers.SerializerMethodField()
    org_description = serializers.SerializerMethodField()

    def get_org_logo(self, obj):
        request_data = self.context.get('request')
        if request_data and obj.logo:
            #TODO
            logo_url = "{0}://{1}{2}".format("https", request_data.get_host(), "/cw/organisations/"+ str(obj.id) + "/logo" )
            return logo_url
        return ''

    def get_org_name(self, obj):
        return obj.name

    def get_org_address(self, obj):
        return obj.org_address

    def get_org_cin(self, obj):
        return obj.cin

    def get_org_pan(self, obj):
        return obj.pan

    def get_org_gstn(self, obj):
        return obj.gstn
    
    def get_org_description(self, obj):
        return obj.description

    class Meta:
        model = Organisation
        fields = ('org_name','org_logo', 'org_address', 'org_cin', 'org_pan', 'org_gstn', 'org_description')
        extra_kwargs = {'schema_name': {'write_only': True}}


class OrganisationLogoSerializer(DynamicFieldsModelSerializer):
    logo = serializers.SerializerMethodField()
    class Meta:
        model = Organisation
        fields = '__all__'
        extra_kwargs = {'schema_name': {'write_only': True}}

    def get_logo(self, obj):
        request_data = self.context.get('request')

        if request_data and obj.logo:
            #TODO
            logo_url = "{0}://{1}/api/cw/organisations/{2}/logo".format("https", BASE_ORG_DOMAIN_URL, str(obj.id))
            return logo_url
        return ''

class OrganisationSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = Organisation
        fields = '__all__'
        extra_kwargs = {'schema_name': {'write_only': True}}

    def update(self, instance, validated_data):
        if 'logo' in validated_data and not 'icon_512_size' in validated_data and not getattr(instance, 'icon_512_size', None):
            f = BytesIO()
            try:
                image_512_size = Image.open(validated_data['logo'])
                image_512_size = image_512_size.resize(
                    (512, 512), Image.ANTIALIAS)
                image_512_size.save(f, format='png')
                instance.icon_512_size.save(
                    'icon_512_size_name.png', ContentFile(f.getvalue())
                )
            finally:
                f.close()

        if 'logo' in validated_data and not 'icon_192_size' in validated_data and not getattr(instance, 'icon_192_size', None):
            f = BytesIO()
            try:
                icon_192_size = Image.open(validated_data['logo'])
                icon_192_size = icon_192_size.resize(
                    (192, 192), Image.ANTIALIAS)
                icon_192_size.save(f, format='png')
                instance.icon_192_size.save(
                    'icon_192_size_name.png', ContentFile(f.getvalue())
                )
            finally:
                f.close()
        return super().update(instance, validated_data)


class OrganisationManifestSerializer(DynamicFieldsModelSerializer):
    start_url = serializers.SerializerMethodField()
    icons = serializers.SerializerMethodField()
    display = serializers.SerializerMethodField()
    background_color = serializers.SerializerMethodField()

    def get_start_url(self, obj):
        return obj.domain_url + '/candidate'

    def get_background_color(self, obj):
        return obj.first_primary_color

    def get_display(self, obj):
        return 'standalone'

    def get_icons(self, obj):
        icons_info = list()

        if obj.icon_192_size:
            icon_192_size_info = dict()
            icon_192_size_info['src'] = obj.icon_192_size.url
            icon_192_size_info['type'] = 'image/png'
            icon_192_size_info['sizes'] = '192x192'
            icons_info.append(icon_192_size_info)
        if obj.icon_512_size:
            icon_512_size_info = dict()
            icon_512_size_info['src'] = obj.icon_512_size.url
            icon_512_size_info['type'] = 'image/png'
            icon_512_size_info['sizes'] = '512x512'
            icons_info.append(icon_512_size_info)

        return icons_info

    class Meta:
        model = Organisation
        fields = ('name', 'short_name', 'icons',
                  'start_url', 'display', 'background_color')


class OrganisationLicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganisationLicense
        fields = '__all__'

class ScheduledReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledReport
        fields = ('cron_expression', 'report_recipients','start_date', 'end_date','tenant_name', 'recipients_group','report_template_id','stop_scheduling', 'timezone_offset')


class ScheduledReportGetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledReport
        fields = ('id','cron_expression', 'report_recipients','start_date', 'end_date','tenant_name', 'recipients_group','report_template_id', 'stop_scheduling') 


class OrganisationSMSSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = OrganisationSMS
        fields = ('id', 'sms_body', 'mobile', 'entity_id', 'date_sent', 'updated_at', 'partner_request_id', 'delivery_status')