import uuid, datetime, hashlib, requests, json, logging
import uuid, datetime, hashlib, requests, json, logging
from collections import OrderedDict
from django.db.models.signals import post_save
from django.dispatch import receiver
from phonenumber_field.modelfields import PhoneNumberField
from django.contrib.postgres.indexes import GinIndex
from django.db import models, connection
from django.contrib.postgres.fields import JSONField, ArrayField
from ezedox.settings import SECRET_KEY, PLATFORM_BASE_URL, PLATFORM_INTERNAL_TOKEN

from apps.app_registry.models import SoftDeleteModel
from apps.app_registry.models import MyBaseModel
from apps.org_apps.models import OrganisationWorkflow
from apps.org_form.models import OrganisationForm, OrganisationFile
from apps.organisations.models import Organisation
from .AuditConstants import AuditConstants
from .CandidateAuditConstant import CandidateAuditConstants
from utils.dynamic_serializers import DynamicFieldsModelSerializer
from rest_framework import serializers
from .CandidateAuditConstant import CandidateAuditConstants


logger = logging.getLogger(__name__)


def config_default_value():
    return {"entity_phone_number": "Phone Number", "entity_name": " Name"}

# Create your models here.
class OrganisationEntityView(MyBaseModel):
    name             = models.CharField(default=None, max_length=50, blank=True, null=True)
    entity_workflows = models.ManyToManyField(OrganisationWorkflow, default=None, blank=True)
    view_filter      = models.CharField(max_length=256, null=True, blank=True)
    entity_forms     = models.ManyToManyField(OrganisationForm, default=None, blank=True)
    config_view      = models.JSONField(null=True, blank=True, default=config_default_value)
    entity_master_model = models.ForeignKey('OrganisationEntityMasterModel', on_delete=models.PROTECT, related_name='entity_view', blank=True, null=True,default=None)
    selected_entity_forms = models.JSONField(null=True,  blank=True, default=list)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('entity_master_model', 'tenant'),)
        verbose_name = "Organisation Entity View"
        verbose_name_plural = "Organisation Entity Views"

    def save(self, *args, **kwargs):
        if self.selected_entity_forms:
            if isinstance(self.selected_entity_forms, (str)):
                self.selected_entity_forms = eval(self.selected_entity_forms)
        if self.config_view:
            if isinstance(self.config_view, (str)):
                self.config_view = eval(self.config_view)
        super(OrganisationEntityView, self).save(*args, **kwargs)

