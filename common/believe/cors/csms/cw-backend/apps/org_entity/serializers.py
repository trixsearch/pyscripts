import json

from rest_framework import serializers
from django.db.models import Q
from apps.org_apps.serializers import OrganisationWorkflowDetailsSerializer
from apps.org_form.serializers import OrganisationFormEntitySerializer
from apps.org_form.models import OrganisationForm
from utils.dynamic_serializers import DynamicFieldsModelSerializer
from .models import (OrganisationEntityMasterModel,
                    OrganisationEntityMasterData,
                    OrganisationEntityView,
                    OrganisationEntityAuditLog,
                    CandidateHistoryModel)

class OrganisationEntityMasterModelSerializer(DynamicFieldsModelSerializer):
    view_permission = serializers.SerializerMethodField()
    bulk_update_permission = serializers.SerializerMethodField()

    def get_view_permission(self, obj):
        return True

    def get_bulk_update_permission(self, obj):
        return True
    class Meta:
        model = OrganisationEntityMasterModel
        fields = '__all__'
class OrganisationEntitySerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = OrganisationEntityMasterModel
        fields = ('id', 'name', 'key', 'model_type', 'is_visible')

class OrganisationEntityMasterDataSerializer(DynamicFieldsModelSerializer):
    entity_fields = serializers.SerializerMethodField()
    entity_data = serializers.SerializerMethodField()
    entity_workflows = serializers.SerializerMethodField()

    def get_entity_data(self, obj):
        data = obj.entity_data
        first_class_data = OrganisationEntityFirstDataSerializer(obj).data
        data.update(first_class_data)
        return data

    def get_entity_workflows(self, obj):
        if self.context.get('entity_workflows') is not None and self.context.get('entity_workflows').all():
            workflows = self.context.get('entity_workflows').all()
            serializer = OrganisationWorkflowDetailsSerializer(workflows, many=True)
            return serializer.data
        return []
    
    def get_entity_fields(self, obj):
        res = {}
        res["entity_name"] = obj.entity_name
        res["entity_photo"] = obj.entity_photo
        res["candidateId"] = obj.candidateId
        if 'location' in obj.entity_data and obj.entity_data['location']:
            res['location'] = obj.entity_data['location']
        else:
            res['location'] = ""
        res['hire_candidate_source'] = obj.entity_data['hire_candidate_source']
        if self.context.get('config_list'):
            for item in self.context.get('config_list').keys():
                try:
                    if item == "entity_phone_number":
                        res[self.context.get('config_list')[item]] = obj.get_phone_number()
                    elif item == "dob":
                        res[self.context.get('config_list')[item]] = obj.get_dateofbirth()
                    elif item == "joiningDate":
                        res[self.context.get('config_list')[item]] = obj.get_dateofjoining()
                    else:
                        res[self.context.get('config_list')[item]] = obj.__dict__[item]
                except KeyError:
                    res[self.context.get('config_list')[item]] = obj.entity_data.get(item)
        return res

    class Meta:
        model = OrganisationEntityMasterData
        fields = ('id', 'entity_name', 'entity_photo', 'entity_phone_number', 'created_at', 'updated_at', 'entity_data', 'entity_email', 'entity_model', 'entity_fields', 'entity_workflows', 'is_deleted', 'partner_profile_id')

class OrganisationEntityFirstDataSerializer(DynamicFieldsModelSerializer):
    full_permanent_address = serializers.SerializerMethodField()
    full_current_address = serializers.SerializerMethodField()
    dob = serializers.SerializerMethodField()
    joiningDate = serializers.SerializerMethodField()

    def get_dob(self,obj):
        return obj.get_dateofbirth() 
    
    def get_joiningDate(self,obj):
        return obj.get_dateofjoining()

    def get_full_permanent_address(self, obj):
        full_address = ''
        if obj.permanent_address_line:
            full_address = full_address + obj.permanent_address_line
        if obj.permanent_address_locality:
            full_address = full_address +","+obj.permanent_address_locality
        if obj.permanent_address_landmark:
            full_address = full_address +","+obj.permanent_address_landmark
        if obj.permanent_address_city:
            full_address = full_address +","+obj.permanent_address_city
        if obj.permanent_address_district:
            full_address = full_address +","+obj.permanent_address_district
        if obj.permanent_address_state:
            full_address = full_address +","+obj.permanent_address_state
        if obj.permanent_address_pincode:
            full_address = full_address +","+obj.permanent_address_pincode
        return full_address
    def get_full_current_address(self, obj):
        full_address = ''
        if obj.present_address_line:
            full_address = full_address + obj.present_address_line
        if obj.present_address_locality:
            full_address = full_address +","+obj.present_address_locality
        if obj.present_address_landmark:
            full_address = full_address +","+obj.present_address_landmark
        if obj.present_address_city:
            full_address = full_address +","+obj.present_address_city
        if obj.present_address_district:
            full_address = full_address +","+obj.present_address_district
        if obj.present_address_state:
            full_address = full_address +","+obj.present_address_state
        if obj.present_address_pincode:
            full_address = full_address +","+obj.present_address_pincode
        return full_address

    class Meta:
        model = OrganisationEntityMasterData
        exclude = ('entity_data', 'entity_model')

class OrganisationEntityMasterDataGetIdSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = OrganisationEntityMasterData
        fields = ['id']

class OrganisationEntityMasterDataAllSerializer(DynamicFieldsModelSerializer):
    entity_fields = serializers.SerializerMethodField()
    key_label = serializers.SerializerMethodField()
    
    def get_key_label(self, obj):
        res = []
        if self.context.get('config_list'):
            for item in self.context.get('config_list').keys():
                res.append({"label" : self.context.get('config_list')[item],"key" : item})
        return res
    def get_entity_workflows(self, obj):
        if obj.entity_workflows.all():
            workflows = obj.entity_workflows.all()
            serializer = OrganisationWorkflowDetailsSerializer(workflows, many=True)
            return serializer.data
        return []
    def get_entity_fields(self, obj):
        res = {}
        res["entity_name"] = obj.entity_name
        res["entity_photo"] = obj.entity_photo
        if self.context.get('config_list'):
            for item in self.context.get('config_list').keys():
                try:
                    if item == "entity_phone_number":
                        res[self.context.get('config_list')[item]] = obj.get_phone_number()
                    elif item == "dob":
                        res[self.context.get('config_list')[item]] = obj.get_dateofbirth()
                    elif item == "joiningDate":
                        res[self.context.get('config_list')[item]] = obj.get_dateofjoining() 
                    else:
                        res[self.context.get('config_list')[item]] = obj.__dict__[item]
                except KeyError:
                    res[self.context.get('config_list')[item]] = obj.entity_data.get(item)
        return res

    class Meta:
        model = OrganisationEntityMasterData
        fields = ('entity_fields','id', 'is_deleted', 'key_label')



class OrganisationEntityMasterDataListSerializer(DynamicFieldsModelSerializer):
    entity_fields = serializers.SerializerMethodField()

    def get_entity_fields(self, obj):
        res = {}
        res["entity_name"] = obj.entity_name
        res["entity_photo"] = obj.entity_photo
        res["candidateId"] = obj.candidateId
        if 'location' in obj.entity_data and obj.entity_data['location']:
            res['location'] = obj.entity_data['location']
        else:
            res['location'] = ""
        res['hire_candidate_source'] = obj.entity_data['hire_candidate_source']
        if self.context.get('config_list'):
            for item in self.context.get('config_list').keys():
                try:
                    if item == "entity_phone_number":
                        res["entity_phone_number"] = obj.get_phone_number()
                    elif item == "dob":
                        res[self.context.get('config_list')[item]] = obj.get_dateofbirth()
                    elif item == "joiningDate":
                        res[self.context.get('config_list')[item]] = obj.get_dateofjoining()
                    else:
                        res[self.context.get('config_list')[item]] = obj.__dict__[item]
                except KeyError:
                    res[self.context.get('config_list')[item]] = obj.entity_data.get(item)
        return res

    class Meta:
        model = OrganisationEntityMasterData
        fields = ('entity_fields','id')

class OrganisationEntityViewSerializer(DynamicFieldsModelSerializer):
    entity_forms = serializers.SerializerMethodField()
    entity_workflows = serializers.SerializerMethodField()


    def get_entity_forms(self, obj):
        form_result_list = []
        if obj.selected_entity_forms:
            for form_name in obj.selected_entity_forms:
                form =  OrganisationForm.objects.filter(name=form_name).last()
                if form:
                    form_result_list.append(form)
        if form_result_list:
            form_serializer = OrganisationFormEntitySerializer(form_result_list, many=True)
            form_result_list = []
            for form_data in form_serializer.data:
                form_result_list.append(form_data['name'])
        return form_result_list

    def get_entity_workflows(self, obj):
        if obj.entity_workflows.all():
            workflows = obj.entity_workflows.all()
            serializer = OrganisationWorkflowDetailsSerializer(workflows, many=True)
            return serializer.data
        return []

    class Meta:
        model = OrganisationEntityView
        fields = ('entity_forms', 'entity_workflows')


class OrganisationEntityAuditLogViewSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = OrganisationEntityAuditLog
        fields = '__all__'

class OrganisationEntityViewListSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrganisationEntityView
        fields = ('id','entity_workflows', 'role', 'config_view', 'entity_master_model', 'selected_entity_forms')

class OrganisationEntityViewCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrganisationEntityView
        fields = '__all__'

class UpdateDataSerializer(serializers.ModelSerializer):

    def to_representation(self, instance):
        item = super().to_representation(instance)
        try:
            item["dob"] =  item["dob"].strftime("%d %b %Y") 
        except:
            item["dob"] =  item["dob"]
        
        try:
            item["joiningDate"] =  item["joiningDate"].strftime("%d %b %Y") 
        except:
            item["joiningDate"] =  item["joiningDate"]

        return item

    class Meta:
        model = OrganisationEntityMasterData
        fields = '__all__'

  
class OrganisationEntityModelSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = OrganisationEntityMasterModel
        exclude = ('entity_views', 'entity_forms')

class CandidateHistorytSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = CandidateHistoryModel
        fields = '__all__'