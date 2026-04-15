import copy, uuid, base64, imghdr
from django.core.files.base import ContentFile
from django.contrib.auth.hashers import make_password

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from apps.org_department.models import Department
from apps.org_location.models import Location
from apps.organisations.models import OrganisationLicense
from apps.org_group.models import OrganisationGroup
from apps.org_apps.models import WorkflowAccess, OrganisationWorkflow
from apps.org_config.models import DashboardView
from apps.org_config.serializers import DashboardViewSerializer
from apps.org_apps.serializers import WorkflowAccessSerializer
from utils.dynamic_serializers import DynamicFieldsModelSerializer
from .models import ExternalUser, OrganisationUser, OpenExternalUser, PlatformPolicy


class OrganisationUserBasicDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganisationUser
        fields = ('id', 'email', 'first_name', 'last_name', 'gender', 'created_at',
                  'middle_name', 'employee_id', 'last_login')


class OrganisationUserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganisationUser
        fields = ('id', 'last_login', 'email', 'password', 'first_name', 'last_name', 'is_active', 'email_verified',
                  'middle_name', 'employee_id', 'manager', 'location', 'department', 'gender', 'created_at', 'extra_fields', 'mobile','display_picture', 'signature', 'tenant')
        read_only_fields = ('id', 'last_login')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        org_owner = OrganisationUser.default_manager.filter(tenant=validated_data["tenant"]).first()
        # if org_owner and (not 'groups' in validated_data or not validated_data['groups']):
        #     raise serializers.ValidationError(
        #         {"roles": ["Cannot create organisation users without assigning any role."]})
        user = super(OrganisationUserRegistrationSerializer,
                     self).create(validated_data)
        user.set_password(validated_data['password'])
        user.save()
        return user



class LocationSerializer(serializers.ModelSerializer):
    """
    Location Serializer which give details of locations
    """
    class Meta:
        model = Location
        fields = ('id', 'name', 'extra_fields',)
        ref_name = "location_serializer"


class DepartmentSerializer(serializers.ModelSerializer):
    """
    LocatDepartmention Serializer which give details of departments
    """
    class Meta:
        model = Department
        fields = ('id', 'name', 'extra_fields',)
        ref_name = "dept_serializer"


