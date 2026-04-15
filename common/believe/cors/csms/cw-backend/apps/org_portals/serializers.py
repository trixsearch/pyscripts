# Third-Party imports
from rest_framework import serializers

from apps.org_apps.models import OrganisationWorkflow
from apps.org_apps.serializers import OrganisationWorkflowSerializer
from utils.dynamic_serializers import DynamicFieldsModelSerializer

# Application imports
from .models import Content, Portals, PortalContentOrder


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = ('id', 'name', 'description', 'is_published', 'content', 'tenant')

    def to_internal_value(self, data):
        if 'content' in data and data['content']:
            data['content'] = data['content'].encode()
        return super().to_internal_value(data)

class ContentDeploySerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = ('id', 'name', 'description', 'is_published', 'content')
        extra_kwargs = {
                'id': {'read_only': False}
            }

    def to_internal_value(self, data):
        if 'content' in data and data['content']:
            data['content'] = data['content'].encode()
        return super().to_internal_value(data)


class GetContentSerializer(serializers.ModelSerializer):

    content = serializers.SerializerMethodField()

    def get_content(self, obj):
        if obj.content:
            return str(obj.content, 'utf-8')
        return obj.content

    class Meta:
        model = Content
        fields = ('id', 'name', 'description', 'is_published', 'content')

class GetContentDeploySerializer(serializers.ModelSerializer):

    content = serializers.SerializerMethodField()

    def get_content(self, obj):
        if obj.content:
            return str(obj.content, 'utf-8')
        return obj.content

    class Meta:
        model = Content
        fields = ('id', 'name', 'description', 'is_published', 'content')
        extra_kwargs = {
                'id': {'read_only': False}
            }


class PortalContentOrderSerializer(serializers.ModelSerializer):
    content = GetContentSerializer()
    order_obj_id = serializers.UUIDField(source='id')

    class Meta:
        model = PortalContentOrder
        fields = ('content', 'order_obj_id')


class PortalSerializer(DynamicFieldsModelSerializer):

    workflows = serializers.SerializerMethodField()
    published_content = serializers.SerializerMethodField()

    def get_published_content(self, obj):
        content = PortalContentOrder.objects.filter(
            portal__id=obj.id, content__is_published=True).order_by('order')
        serializer = PortalContentOrderSerializer(content, many=True)
        return serializer.data

    def get_workflows(self, obj):
        result = OrganisationWorkflow.objects.filter(portal__id=obj.id)
        serializer = OrganisationWorkflowSerializer(result, many=True)
        return serializer.data

    class Meta:
        model = Portals
        fields = ('id', 'name', 'description', 'tenant',
                  'workflows', 'published_content')


class PortalContentOrderListSerializer(serializers.ListSerializer):
    def update(self, instance, validated_data):
        # Maps for id->instance and id->data item.
        portal_content_order_mapping = {
            portal_content_order.id: portal_content_order for portal_content_order in instance}
        data_mapping = {item['id']: item for item in validated_data}

        # Perform creations and updates.
        modified_objects = []
        for portal_content_order_id, data in data_mapping.items():
            portal_content_order = portal_content_order_mapping.get(
                portal_content_order_id, None)
            if portal_content_order is None:
                # modified_objects.append(self.child.create(data))
                pass
            else:
                if 'order' in data and data['order']:
                    instance.filter(order=data['order']).update(
                        order=-data['order'])
                modified_objects.append(
                    self.child.update(portal_content_order, data))
        return modified_objects


class PortalContentOrderUpdateSerializer(DynamicFieldsModelSerializer):
    id = serializers.UUIDField()

    class Meta:
        model = PortalContentOrder
        fields = '__all__'
        list_serializer_class = PortalContentOrderListSerializer


class PortalContentOrderBasicSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = PortalContentOrder
        fields = '__all__'

    def create(self, validated_data):
        last_content_in_portal = PortalContentOrder.objects.filter(
            portal=validated_data['portal']).order_by('-order').first()
        if not validated_data['order'] and last_content_in_portal:
            validated_data['order'] = last_content_in_portal.order + 1
        else:
            validated_data['order'] = 1
        return super().create(validated_data)


class PortalContentSerializer(serializers.ModelSerializer):
    portal_content = serializers.SerializerMethodField()

    def get_portal_content(self, obj):
        content = PortalContentOrder.objects.filter(
            portal__id=obj.id, content__is_published=True).order_by('order')
        serializer = PortalContentOrderSerializer(content, many=True)
        return serializer.data

    class Meta:
        model = Portals
        fields = ['portal_content']



class PortalDeploySerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Portals
        fields = '__all__'
        extra_kwargs = {
            'id': {'read_only': False}
        }
        