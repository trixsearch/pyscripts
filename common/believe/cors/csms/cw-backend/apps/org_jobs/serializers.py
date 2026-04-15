# Third-Party imports
import calendar, uuid
from django.db.models.expressions import RawSQL
from django.db.models import Q
from datetime import datetime, timedelta
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from utils.dynamic_serializers import DynamicFieldsModelSerializer
from apps.org_location.models import Location
from apps.org_entity.models import OrganisationEntityMasterData, OrganisationEntityView
from apps.org_users.models import OrganisationUser
from apps.organisations.models import Organisation
# Application imports
from apps.org_jobs.models import (
    Job, JobRole, HiringEvent, Partner, 
    HiringPartner, JobCandidate, HeadCountPlan, HiringState, 
    HeadCountPlanDetail, Slot, JobWorkLocation, VendorWorkLocation, 
    Stage, FilterStage, JobCandidateStage, JobWorkLocality)

class StageSerializer(DynamicFieldsModelSerializer):
    
    def to_internal_value(self, data):
        tenant = data.pop('tenant')
        if "states" in data:
            states_data = []
            for item in data["states"]:
                states_data.append(HiringState.objects.get(name=item, tenant=tenant).id)
            data["states"] = states_data
        return super().to_internal_value(data)
    
    class Meta:
        model = Stage
        fields = '__all__'

class FilterStageSerializer(DynamicFieldsModelSerializer):
    
    def to_internal_value(self, data):
        tenant = data.pop('tenant')
        if "states" in data:
            states_data = []
            for item in data["states"]:
                states_data.append(HiringState.objects.get(name=item, tenant=tenant).id)
            data["states"] = states_data
        return super().to_internal_value(data)
    
    class Meta:
        model = FilterStage
        fields = '__all__'

class JobWorkLocationSerializer(DynamicFieldsModelSerializer):
    
    def to_internal_value(self, data):
        tenant = data.pop('tenant')
        if "work_location" in data:
            data["work_location"] = Location.objects.get(name=data["work_location"], tenant=tenant).id
        return super().to_internal_value(data)
    
    class Meta:
        model = JobWorkLocation
        fields = '__all__'

class VendorWorkLocationSerializer(DynamicFieldsModelSerializer):
    
    def to_internal_value(self, data):
        tenant = data.pop('tenant')
        work_location_data = []
        if "work_location" in data:
            for item in data['work_location']:
                work_location_data.append(Location.objects.get(name=item, tenant=tenant).id)
            data['work_location'] = work_location_data
        if 'vendor' in data:
            data['vendor'] = HiringPartner.objects.get(name=data['vendor'], tenant=tenant).id
        return super().to_internal_value(data)

    class Meta:
        model = VendorWorkLocation
        fields = '__all__'
class JobWorkLocalitySerializer(DynamicFieldsModelSerializer):
    
    def to_internal_value(self, data):
        tenant = data.pop('tenant')
        if "locality" in data:
            locality = data["locality"]
            tenant_object = Organisation.objects.get(pk=tenant)
            location = Location.objects.get_or_create(name=locality['name'], tenant=tenant_object , defaults = {
                "address":locality['formatted_address'] if 'formatted_address' in locality else None,
                "country":locality['country'] if 'country' in locality else None,
                "city":locality['city'] if 'city' in locality else None,
                "state":locality['state'] if 'state' in locality else None,
                "type":'Work Location',
                "latitude":locality['latitude'] if 'latitude' in  locality else None,
                "longitude":locality['longitude'] if 'longitude' in locality else None,
                "locality":locality['name'] if 'name' in locality else None,
            })
            data["locality"] = location[0].id
        return super().to_internal_value(data)
    
    class Meta:
        model = JobWorkLocality
        fields = '__all__'

