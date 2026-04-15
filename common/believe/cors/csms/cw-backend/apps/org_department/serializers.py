# Third-Party imports
from rest_framework import serializers
from apps.org_users.models import OrganisationUser
from apps.org_users.serializers import OrganisationUserBasicDetailsSerializer

# Application imports
from apps.org_config.models import CustomAttribute
from .models import Department, DepartmentDetail


class DepartmentSerializer(serializers.ModelSerializer):
    """
    Department Serializer which give details of departments
    """
    class Meta:
        model = Department
        fields = ('name', 'extra_fields', 'tenant')

class DepartmentDeploySerializer(serializers.ModelSerializer):
    """
    Department Serializer which give details of departments
    """
    class Meta:
        model = Department
        fields = ('name','extra_fields')
        extra_kwargs = {
                'id': {'read_only': False}
            }


class ListDepartmentDetailSerializer(serializers.ModelSerializer):
    """
    List Department Serializer will list department and head details for each department
    """
    id = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    extra_fields = serializers.SerializerMethodField()
    head = OrganisationUserBasicDetailsSerializer()
    total_users = serializers.SerializerMethodField()
    custom_attribute = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentDetail
        exclude = ('department', )

    def get_id(self, obj):
        return obj.department.id

    def get_name(self, obj):
        return obj.department.name

    def get_extra_fields(self, obj):
        return obj.department.extra_fields

    def get_total_users(self, obj):
        return OrganisationUser.default_manager.filter(department=obj.department.id).count()

    def get_custom_attribute(self, obj):
        custom_attribute_data = CustomAttribute.objects.filter(type = 'departments')
        if custom_attribute_data:
            custom_attribute = custom_attribute_data[0].custom_attribute
            return custom_attribute
        return {}


class DepartmentDetailSerializer(serializers.ModelSerializer):
    """
    Department Detail Serializer which give details of department and head of that department
    """

    department = DepartmentSerializer()

    class Meta:
        model = DepartmentDetail
        fields = ('head', 'department')

    def create(self, validated_data):
        """
        Overriding the default create method of the Model serializer.
        :param validated_data: data containing all department details
        :return: returns a successfully created department detail record
        """
        department_data = validated_data.pop('department')
        department = DepartmentSerializer.create(
            DepartmentSerializer(), validated_data=department_data)
        department, created = DepartmentDetail.objects.update_or_create(department=department,
                                                                        head=validated_data.pop('head'))
        return department

    def update(self, instance, validated_data):
        """
        Overriding the default update method of the Model serializer.
        :param instance: data containing all instance details
        :param validated_data: data containing all department details
        :return: returns a successfully created department detail record
        """
        department = instance.department
        if 'department' in validated_data.keys():
            if 'name' in validated_data['department']:
                department.name = validated_data['department']['name']
                department.save()
            if 'extra_fields' in validated_data['department']:
                department.extra_fields = validated_data['department']['extra_fields']
                department.save()
        instance.department = department
        if 'head' in validated_data.keys():
            instance.head = validated_data.pop('head')
        instance.save()
        return instance


class DepartmentDetailDeploySerializer(serializers.ModelSerializer):
    """
    Department Detail Serializer which give details of department and head of that department
    """

    department = DepartmentSerializer()

    class Meta:
        model = DepartmentDetail
        fields = ('head', 'department')
        extra_kwargs = {
                'id': {'read_only': False}
            }

    def create(self, validated_data):
        """
        Overriding the default create method of the Model serializer.
        :param validated_data: data containing all department details
        :return: returns a successfully created department detail record
        """
        department_data = validated_data.pop('department')
        department = DepartmentSerializer.create(
            DepartmentSerializer(), validated_data=department_data)
        department, created = DepartmentDetail.objects.update_or_create(department=department,
                                                                        head=validated_data.pop('head'))
        return department

    def update(self, instance, validated_data):
        """
        Overriding the default update method of the Model serializer.
        :param instance: data containing all instance details
        :param validated_data: data containing all department details
        :return: returns a successfully created department detail record
        """
        department = instance.department
        if 'department' in validated_data.keys():
            if 'name' in validated_data['department']:
                department.name = validated_data['department']['name']
                department.save()
            if 'extra_fields' in validated_data['department']:
                department.extra_fields = validated_data['department']['extra_fields']
                department.save()
        instance.department = department
        if 'head' in validated_data.keys():
            instance.head = validated_data.pop('head')
        instance.save()
        return instance