class OrganisationEntityMasterModel(MyBaseModel):
    TYPE_CHOICES = (
        ('master_data', 'MASTER DATA'),
        ("entities", 'ENTITY')
    )

    name = models.CharField(max_length=255)
    key = models.SlugField(blank=False, null=False, max_length=255)
    search_fields = ArrayField(models.CharField(max_length=50, null=True, blank= True), null=True, blank=True)
    keyvaluepair = models.JSONField(null=True, default=OrderedDict)
    is_visible = models.BooleanField(default=True)
    model_type = models.CharField(choices=TYPE_CHOICES, max_length=50, blank=True, null=True)
    entity_views = models.ManyToManyField(OrganisationEntityView, blank=True, default=None)
    entity_forms = models.ManyToManyField(OrganisationForm, blank=True, default=None)
    unique_field = ArrayField(models.CharField(max_length=255, null=True, blank= True), default=list)
    transform_json = models.JSONField(null=True, default=dict, blank=True)
    platform_schema = models.JSONField(null=True, default=dict, blank=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Organisation Entity Master Model"
        verbose_name_plural = "Organisation Entity Master Models"
        unique_together = (('key', 'tenant'),)

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        if self.keyvaluepair and isinstance(self.keyvaluepair, (str)):
            self.keyvaluepair = eval(self.keyvaluepair)
        super(OrganisationEntityMasterModel, self).save(*args, **kwargs)


class OrganisationEntityMasterData(SoftDeleteModel):

    STATUS = (
        ('active','active'),
        ('inactive','inactive')
    )

    CANDIDATE_STATUS = (
        ('Hired', 'Hired'),
        ('Rejected', 'Rejected'),
        ('NoShow', 'NoShow'),
        ('OnHold', 'OnHold')
    )

    EMPLOYEE_STATUS = (
        ('New', 'New'),
        ('Interviewed', 'Interviewed'),
        ('Offered', 'Offered'),
        ('Accepted', 'Accepted'),
        ('Active', 'Active'),
        ('Inactive', 'Inactive')
    )

    EMPLOYEE_TYPES = (
        ('Candidate', 'Candidate'),
        ('Employee', 'Employee'),
        ('Exemployee', 'Exemployee')
    )

    candidateId = models.CharField(max_length=25, blank=True)
    entity_data = models.JSONField(null=True, default=dict)
    entity_model = models.ForeignKey(OrganisationEntityMasterModel, on_delete= models.PROTECT, null=False, blank=False)
    entity_name = models.CharField(max_length=255,default=None, blank=True, null=True, db_index=True)
    entity_phone_number = PhoneNumberField(default=None, verbose_name="Mobile Number", blank=True, null=True, db_index=True)
    entity_email = models.EmailField(default=None, blank=True, null=True, db_index=True)
    entity_photo = models.JSONField(blank=True, null=True, default=dict)
    father_name = models.CharField(max_length=255, blank=True)
    dob = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=255,default=None, blank=True, null=True)
    joiningDate = models.DateField(blank=True, null=True)
    role = models.CharField(max_length=255, blank=True)
    pan = models.CharField(max_length=255, blank=True)
    pan_url = models.JSONField(null=True, default=dict)
    name_on_pan_card = models.CharField(max_length=255,blank=True, null=True)
    pan_verified = models.BooleanField(default=False)
    aadhaar = models.CharField(max_length=255,blank=True, null=True)
    aadhaar_hash = models.CharField(max_length=255, blank=True, null=True)
    aadhaar_last_digits = models.CharField(max_length=255, blank=True, null=True)
    aadhaar_verified = models.BooleanField(default=False)
    aadhaar_check_ID = models.UUIDField(default=uuid.uuid4, editable=False, blank=True)
    defaultRole = models.CharField(max_length=255,default=None, blank=True, null=True)
    defaultLocation = models.CharField(max_length=255,default=None, blank=True, null=True)
    work_location = models.CharField(max_length=255, blank=True, null=True)
    present_address_line = models.CharField(max_length=255, blank=True, null=True)
    present_address_city = models.CharField(max_length=255, blank=True, null=True)
    present_address_district = models.CharField(max_length=255, blank=True, null=True)
    present_address_state = models.CharField(max_length=255, blank=True, null=True)
    present_address_locality = models.CharField(max_length=255, blank=True, null=True)
    present_address_landmark = models.CharField(max_length=255, blank=True, null=True)
    present_address_pincode = models.CharField(max_length=255, blank=True, null=True)
    present_address_verified = models.BooleanField(default=False, blank=True, null=True)
    permanent_address_line = models.CharField(max_length=255, blank=True, null=True)
    permanent_address_city = models.CharField(max_length=255, blank=True, null=True)
    permanent_address_district = models.CharField(max_length=255, blank=True, null=True)
    permanent_address_state = models.CharField(max_length=255, blank=True, null=True)
    permanent_address_verified = models.BooleanField(default=False)
    permanent_address_locality = models.CharField(max_length=255, blank=True, null=True)
    permanent_address_landmark = models.CharField(max_length=255, blank=True, null=True)
    permanent_address_pincode = models.CharField(max_length=255, blank=True, null=True)
    employee_type = models.CharField(choices=EMPLOYEE_TYPES, max_length=50, blank=True, null=True)
    entityType = models.CharField(max_length=50, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_number = PhoneNumberField(default=None, blank=True, null=True)
    emergency_contact_relationship = models.CharField(max_length=255, blank=True)
    bank_account_name = models.CharField(max_length=255, blank=True, null=True)
    bank_ifsc_code = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(choices=EMPLOYEE_STATUS, max_length=50, blank=True, null=True)
    in_payroll = models.BooleanField(default=False)
    Height = models.CharField(max_length=50, blank=True, null=True)
    Weight = models.CharField(max_length=50, blank=True, null=True)
    Bloodgroup = models.CharField(max_length=50, blank=True, null=True)
    employeeId = models.CharField(unique=True, max_length=255, blank=True, null=True)
    employment_status =  models.CharField(choices=STATUS, max_length=50, blank=True, null=True)
    employeeType = models.CharField(max_length=255,default=None, blank=True, null=True)
    status =  models.CharField(max_length=50, blank=True, null=True)
    partner_profile_id = models.IntegerField(blank=True, null=True)
    voterid = models.CharField(max_length=255, blank=True)
    vidUrl = models.JSONField(null=True, blank=True, default=dict)
    name_on_voter_id = models.CharField(max_length=255,blank=True, null=True)
    drivingLicense = models.CharField(max_length=255, blank=True)
    dlUrl = models.JSONField(null=True, blank=True, default=dict)
    name_on_dl = models.CharField(max_length=255,blank=True, null=True)
    blacklist_reason = models.TextField(blank=True, null=True)
    bpss_id = models.CharField(max_length=255,blank=True, null=True)

    @property
    def representation(self):
        return 'Entity Name : {}'.format(self.entity_name)
    
    class Meta:
        verbose_name = "Organisation Entity Master Data"
        verbose_name_plural = "Organisation Entity Master Data"
        indexes = [GinIndex(fields=['entity_data'])]
    
    def __str__(self):
        return self.representation
        
    def get_phone_number(self):
        return str(self.entity_phone_number) if self.entity_phone_number else ''
    
    def get_dateofbirth(self):
        try:
            return self.dob.strftime("%d %b %Y") 
        except:
            return self.dob
    
    def get_dateofjoining(self):
        try:
            return self.joiningDate.strftime("%d %b %Y") 
        except:
            return self.joiningDate

    def restore(self,*args,**kwargs):
        if not self.is_deleted: return
        self.is_deleted=False
        self.save()
        for item in OrganisationEntityAuditLog.objects.all_with_deleted().filter(entity__id=self.id):
            item.restore()

    def save(self, *args, **kwargs):
        if 'entity_name' in self.entity_data:
            self.entity_name = self.entity_data['entity_name']
            del self.entity_data['entity_name']

        if 'entity_phone_number' in self.entity_data:
            self.entity_phone_number = self.entity_data['entity_phone_number']
            del self.entity_data['entity_phone_number']
            
        if 'entity_email' in self.entity_data:
            self.entity_email = self.entity_data['entity_email']
            del self.entity_data['entity_email']
        
        if 'entity_photo' in self.entity_data:
            self.entity_photo = self.entity_data['entity_photo']
            del self.entity_data['entity_photo']
        
        if 'father_name' in self.entity_model.transform_json:
            if self.entity_model.transform_json['father_name'] in self.entity_data:
                self.father_name = self.entity_data[self.entity_model.transform_json['father_name']]
                del self.entity_data[self.entity_model.transform_json['father_name']]
        if 'father_name' in self.entity_data:
            self.father_name = self.entity_data['father_name']
            del self.entity_data['father_name']
                
        
        if 'dob' in self.entity_model.transform_json:
            if self.entity_model.transform_json['dob'] in self.entity_data:
                try:
                    self.dob = datetime.datetime.strptime(self.entity_data[self.entity_model.transform_json['dob']], "%d %b %Y").date()
                except:
                    self.dob = self.entity_data[self.entity_model.transform_json['dob']]
                del self.entity_data[self.entity_model.transform_json['dob']]
        if 'dob' in self.entity_data:
            try:
                self.dob = datetime.datetime.strptime(self.entity_data['dob'], "%d %b %Y").date()
            except:
                self.dob = self.entity_data['dob']
            del self.entity_data['dob']

        if 'joiningDate' in self.entity_model.transform_json:
            if self.entity_model.transform_json['joiningDate'] in self.entity_data:
                try:
                    self.joiningDate = datetime.datetime.strptime(self.entity_data[self.entity_model.transform_json['joiningDate']], "%d %b %Y").date()
                except:
                    self.joiningDate = self.entity_data[self.entity_model.transform_json['joiningDate']]
                del self.entity_data[self.entity_model.transform_json['joiningDate']]
        if 'joiningDate' in self.entity_data:
            try:
                self.joiningDate = datetime.datetime.strptime(self.entity_data['joiningDate'], "%d %b %Y").date()
            except:
                self.joiningDate = self.entity_data['joiningDate']
            del self.entity_data['joiningDate']

        if 'role' in self.entity_model.transform_json:
            if self.entity_model.transform_json['role'] in self.entity_data:
                self.role = self.entity_data[self.entity_model.transform_json['role']]
                del self.entity_data[self.entity_model.transform_json['role']]
        if 'role' in self.entity_data:
            self.role = self.entity_data['role']
            del self.entity_data['role']
        
        if 'pan' in self.entity_model.transform_json:
            if self.entity_model.transform_json['pan'] in self.entity_data:
                self.pan = self.entity_data[self.entity_model.transform_json['pan']]
                del self.entity_data[self.entity_model.transform_json['pan']]
        if 'pan' in self.entity_data:
            self.pan = self.entity_data['pan']
            del self.entity_data['pan']
        
        if 'pan_url' in self.entity_model.transform_json:
            if self.entity_model.transform_json['pan_url'] in self.entity_data:
                self.pan_url = self.entity_data[self.entity_model.transform_json['pan_url']]
                del self.entity_data[self.entity_model.transform_json['pan_url']]
        if 'pan_url' in self.entity_data:
            self.pan_url = self.entity_data['pan_url']
            del self.entity_data['pan_url']

        if 'name_on_pan_card' in self.entity_model.transform_json:
            if self.entity_model.transform_json['name_on_pan_card'] in self.entity_data:
                self.name_on_pan_card = self.entity_data[self.entity_model.transform_json['name_on_pan_card']]
                del self.entity_data[self.entity_model.transform_json['name_on_pan_card']]
        if 'name_on_pan_card' in self.entity_data:
            self.name_on_pan_card = self.entity_data['name_on_pan_card']
            del self.entity_data['name_on_pan_card']
        
        if 'pan_verified' in self.entity_model.transform_json:
            if self.entity_model.transform_json['pan_verified'] in self.entity_data:
                self.pan_verified = self.entity_data[self.entity_model.transform_json['pan_verified']]
                del self.entity_data[self.entity_model.transform_json['pan_verified']]
        if 'pan_verified' in self.entity_data:
            self.pan_verified = self.entity_data['pan_verified']
            del self.entity_data['pan_verified']
        
        if 'aadhaar' in self.entity_model.transform_json:
            if self.entity_model.transform_json['aadhaar'] in self.entity_data:
                self.aadhaar = self.entity_data[self.entity_model.transform_json['aadhaar']]
                if self.aadhaar and len(self.aadhaar) == 12:
                    self.aadhaar_hash = hashlib.sha256((self.aadhaar + SECRET_KEY).encode()).hexdigest()
                    self.aadhaar_last_digits = "X"*8 + self.aadhaar[-4:]
                del self.entity_data[self.entity_model.transform_json['aadhaar']]

        if 'aadhaar' in self.entity_data:
            self.aadhaar = self.entity_data['aadhaar']
            if self.aadhaar and len(self.aadhaar) == 12:
                self.aadhaar_hash = hashlib.sha256((self.aadhaar + SECRET_KEY).encode()).hexdigest()
                self.aadhaar_last_digits = "X"*8 + self.aadhaar[-4:]
            del self.entity_data['aadhaar']
        
        if 'gender' in self.entity_model.transform_json:
            if self.entity_model.transform_json['gender'] in self.entity_data:
                self.gender = self.entity_data[self.entity_model.transform_json['gender']]
                del self.entity_data[self.entity_model.transform_json['gender']]
        if 'gender' in self.entity_data:
            self.gender = self.entity_data['gender']
            del self.entity_data['gender']
        
        if 'defaultRole' in self.entity_model.transform_json:
            if self.entity_model.transform_json['defaultRole'] in self.entity_data:
                self.defaultRole = self.entity_data[self.entity_model.transform_json['defaultRole']]
                del self.entity_data[self.entity_model.transform_json['defaultRole']]
        if 'defaultRole' in self.entity_data:
            self.defaultRole = self.entity_data['defaultRole']
            del self.entity_data['defaultRole']
        
        if 'defaultLocation' in self.entity_model.transform_json:
            if self.entity_model.transform_json['defaultLocation'] in self.entity_data:
                self.defaultLocation = self.entity_data[self.entity_model.transform_json['defaultLocation']]
                del self.entity_data[self.entity_model.transform_json['defaultLocation']]
        if 'defaultLocation' in self.entity_data:
            self.defaultLocation = self.entity_data['defaultLocation']
            del self.entity_data['defaultLocation']
        
        if 'aadhaar_hash' in self.entity_model.transform_json:
            if self.entity_model.transform_json['aadhaar_hash'] in self.entity_data:
                self.aadhaar_hash = self.entity_data[self.entity_model.transform_json['aadhaar_hash']]
                del self.entity_data[self.entity_model.transform_json['aadhaar_hash']]
        if 'aadhaar_hash' in self.entity_data:
            self.aadhaar_hash = self.entity_data['aadhaar_hash']
            del self.entity_data['aadhaar_hash']
        
        if 'aadhaar_last_digits' in self.entity_model.transform_json:
            if self.entity_model.transform_json['aadhaar_last_digits'] in self.entity_data:
                self.aadhaar_last_digits = self.entity_data[self.entity_model.transform_json['aadhaar_last_digits']]
                del self.entity_data[self.entity_model.transform_json['aadhaar_last_digits']]
        if 'aadhaar_last_digits' in self.entity_data:
            self.aadhaar_last_digits = self.entity_data['aadhaar_last_digits']
            del self.entity_data['aadhaar_last_digits']
        
        if 'aadhaar_verified' in self.entity_model.transform_json:
            if self.entity_model.transform_json['aadhaar_verified'] in self.entity_data:
                self.aadhaar_verified = self.entity_data[self.entity_model.transform_json['aadhaar_verified']]
                del self.entity_data[self.entity_model.transform_json['aadhaar_verified']]
        if 'aadhaar_verified' in self.entity_data:
            self.aadhaar_verified = self.entity_data['aadhaar_verified']
            del self.entity_data['aadhaar_verified']
        
        if 'aadhaar_check_ID' in self.entity_model.transform_json:
            if self.entity_model.transform_json['aadhaar_check_ID'] in self.entity_data:
                self.aadhaar_check_ID = self.entity_data[self.entity_model.transform_json['aadhaar_check_ID']]
                del self.entity_data[self.entity_model.transform_json['aadhaar_check_ID']]
        if 'aadhaar_check_ID' in self.entity_data:
            self.aadhaar_check_ID = self.entity_data['aadhaar_check_ID']
            del self.entity_data['aadhaar_check_ID']

        if 'work_location' in self.entity_model.transform_json:
            if self.entity_model.transform_json['work_location'] in self.entity_data:
                self.work_location = self.entity_data[self.entity_model.transform_json['work_location']]
                del self.entity_data[self.entity_model.transform_json['work_location']]
        if 'work_location' in self.entity_data:
            self.work_location = self.entity_data['work_location']
            del self.entity_data['work_location']
        
        if 'present_address_line' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_line'] in self.entity_data:
                self.present_address_line = self.entity_data[self.entity_model.transform_json['present_address_line']]
                del self.entity_data[self.entity_model.transform_json['present_address_line']]
        if 'present_address_line' in self.entity_data:
            self.present_address_line = self.entity_data['present_address_line']
            del self.entity_data['present_address_line']
        
        if 'present_address_city' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_city'] in self.entity_data:
                self.present_address_city = self.entity_data[self.entity_model.transform_json['present_address_city']]
                del self.entity_data[self.entity_model.transform_json['present_address_city']]
        if 'present_address_city' in self.entity_data:
            self.present_address_city = self.entity_data['present_address_city']
            del self.entity_data['present_address_city']
        
        if 'present_address_district' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_district'] in self.entity_data:
                self.present_address_district = self.entity_data[self.entity_model.transform_json['present_address_district']]
                del self.entity_data[self.entity_model.transform_json['present_address_district']]
        if 'present_address_district' in self.entity_data:
            self.present_address_district = self.entity_data['present_address_district']
            del self.entity_data['present_address_district']

        if 'present_address_state' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_state'] in self.entity_data:
                self.present_address_state = self.entity_data[self.entity_model.transform_json['present_address_state']]
                del self.entity_data[self.entity_model.transform_json['present_address_state']]
        if 'present_address_state' in self.entity_data:
            self.present_address_state = self.entity_data['present_address_state']
            del self.entity_data['present_address_state']
        
        if 'present_address_locality' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_locality'] in self.entity_data:
                self.present_address_locality = self.entity_data[self.entity_model.transform_json['present_address_locality']]
                del self.entity_data[self.entity_model.transform_json['present_address_locality']]
        if 'present_address_locality' in self.entity_data:
            self.present_address_locality = self.entity_data['present_address_locality']
            del self.entity_data['present_address_locality']
        
        if 'present_address_landmark' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_landmark'] in self.entity_data:
                self.present_address_landmark = self.entity_data[self.entity_model.transform_json['present_address_landmark']]
                del self.entity_data[self.entity_model.transform_json['present_address_landmark']]
        if 'present_address_landmark' in self.entity_data:
            self.present_address_landmark = self.entity_data['present_address_landmark']
            del self.entity_data['present_address_landmark']
        
        if 'present_address_district' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_district'] in self.entity_data:
                self.present_address_district = self.entity_data[self.entity_model.transform_json['present_address_district']]
                del self.entity_data[self.entity_model.transform_json['present_address_district']]
        if 'present_address_district' in self.entity_data:
            self.present_address_district = self.entity_data['present_address_district']
            del self.entity_data['present_address_district']

        if 'present_address_pincode' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_pincode'] in self.entity_data:
                self.present_address_pincode = self.entity_data[self.entity_model.transform_json['present_address_pincode']]
                del self.entity_data[self.entity_model.transform_json['present_address_pincode']]
        if 'present_address_pincode' in self.entity_data:
            self.present_address_pincode = self.entity_data['present_address_pincode']
            del self.entity_data['present_address_pincode']

        if 'present_address_verified' in self.entity_model.transform_json:
            if self.entity_model.transform_json['present_address_verified'] in self.entity_data:
                self.present_address_verified = self.entity_data[self.entity_model.transform_json['present_address_verified']]
                del self.entity_data[self.entity_model.transform_json['present_address_verified']]
        if 'present_address_verified' in self.entity_data:
            self.present_address_verified = self.entity_data['present_address_verified']
            del self.entity_data['present_address_verified']
        
        if 'permanent_address_line' in self.entity_model.transform_json:
            if self.entity_model.transform_json['permanent_address_line'] in self.entity_data:
                self.permanent_address_line = self.entity_data[self.entity_model.transform_json['permanent_address_line']]
                del self.entity_data[self.entity_model.transform_json['permanent_address_line']]
        if 'permanent_address_line' in self.entity_data:
            self.permanent_address_line = self.entity_data['permanent_address_line']
            del self.entity_data['permanent_address_line']
        
        if 'permanent_address_city' in self.entity_model.transform_json:
            if self.entity_model.transform_json['permanent_address_city'] in self.entity_data:
                self.permanent_address_city = self.entity_data[self.entity_model.transform_json['permanent_address_city']]
                del self.entity_data[self.entity_model.transform_json['permanent_address_city']]
        if 'permanent_address_city' in self.entity_data:
            self.permanent_address_city = self.entity_data['permanent_address_city']
            del self.entity_data['permanent_address_city']
        
        if 'permanent_address_district' in self.entity_model.transform_json:
            if self.entity_model.transform_json['permanent_address_district'] in self.entity_data:
                self.permanent_address_district = self.entity_data[self.entity_model.transform_json['permanent_address_district']]
                del self.entity_data[self.entity_model.transform_json['permanent_address_district']]
        if 'permanent_address_district' in self.entity_data:
            self.permanent_address_district = self.entity_data['permanent_address_district']
            del self.entity_data['permanent_address_district']
        
        if 'permanent_address_state' in self.entity_model.transform_json:
            if self.entity_model.transform_json['permanent_address_state'] in self.entity_data:
                self.permanent_address_state = self.entity_data[self.entity_model.transform_json['permanent_address_state']]
                del self.entity_data[self.entity_model.transform_json['permanent_address_state']]
        if 'permanent_address_state' in self.entity_data:
            self.permanent_address_state = self.entity_data['permanent_address_state']
            del self.entity_data['permanent_address_state']

        if 'permanent_address_locality' in self.entity_model.transform_json:
            if self.entity_model.transform_json['permanent_address_locality'] in self.entity_data:
                self.permanent_address_locality = self.entity_data[self.entity_model.transform_json['permanent_address_locality']]
                del self.entity_data[self.entity_model.transform_json['permanent_address_locality']]
        if 'permanent_address_locality' in self.entity_data:
            self.permanent_address_locality = self.entity_data['permanent_address_locality']
            del self.entity_data['permanent_address_locality']
        
        if 'permanent_address_landmark' in self.entity_model.transform_json:
            if self.entity_model.transform_json['permanent_address_landmark'] in self.entity_data:
                self.permanent_address_landmark = self.entity_data[self.entity_model.transform_json['permanent_address_landmark']]
                del self.entity_data[self.entity_model.transform_json['permanent_address_landmark']]
        if 'permanent_address_landmark' in self.entity_data:
            self.permanent_address_landmark = self.entity_data['permanent_address_landmark']
            del self.entity_data['permanent_address_landmark']

        if 'permanent_address_pincode' in self.entity_model.transform_json:
            if self.entity_model.transform_json['permanent_address_pincode'] in self.entity_data:
                self.permanent_address_pincode = self.entity_data[self.entity_model.transform_json['permanent_address_pincode']]
                del self.entity_data[self.entity_model.transform_json['permanent_address_pincode']]
        if 'permanent_address_pincode' in self.entity_data:
            self.permanent_address_pincode = self.entity_data['permanent_address_pincode']
            del self.entity_data['permanent_address_pincode']

        if 'permanent_address_verified' in self.entity_model.transform_json:
            if self.entity_model.transform_json['permanent_address_verified'] in self.entity_data:
                self.permanent_address_verified = self.entity_data[self.entity_model.transform_json['permanent_address_verified']]
                del self.entity_data[self.entity_model.transform_json['permanent_address_verified']]
        if 'permanent_address_verified' in self.entity_data:
            self.permanent_address_verified = self.entity_data['permanent_address_verified']
            del self.entity_data['permanent_address_verified']
        
        if 'employee_type' in self.entity_model.transform_json:
            if self.entity_model.transform_json['employee_type'] in self.entity_data:
                self.employee_type = self.entity_data[self.entity_model.transform_json['employee_type']]
                del self.entity_data[self.entity_model.transform_json['employee_type']]
        if 'employee_type' in self.entity_data:
            self.employee_type = self.entity_data['employee_type']
            del self.entity_data['employee_type']

        if 'emergency_contact_name' in self.entity_model.transform_json:
            if self.entity_model.transform_json['emergency_contact_name'] in self.entity_data:
                self.emergency_contact_name = self.entity_data[self.entity_model.transform_json['emergency_contact_name']]
                del self.entity_data[self.entity_model.transform_json['emergency_contact_name']]
        if 'emergency_contact_name' in self.entity_data:
            self.emergency_contact_name = self.entity_data['emergency_contact_name']
            del self.entity_data['emergency_contact_name']
        
        if 'emergency_contact_number' in self.entity_model.transform_json:
            if self.entity_model.transform_json['emergency_contact_number'] in self.entity_data:
                self.emergency_contact_number = self.entity_data[self.entity_model.transform_json['emergency_contact_number']]
                del self.entity_data[self.entity_model.transform_json['emergency_contact_number']]
        if 'emergency_contact_number' in self.entity_data:
            self.emergency_contact_number = self.entity_data['emergency_contact_number']
            del self.entity_data['emergency_contact_number']
        
        if 'emergency_contact_relationship' in self.entity_model.transform_json:
            if self.entity_model.transform_json['emergency_contact_relationship'] in self.entity_data:
                self.emergency_contact_relationship = self.entity_data[self.entity_model.transform_json['emergency_contact_relationship']]
                del self.entity_data[self.entity_model.transform_json['emergency_contact_relationship']]
        if 'emergency_contact_relationship' in self.entity_data:
            self.emergency_contact_relationship = self.entity_data['emergency_contact_relationship']
            del self.entity_data['emergency_contact_relationship']

        if 'bank_account_name' in self.entity_model.transform_json:
            if self.entity_model.transform_json['bank_account_name'] in self.entity_data:
                self.bank_account_name = self.entity_data[self.entity_model.transform_json['bank_account_name']]
                del self.entity_data[self.entity_model.transform_json['bank_account_name']]
        if 'bank_account_name' in self.entity_data:
            self.bank_account_name = self.entity_data['bank_account_name']
            del self.entity_data['bank_account_name']
        
        if 'bank_ifsc_code' in self.entity_model.transform_json:
            if self.entity_model.transform_json['bank_ifsc_code'] in self.entity_data:
                self.bank_ifsc_code = self.entity_data[self.entity_model.transform_json['bank_ifsc_code']]
                del self.entity_data[self.entity_model.transform_json['bank_ifsc_code']]
        if 'bank_ifsc_code' in self.entity_data:
            self.bank_ifsc_code = self.entity_data['bank_ifsc_code']
            del self.entity_data['bank_ifsc_code']
        
        if 'bank_account_number' in self.entity_model.transform_json:
            if self.entity_model.transform_json['bank_account_number'] in self.entity_data:
                self.bank_account_number = self.entity_data[self.entity_model.transform_json['bank_account_number']]
                del self.entity_data[self.entity_model.transform_json['bank_account_number']]
        if 'bank_account_number' in self.entity_data:
            self.bank_account_number = self.entity_data['bank_account_number']
            del self.entity_data['bank_account_number']
        
        if 'status' in self.entity_model.transform_json:
            if self.entity_model.transform_json['status'] in self.entity_data:
                self.status = self.entity_data[self.entity_model.transform_json['status']]
                del self.entity_data[self.entity_model.transform_json['status']]
        if 'status' in self.entity_data:
            self.status = self.entity_data['status']
            del self.entity_data['status']
        
        if 'in_payroll' in self.entity_model.transform_json:
            if self.entity_model.transform_json['in_payroll'] in self.entity_data:
                self.in_payroll = self.entity_data[self.entity_model.transform_json['in_payroll']]
                del self.entity_data[self.entity_model.transform_json['in_payroll']]
        if 'in_payroll' in self.entity_data:
            self.in_payroll = self.entity_data['in_payroll']
            del self.entity_data['in_payroll']
        
        if 'Height' in self.entity_model.transform_json:
            if self.entity_model.transform_json['Height'] in self.entity_data:
                self.Height = self.entity_data[self.entity_model.transform_json['Height']]
                del self.entity_data[self.entity_model.transform_json['Height']]
        if 'Height' in self.entity_data:
            self.Height = self.entity_data['Height']
            del self.entity_data['Height']
        
        if 'Weight' in self.entity_model.transform_json:
            if self.entity_model.transform_json['Weight'] in self.entity_data:
                self.Weight = self.entity_data[self.entity_model.transform_json['Weight']]
                del self.entity_data[self.entity_model.transform_json['Weight']]
        if 'Weight' in self.entity_data:
            self.Weight = self.entity_data['Weight']
            del self.entity_data['Weight']
        
        if 'Bloodgroup' in self.entity_model.transform_json:
            if self.entity_model.transform_json['Bloodgroup'] in self.entity_data:
                self.Bloodgroup = self.entity_data[self.entity_model.transform_json['Bloodgroup']]
                del self.entity_data[self.entity_model.transform_json['Bloodgroup']]
        if 'Bloodgroup' in self.entity_data:
            self.Bloodgroup = self.entity_data['Bloodgroup']
            del self.entity_data['Bloodgroup']

        if 'employeeId' in self.entity_model.transform_json:
            if self.entity_model.transform_json['employeeId'] in self.entity_data:
                self.employeeId = self.entity_data[self.entity_model.transform_json['employeeId']]
                del self.entity_data[self.entity_model.transform_json['employeeId']]
        if 'employeeId' in self.entity_data:
            self.employeeId = self.entity_data['employeeId']
            del self.entity_data['employeeId']
        
        if 'employment_status' in self.entity_model.transform_json:
            if self.entity_model.transform_json['employment_status'] in self.entity_data:
                self.employment_status = self.entity_data[self.entity_model.transform_json['employment_status']]
                del self.entity_data[self.entity_model.transform_json['employment_status']]
        if 'employment_status' in self.entity_data:
            self.employment_status = self.entity_data['employment_status']
            del self.entity_data['employment_status']

        if 'employeeType' in self.entity_model.transform_json:
            if self.entity_model.transform_json['employeeType'] in self.entity_data:
                self.employeeType = self.entity_data[self.entity_model.transform_json['employeeType']]
                del self.entity_data[self.entity_model.transform_json['employeeType']]
        if 'employeeType' in self.entity_data:
            self.employeeType = self.entity_data['employeeType']
            del self.entity_data['employeeType']
        
        if 'entityType' in self.entity_model.transform_json:
            if self.entity_model.transform_json['entityType'] in self.entity_data:
                self.entityType = self.entity_data[self.entity_model.transform_json['entityType']]
                del self.entity_data[self.entity_model.transform_json['entityType']]
        if 'entityType' in self.entity_data:
            self.entityType = self.entity_data['entityType']
            del self.entity_data['entityType']
        
        if 'status' in self.entity_model.transform_json:
            if self.entity_model.transform_json['status'] in self.entity_data:
                self.status = self.entity_data[self.entity_model.transform_json['status']]
                del self.entity_data[self.entity_model.transform_json['status']]
        if 'status' in self.entity_data:
            self.status = self.entity_data['status']
            del self.entity_data['status']

        if 'voterid' in self.entity_model.transform_json:
            if self.entity_model.transform_json['voterid'] in self.entity_data:
                self.voterid = self.entity_data[self.entity_model.transform_json['voterid']]
                del self.entity_data[self.entity_model.transform_json['voterid']]
        if 'voterid' in self.entity_data:
            self.voterid = self.entity_data['voterid']
            del self.entity_data['voterid']
        
        if 'vidUrl' in self.entity_model.transform_json:
            if self.entity_model.transform_json['vidUrl'] in self.entity_data:
                self.vidUrl = self.entity_data[self.entity_model.transform_json['vidUrl']]
                del self.entity_data[self.entity_model.transform_json['vidUrl']]
        if 'vidUrl' in self.entity_data:
            self.vidUrl = self.entity_data['vidUrl']
            del self.entity_data['vidUrl']

        if 'name_on_voter_id' in self.entity_model.transform_json:
            if self.entity_model.transform_json['name_on_voter_id'] in self.entity_data:
                self.name_on_voter_id = self.entity_data[self.entity_model.transform_json['name_on_voter_id']]
                del self.entity_data[self.entity_model.transform_json['name_on_voter_id']]
        if 'name_on_voter_id' in self.entity_data:
            self.name_on_voter_id = self.entity_data['name_on_voter_id']
            del self.entity_data['name_on_voter_id']

        if 'drivingLicense' in self.entity_model.transform_json:
            if self.entity_model.transform_json['drivingLicense'] in self.entity_data:
                self.drivingLicense = self.entity_data[self.entity_model.transform_json['drivingLicense']]
                del self.entity_data[self.entity_model.transform_json['drivingLicense']]
        if 'drivingLicense' in self.entity_data:
            self.drivingLicense = self.entity_data['drivingLicense']
            del self.entity_data['drivingLicense']
        
        if 'dlUrl' in self.entity_model.transform_json:
            if self.entity_model.transform_json['dlUrl'] in self.entity_data:
                self.dlUrl = self.entity_data[self.entity_model.transform_json['dlUrl']]
                del self.entity_data[self.entity_model.transform_json['dlUrl']]
        if 'dlUrl' in self.entity_data:
            self.dlUrl = self.entity_data['dlUrl']
            del self.entity_data['dlUrl']

        if 'name_on_dl' in self.entity_model.transform_json:
            if self.entity_model.transform_json['name_on_dl'] in self.entity_data:
                self.name_on_dl = self.entity_data[self.entity_model.transform_json['name_on_dl']]
                del self.entity_data[self.entity_model.transform_json['name_on_dl']]
        if 'name_on_dl' in self.entity_data:
            self.name_on_dl = self.entity_data['name_on_dl']
            del self.entity_data['name_on_dl']
        
        if 'is_deleted' in self.entity_model.transform_json:
            if self.entity_model.transform_json['is_deleted'] in self.entity_data:
                self.is_deleted = self.entity_data[self.entity_model.transform_json['is_deleted']]
                if self.entity_data[self.entity_model.transform_json['is_deleted']] == False:
                    self.deleted_at = None
                del self.entity_data[self.entity_model.transform_json['is_deleted']]
        if 'is_deleted' in self.entity_data:
            self.is_deleted = self.entity_data['is_deleted']
            if self.entity_data['is_deleted'] == False:
                self.deleted_at = None
            del self.entity_data['is_deleted']

        super(OrganisationEntityMasterData, self).save(*args, **kwargs)

class OrganisationEntityAuditLog(SoftDeleteModel):
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    name              = models.CharField(max_length=255)
    activity_type     = models.CharField(max_length=255)
    assignee          = models.CharField(max_length=255, null=True)
    end_time          = models.DateTimeField(auto_now=False, auto_now_add=False)
    entity            = models.ForeignKey(OrganisationEntityMasterData, on_delete=models.CASCADE, blank=False, null=False)
    event             = models.CharField(max_length=100, choices=AuditConstants.MODEL_CHOICES, blank=True, null=True)

    class Meta:
        verbose_name = "Entity Audit Log"
        verbose_name_plural = "Entity Audit Logs"

class OrganisationEntityFirstDataSerializer2(DynamicFieldsModelSerializer):
    full_permanent_address = serializers.SerializerMethodField()
    full_current_address = serializers.SerializerMethodField()
    dob = serializers.SerializerMethodField()
    joiningDate = serializers.SerializerMethodField()

    def get_dob(self,obj):
        try:
            return obj.dob.strftime("%Y-%m-%d") 
        except:
            return obj.dob
    
    def get_joiningDate(self,obj):
        try:
            return obj.joiningDate.strftime("%Y-%m-%d") 
        except:
            return obj.joiningDate

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


@receiver(post_save, sender=OrganisationEntityMasterData, dispatch_uid="bpss_employee_sync")
def bpss_employee_sync(sender, instance, created, **kwargs):
    try:
        if instance.employee_type == "Employee":
            document_payload = []
            payload = {
                "isConsentAccepted": True,
                "contacts": [
                    {
                    "type": "MOBILE",
                    "isPrimary": True,
                    "contact": instance.get_phone_number()
                    },
                    {
                    "type": "EMAIL",
                    "isPrimary": True,
                    "contact": instance.entity_email
                    }
                ],
            }
            entity_data = instance.entity_data
            first_class_data = OrganisationEntityFirstDataSerializer2(instance).data
            entity_data.update(first_class_data)

            for item in instance.entity_model.platform_schema["others"]:
                if item == "profilePicUrl":
                    payload[item] = "file/download/" + OrganisationFile.objects.get(id=entity_data["entity_photo"][0]["url"].split('/')[-1]).file.file.name
                if item in entity_data:
                    payload[item] = entity_data[item]
                    if item == "educationDetails":
                        for item_obj in payload[item]:
                            item_obj["downloadURL"] = []
                            for item_ins in item_obj["educationDetails_file"]:
                                item_obj["downloadURL"].append("file/download/" + OrganisationFile.objects.get(id=item_ins["url"].split('/')[-1]).file.file.name)
                else:
                    pass

            for item in instance.entity_model.platform_schema["documents"]:
                var_doc = {}
                var_doc["type"] = item["type"]
                var_doc["documentNumber"] = entity_data[item["documentNumber"]]
                var_doc["downloadURL"] = []
                for item_ins in item["downloadURL"]:
                    for each_item in entity_data[item_ins]:
                        var_doc["downloadURL"].append("file/download/" + OrganisationFile.objects.get(id=each_item["url"].split('/')[-1]).file.file.name)
                for var_doc_item in item["detail"].keys():
                    if item["detail"][var_doc_item] in entity_data:
                        var_doc[var_doc_item] = entity_data[item["detail"][var_doc_item]]
                    else:
                        pass
                document_payload.append(var_doc)

            payload["documents"] = document_payload
            header = {
                "content-type": "application/json",
                "Authorization" : "Bearer " + PLATFORM_INTERNAL_TOKEN
                }

            if instance.bpss_id == None or instance.bpss_id == "":
                reqUrl = PLATFORM_BASE_URL + "/api/employee-mgmt/org/" + str(instance.entity_model.tenant.id) + "/employee"
                response = requests.request("POST", reqUrl, data=json.dumps(payload),  headers=header)
                logger.info(payload)
                logger.info(response.json())
                instance.bpss_id = response.json()["uuid"]
                instance.save()
            else:
                reqUrl = PLATFORM_BASE_URL + "/api/employee-mgmt/org/" + str(instance.entity_model.tenant.id) + "/employee/" + instance.bpss_id
                response = requests.request("PUT", reqUrl, data=json.dumps(payload),  headers=header)
    except Exception as e:
        logger.exception(e)

class CandidateHistoryModel(MyBaseModel):
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=100, choices=CandidateAuditConstants.MODEL_CHOICES, blank=True, null=True)
    owner= models.CharField(max_length=255, null=True)
    candidate = models.ForeignKey(OrganisationEntityMasterData, on_delete=models.CASCADE, blank=False, null=False)
    job_id = models.CharField(default=None, max_length=100, null=True, blank=True)

    class Meta:
        verbose_name = "Candidate Audit Log"
        verbose_name_plural = "Candidate Audit Logs"


@receiver(post_save, sender=OrganisationEntityMasterData, dispatch_uid="audit_candidate_log")
def add_candidate_logs(sender, instance, created, **kwargs):
    if created:
        logger.info("Adding new user created logs.")
        CandidateHistoryModel.objects.create(tenant=instance.entity_model.tenant,
                                             activity_type=CandidateAuditConstants.CANDIDATE_CREATED, owner=instance.entity_data['initiator'], 
                                             candidate=instance)