class OrganisationJobSerializer(DynamicFieldsModelSerializer):
    
    def to_internal_value(self, data):
        tenant = data["tenant"]
        if 'job_work_locality' in data:
            job_work_locality_data = []
            for item in data["job_work_locality"]:
                item["tenant"] = tenant
                serializer = JobWorkLocalitySerializer(data=item)    
                if serializer.is_valid():
                    job_work_locality_data.append(serializer.save().id)
            data["job_work_locality"] = job_work_locality_data
        if 'vendor_work_location' in data:
            vendor_work_location_data = []
            for item in data["vendor_work_location"]:
                item["tenant"] = tenant
                serializer = VendorWorkLocationSerializer(data=item)
                if serializer.is_valid():
                    vendor_work_location_data.append(serializer.save().id)
            data["vendor_work_location"] = vendor_work_location_data
        if 'stage' in data:
            stage_data = []
            for item in data["stage"]:
                item["tenant"] = tenant
                serializer = StageSerializer(data=item)
                if serializer.is_valid():
                    stage_data.append(serializer.save().id)
            data["stage"] = stage_data
        if 'filter_stage' in data:
            stage_data = []
            for item in data["filter_stage"]:
                item["tenant"] = tenant
                serializer = FilterStageSerializer(data=item)
                if serializer.is_valid():
                    stage_data.append(serializer.save().id)
            data["filter_stage"] = stage_data
        return super().to_internal_value(data)

    def to_representation(self, instance):
        item = super().to_representation(instance)
        item["stage_name"] = [item_obj.name for item_obj in instance.stage.all().order_by("order")]
        item["filter_stage_name"] = [item_obj.name for item_obj in instance.filter_stage.all().order_by("order")]
        item["total_positions"] = instance.total_positions
        item["available_positions"] = instance.available_positions
        vendor_loc = []                    
        for item_obj in item["vendor_work_location"]:
            data = VendorWorkLocation.objects.get(id=item_obj)
            vendor_loc.append({ "vendor":data.vendor.name if data.vendor is not None else None,
                            "work_location":[item_obj.name if item_obj is not None else None for item_obj in data.work_location.all()],
                            })
        locality = []
        for item_obj in item["job_work_locality"]:
            data = JobWorkLocality.objects.get(id=item_obj)
            locality.append({ "locality":{"name":data.locality.name if data.locality is not None else None},
                            "id":data.locality.id if data.locality is not None else None,
                            "total_positions": data.total_positions,
                            "filled_positions": data.filled_positions
                            })
        item['work_locality'] = locality
        item["vendor_location"] = vendor_loc
        item["role_name"] = instance.role.name
        item["defaultRole"] = instance.role.platform_role_id
        if item["status"] == "Active" and item["expire_at_target_date"] == True and datetime.now().date() > instance.target_date_to_finish_hiring:
            item["status"] = "Expired"
        return item

    class Meta:
        model = Job
        fields = '__all__'

class OrganisationJobRoleSerializer(DynamicFieldsModelSerializer):

    def to_representation(self, instance):
        item = super().to_representation(instance)
        return item
    class Meta:
        model = JobRole
        fields = '__all__'
        validators = [
            UniqueTogetherValidator(
                queryset=JobRole.objects.all(),
                fields=['name', 'tenant', 'slug'],
                message="Job Role already present"
            )
        ]

class OrganisationHiringEventSerializer(DynamicFieldsModelSerializer):

    def to_representation(self, instance):
        item = super().to_representation(instance)
        item_job = []
        for i in item["job"]:
            item_job.append(Job.objects.get(id=i))
        item["job"] = OrganisationJobSerializer(item_job, many=True).data
        return item

    class Meta:
        model = HiringEvent
        fields = '__all__'

class PartnerSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Partner
        fields = '__all__'

class HiringPartnerSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = HiringPartner
        fields = '__all__'

class HiringStateSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = HiringState
        fields = '__all__'

class JobCandidateSerializer(DynamicFieldsModelSerializer):

    def to_representation(self, instance):
        item = super().to_representation(instance)
        item["job_id"] = instance.job.job_id
        item["job_role"] = instance.job.role.name
        candidate = instance.candidate
        item["candidate_mobile"] = candidate.get_phone_number()
        item["candidate_name"] = candidate.entity_name
        if item["state"]:
            hiring_state = instance.state.name
            item['candidate_state'] = hiring_state
        else:
            item["candidate_state"] = ''
        if item["sourcing_partner"] and item['source'] == 'Sourced':
            item["sourcing_partner__name"] = instance.sourcing_partner.name
        else:
            item["sourcing_partner__name"] = item['source']
        item["entity_master_model_id"] = candidate.entity_model.id
        item["entity_view_id"] = ''
        
        if 'tenant' in self.context:
            if OrganisationEntityView.objects.filter(entity_master_model=candidate.entity_model, tenant__id=self.context["tenant"]):
                item["entity_view_id"] = OrganisationEntityView.objects.filter(entity_master_model=candidate.entity_model, tenant__id=self.context["tenant"])[0].id
        return item
    class Meta:
        model = JobCandidate
        fields = '__all__'
        extra_kwargs = {'job_board': {'required': False}}

class HeadCountPlanSerializer(DynamicFieldsModelSerializer):

    def to_representation(self, instance):
        item = super().to_representation(instance)
        item["location_name"] = instance.location.name
        item["role_name"] = instance.role.name
        return item

    class Meta:
        model = HeadCountPlan
        fields = '__all__'

MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

