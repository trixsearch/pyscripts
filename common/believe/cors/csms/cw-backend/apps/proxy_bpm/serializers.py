from rest_framework import serializers
from apps.org_form.models import OrganisationForm
from apps.org_form.utils import FileUploadTokenController
from apps.org_users.utils import get_tenant
from apps.organisations.models import Organisation

class OpenInitiationSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()
    org_logo = serializers.SerializerMethodField()
    client_info =  serializers.SerializerMethodField()

    def get_org_logo(self, obj):
        request_data = self.context.get('request')
        if request_data and Organisation.objects.get(id=obj.tenant.id).logo:
            logo_url = "{0}://{1}{2}".format(request_data.scheme, request_data.get_host(), "/cw/organisations/"+ str(obj.tenant.id) + "/logo" )
            return logo_url
        return ''

    def get_data(self, obj):
        return { "transaction_id" : self.context.get("transactionId")}

    def get_content(self, obj):
        if obj.content:
            return FileUploadTokenController(obj.content, self.context.get("transactionId")).get_components()
        return obj.content

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

    class Meta:
        model = OrganisationForm
        fields = ('id', 'name', 'key', 'description', 'content', 'data', 'org_logo','client_info', 'language_option')