class OrganisationUserSerializer(DynamicFieldsModelSerializer):
    location = LocationSerializer()
    manager = OrganisationUserBasicDetailsSerializer()
    workflow_permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    involved_groups = serializers.SerializerMethodField()
    process_filter = serializers.SerializerMethodField()
    support_notification = serializers.SerializerMethodField()
    dashboard_view = serializers.SerializerMethodField()
    show_completed_tasks = serializers.SerializerMethodField()
    task_view_columns = serializers.SerializerMethodField()
    class Meta:
        model = OrganisationUser
        fields = ('id', 'last_login', 'email', 'first_name', 'last_name', 'userId', 
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'is_active', 'email_verified','mobile', 'full_name',
                  'extra_fields','involved_groups','process_filter','support_notification','dashboard_view',
                  'is_deleted','show_completed_tasks','task_view_columns', 'workflow_permissions')
        
    def get_workflow_permissions(self, obj):
        workflow_permissions = {}
        try:
            request_data = self.context.get('request')
            if self.context.get('tenant'):
                tenant = self.context.get('tenant')
            else:
                tenant = obj.tenant
            
            if request_data.user.is_superuser:
                for item in OrganisationWorkflow.objects.filter(tenant=tenant):
                    workflow_permissions[str(item.id)] = {
                        "app_id" : str(item.id),
                        "view" : True,
                        "initiate" : True,
                        "bulk_initiate" : True,
                        "withdraw" : True,
                        "upload" : True,
                        "reassign" : True,
                        "filter_on_task": True
                    }
            else:
                platform_policies = request_data.user.platform_policy.all().filter(tenant=tenant)
                workflow_access_serializer = WorkflowAccessSerializer(WorkflowAccess.objects.filter(policy__in=platform_policies, app__tenant=tenant), many=True)
                for workflow_access in workflow_access_serializer.data:
                    if workflow_permissions.get(str(workflow_access["app_id"]), None):
                        # for merging of single app permission for two policy
                        prev_perm = workflow_permissions.get(str(workflow_access["app_id"]), None)
                        if not prev_perm["view"]:
                            prev_perm["view"] = workflow_access["view"]
                        if not prev_perm["initiate"]:
                            prev_perm["initiate"] = workflow_access["initiate"]
                        if not prev_perm["bulk_initiate"]:
                            prev_perm["bulk_initiate"] = workflow_access["bulk_initiate"]
                        if not prev_perm["withdraw"]:
                            prev_perm["withdraw"] = workflow_access["withdraw"]
                        if not prev_perm["upload"]:
                            prev_perm["upload"] = workflow_access["upload"]
                        if not prev_perm["reassign"]:
                            prev_perm["reassign"] = workflow_access["reassign"]
                        if not prev_perm["filter_on_task"]:
                            prev_perm["filter_on_task"] = workflow_access["filter_on_task"]
                        workflow_permissions[str(workflow_access["app_id"])] = prev_perm
                    else:
                        workflow_permissions[str(workflow_access["app_id"])] = workflow_access
        except Exception as e:
            workflow_permissions = {}
            
        return workflow_permissions

    def get_full_name(self, obj):
        try:
            name = obj.first_name + " "
            if obj.middle_name:
                name = name + obj.middle_name + " "
            name = name + obj.last_name
            return name
        except:
            return None

    def get_involved_groups(self, obj):
        try:
            groups_data = []
            groups = OrganisationGroup.objects.filter(users=obj, tenant=self.context.get('tenant')).distinct()
            for group in groups:
                groups_data.append({"id": group.id, "name": group.name, "key": group.key})
            return groups_data
        except:
            return groups_data

    def get_process_filter(self, obj):
        filter_workflow_data = {}
        return filter_workflow_data

    def get_support_notification(self, obj):
        try:
            return self.context.get('request').tenant.support_notification
        except:
            return None

    def get_dashboard_view(self, obj):
        dashboard_data=[]
        try:
            dashboard_data = DashboardView.objects.filter(role=obj.groups.all()[0].id)
            serializer = DashboardViewSerializer(dashboard_data[0])
            return serializer.data
        except Exception as error:
            return dashboard_data

    def get_show_completed_tasks(self,obj):
        if self.context.get('tenant'):
            tenant = self.context.get('tenant')
        else:
            tenant = obj.tenant
        if tenant:
            org_license = OrganisationLicense.objects.get(organisation=tenant)
            if org_license:
                return org_license.show_completed_tasks
        return False

    def get_task_view_columns(self,obj):
        if self.context.get('tenant'):
            tenant = self.context.get('tenant')
        else:
            tenant = obj.tenant
        if tenant:
            org_license = OrganisationLicense.objects.get(organisation=tenant)
            if org_license:
                return org_license.task_view_columns
        return []

class OrgUserSerializer(DynamicFieldsModelSerializer):
    current_user_location = serializers.SerializerMethodField()
    current_user_id = serializers.SerializerMethodField()
    current_user_email = serializers.SerializerMethodField()
    current_user_first_name = serializers.SerializerMethodField()
    current_user_last_name = serializers.SerializerMethodField()
    current_user_middle_name = serializers.SerializerMethodField()
    current_user_employee_id = serializers.SerializerMethodField()
    current_user_gender = serializers.SerializerMethodField()
    current_user_phone_number = serializers.SerializerMethodField()
    current_user_extra_fields = serializers.SerializerMethodField()
    current_user_tenantId = serializers.SerializerMethodField()

    def get_current_user_id(self, obj):
        return str(obj.id)

    def get_current_user_email(self, obj):
        return obj.email

    def get_current_user_first_name(self, obj):
        return obj.first_name

    def get_current_user_last_name(self, obj):
        return obj.last_name

    def get_current_user_middle_name(self, obj):
        return obj.middle_name

    def get_current_user_employee_id(self, obj):
        return str(obj.employee_id)

    def get_current_user_gender(self, obj):
        return obj.gender

    def get_current_user_location(self, obj):
        return LocationSerializer(obj.location).data

    def get_current_user_phone_number(self, obj):
        return str(obj.mobile) if obj.mobile else ""

    def get_current_user_extra_fields(self,obj):
        return obj.extra_fields
    
    def get_current_user_tenantId(self,obj):
        return str(obj.tenant.id)

    class Meta:
        model = OrganisationUser
        fields = ('current_user_id', 'current_user_email', 'current_user_first_name', 'current_user_last_name', "current_user_phone_number",
                  'current_user_middle_name', 'current_user_employee_id', 'current_user_gender', 'current_user_location' ,'current_user_extra_fields', 'current_user_tenantId')

class OrganisationUserUpdateSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = OrganisationUser
        fields = ('email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender',
                  'location', 'department', 'is_active', 'display_picture','mobile', 'extra_fields','password','email_verified', 'signature')

    def to_internal_value(self, data):
        if "password" in data and data['password'] != "":
            data["password"] = make_password(data['password'])
            data["email_verified"] = True
        request_data = self.context.get('request')
        if 'signature' not in request_data.FILES and 'signature' in data and 'data:' in data["signature"] and ';base64,' in data["signature"]:
            header, data2 = data["signature"].split(';base64,')
            try:
                decoded_file = base64.b64decode(data2)
            except TypeError:
                self.fail('invalid_image')
            file_name = str(uuid.uuid4())
            file_extension = get_file_extension(file_name, decoded_file)
            complete_file_name = "%s.%s" % (file_name, file_extension, )
            data["signature"] = ContentFile(decoded_file, name=complete_file_name)

        return super().to_internal_value(data)

def get_file_extension(file_name, decoded_file):
    extension = imghdr.what(file_name, decoded_file)
    extension = "jpg" if extension == "jpeg" else extension
    return extension

class ExternalUserSerializer(DynamicFieldsModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = ExternalUser
        exclude = ('password', 'is_staff', 'is_superuser', 'is_active')

        read_only_fields = ('id', 'last_login')

    def get_full_name(self, obj):
        try:
            name = obj.first_name + " " + obj.last_name
            return name
        except:
            return ''


class ExternalUserDynamicFieldsModelSerializer(DynamicFieldsModelSerializer):
    mobile = PhoneNumberField()

    class Meta:
        model = ExternalUser
        exclude = ('is_staff', 'is_superuser', 'otp_expiration_time', 'is_active')

        read_only_fields = ('id', 'last_login')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = super(ExternalUserDynamicFieldsModelSerializer,
                     self).create(validated_data)
        user.set_password(validated_data['password'])
        user.save()
        return user


class ExternalUserOTPSerializer(DynamicFieldsModelSerializer):
    mobile = PhoneNumberField()

    class Meta:
        model = ExternalUser
        fields = ('mobile', 'email')
        extra_kwargs = {'email': {'required': False}}

class DyanamicUserSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = None
        fields = ('email', 'first_name', 'last_name', 'gender')

class OpenExternalUserDynamicFieldsModelSerializer(DynamicFieldsModelSerializer):
    mobile = PhoneNumberField()

    class Meta:
        model = OpenExternalUser
        exclude = ('is_staff', 'is_superuser', 'otp_expiration_time', 'is_active')

        read_only_fields = ('id', 'last_login')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = super(OpenExternalUserDynamicFieldsModelSerializer,
                     self).create(validated_data)
        user.set_password(validated_data['password'])
        user.save()
        return user

class OpenExternalUserSerializer(DynamicFieldsModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = OpenExternalUser
        exclude = ('password', 'is_staff', 'is_superuser', 'is_active')

        read_only_fields = ('id', 'last_login')

    def get_full_name(self, obj):
        try:
            name = obj.first_name + " " + obj.last_name
            return name
        except:
            return ''
        
class PlatformPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformPolicy
        fields = ('name', 'policy_id', 'id', 'relation', 'source_tenant', 'tenant')