class HeadCountGapSerializer(DynamicFieldsModelSerializer):

    def to_representation(self, instance):
        item = super().to_representation(instance)
        item["location_name"] = Location.objects.get(id=item["location"]).name
        item["role_name"] = JobRole.objects.get(id=item["role"]).name

        HeadCountPlan_detail = HeadCountPlanDetail.objects.filter(plan=item["id"])
        list_of_year = list(HeadCountPlan_detail.values('year').distinct())
        for item_year in list_of_year:
            item[item_year["year"]] = {}
            for item_month in HeadCountPlan_detail.filter(year=item_year["year"]):
                var_data = {}
                var_data = {"plan_count" : item_month.total_count}
                date_month = datetime(day=calendar.monthrange(item_month.year, MONTH.index(item_month.month) + 1)[1], month=MONTH.index(item_month.month) + 1,year=item_month.year) + timedelta(days=1)
                var_data["achieve"] = OrganisationEntityMasterData.objects.all_with_deleted(date_of_joining__lte=date_month, role=item["role_name"], work_location=item["location_name"]).annotate(date_of_leaving=RawSQL("(entity_data->>'date_of_leaving')::timestamptz",[])).filter(Q(entity_data__date_of_leaving="") | Q(entity_data__date_of_leaving=None) | ~Q(entity_data__has_key="date_of_leaving") | Q(date_of_leaving__gte=date_month)).count()
                var_data["gap"] = var_data["plan_count"] - var_data["achieve"]
                item[item_year["year"]][item_month.month] = var_data
        return item

    class Meta:
        model = HeadCountPlan
        fields = '__all__'
    

class HeadCountPlanDetailSerializer(DynamicFieldsModelSerializer):

    class Meta:
        model = HeadCountPlanDetail
        fields = '__all__'


class JobCandidateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCandidate
        fields = ('id', 'applicationId', 'job', 'hiring_event', 'candidate', 'sourcing_partner', 'source', 'state', 'tenant', 'job_board', 'created_by')
        extra_kwargs = {'job_board': {'required': False}, 'created_by': {'required': False}}

    def to_internal_value(self, data):
        if 'job' in data and data['job']:
            data['job'] = Job.objects.get(job_id=data["job"], tenant__id=data["tenant"]).id
        if 'sourcing_partner' in data and data['sourcing_partner']:
            try:
                data['sourcing_partner'] = HiringPartner.objects.get(vendorId=data["sourcing_partner"], tenant__id=data["tenant"]).id
            except:
                data['sourcing_partner'] = HiringPartner.objects.get(name=data["sourcing_partner"], tenant__id=data["tenant"]).id
        if 'hiring_event' in data and data['hiring_event']:
            data['hiring_event'] = HiringEvent.objects.get(event_id=data["hiring_event"], tenant__id=data["tenant"]).id
        if 'state' in data and data['state']:
            data['state'] = HiringState.objects.get(name=data["state"], tenant__id=data["tenant"]).id
        return super().to_internal_value(data)


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = ('id', 'date', 'start_time', 'alloted_slots', 'booked_slots', 'allow_overbooking', 'job', 'interview_location', 'channel','spoc')
    

    def validate(self, data):

        allow_overbooking = data.get('allow_overbooking', False)
        alloted_slots = data.get('alloted_slots', 0)
        booked_slots = data.get('booked_slots', 0)
        channel = data.get('channel')
        interview_location = data.get('interview_location', None)

        if booked_slots > alloted_slots and not allow_overbooking:
            # Allow overbooking only in case of allow_overbooking is True.

            raise serializers.ValidationError({
                'allow_overbooking' : f'Overbooking should be true. Booked slots({booked_slots}) are more than alloted slots({alloted_slots})'
                })
        
        if channel == Slot.ChannelTypes.f2f and not interview_location:
            # For face to face interview interview location is a required field.

            raise serializers.ValidationError({
                'interview_location' : 'Please provide interview location for the face to face interview'
                })

        return data
    
    def to_internal_value(self, data):
        data['job'] = Job.objects.get(job_id=data['job'], tenant__id=data['tenant']).id
        data["spoc"] = OrganisationUser.objects.get(email=data["spoc"], tenant__id=data['tenant']).id
        # data['interview_location'] = Location.objects.get(city=data['interview_location'], type='Interview Location', tenant__id=data['tenant']).id
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['job'] = Job.objects.get(pk=data['job']).job_id
        if data['interview_location'] is not None:
            location =  Location.objects.get(pk=data['interview_location'])
            data['interview_location_lat'] = location.latitude
            data['interview_location_long'] = location.longitude
            data['interview_location'] = location.city
        if data['spoc'] is not None:
            spoc = OrganisationUser.objects.get(pk=data['spoc'])
            data['spoc_name']=spoc.first_name
            if spoc.mobile: 
                data['spoc_contact']=spoc.mobile.as_e164
        if data['channel'] == Slot.ChannelTypes.audio:
            data['channel'] = 'Audio'
        elif data['channel'] == Slot.ChannelTypes.video:
            data['channel'] = 'Video'
        else:
            data['channel'] = 'Face To Face'
        return data


class JobCandidateStageSerializer(serializers.ModelSerializer):

    class Meta:
        model = JobCandidateStage
        fields = '__all__'