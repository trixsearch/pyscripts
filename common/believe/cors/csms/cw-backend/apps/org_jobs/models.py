from datetime import datetime
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import models, connection
from django.forms import ValidationError
from apps.app_registry.models import MyBaseModel, DefaultJobRole
from apps.org_location.models import Location
from apps.org_entity.models import OrganisationEntityMasterData
from apps.organisations.models import Organisation
from apps.org_users.models import OrganisationUser  
from django.db.models import Sum
from django.contrib.postgres.fields import ArrayField


# Create your models here.
def generate_logo_path(self, filename):
    return "{0}/partner-logo/{1}".format(self.tenant.id, self.id)

class Partner(MyBaseModel):
    PARTNER_TYPE = (
        ("Inventory Supplier", "Inventory Supplier"),
        ("Hiring Agency", "Hiring Agency"),
        ("Franchise", "Franchise")
    )
    name = models.CharField(max_length=250, null=False, blank=False)
    partner_type  = models.CharField(choices=PARTNER_TYPE, null=False, blank=False, max_length=100)
    short_name = models.CharField(max_length=250, null=False, blank=False)
    logo = models.ImageField(upload_to=generate_logo_path, blank=True, null=True)
    address = models.CharField(max_length=120, blank=True)
    cin = models.CharField(max_length=100, blank=True)
    pan = models.CharField(max_length=100, blank=True)
    gstn = models.CharField(max_length=100, blank=True)
    vendorId = models.UUIDField(null=True, blank=True)
    spoc_email = models.EmailField(null=True, blank=True)
    active = models.BooleanField(default=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    def __str__(self):
        return '{}'.format(self.name)

    class Meta:
        unique_together = (('name', 'tenant'))

class HiringPartner(Partner):
    PARTNER_TYPE = (
        ("Sourcing", "Sourcing"),
        ("Staffing", "Staffing"),
        ("Sourcing and Staffing", "Sourcing and Staffing")
    )
    partner_subtype  = models.CharField(choices=PARTNER_TYPE, null=False, blank=False,default="Sourcing" ,max_length=100)

class HiringState(MyBaseModel):
    name = models.CharField(blank=False, null=False,max_length=250)
    order = models.IntegerField(blank=True, null=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    def __str__(self):
        return '{}'.format(self.name)
    
    class Meta:
        unique_together = (('name', 'tenant'))


class JobRole(MyBaseModel):
    name = models.CharField(blank=False, null=True,max_length=50)
    platform_role_id = models.CharField(blank=True, null=True,max_length=50)
    default_role = models.ForeignKey(DefaultJobRole, null=True, blank=True, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(blank=True, null=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    def __str__(self):
        return '{}'.format(self.name)

    class Meta:
        verbose_name = "Job Role"
        verbose_name_plural = "Job Roles"
        unique_together = (('name', 'tenant', 'slug'))

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        super(JobRole, self).save(*args, **kwargs)

class JobWorkLocation(MyBaseModel):
    work_location = models.ForeignKey(Location, on_delete=models.SET_NULL, blank=True, null=True)
    total_positions = models.PositiveIntegerField(null=False, blank=False, default=0)
    filled_positions = models.PositiveIntegerField(null=False, blank=False, default=0)

class VendorWorkLocation(MyBaseModel):
    vendor = models.ForeignKey(HiringPartner, on_delete=models.SET_NULL, blank=True, null=True)
    work_location = models.ManyToManyField(Location)
    status = models.CharField(null=True, blank=True ,max_length=100)
    user_id = models.ManyToManyField(OrganisationUser ,blank=True)
    remarks = models.TextField(blank=True, null=True)
    is_notification_sent = models.BooleanField(default=False, null=False, blank=False)
class JobWorkLocality(MyBaseModel):
    locality = models.ForeignKey(Location, on_delete=models.SET_NULL, blank=True, null=True)
    total_positions = models.PositiveIntegerField(null=False, blank=False, default=0)
    filled_positions = models.PositiveIntegerField(null=False, blank=False, default=0)


class Stage(MyBaseModel):
    name = models.CharField(max_length=50)
    associated_to = models.CharField(max_length=50, null=True, blank=True)
    states = models.ManyToManyField(HiringState, blank=True)
    order = models.IntegerField(blank=True, null=True)

class FilterStage(MyBaseModel):
    name = models.CharField(max_length=50)
    associated_to = models.CharField(max_length=50, null=True, blank=True)
    states = models.ManyToManyField(HiringState, blank=True)
    order = models.IntegerField(blank=True, null=True)

class Job(MyBaseModel):
    STATUS = (
        ("Active", "Active"),
        ("Inactive", "Inactive"),
        ("Draft", "Draft"),
        ("Paused", "Paused")
    )

    job_id = models.CharField(max_length=25)
    job_title = models.CharField(blank=True, null=True,max_length=50)
    
    # Basic
    role = models.ForeignKey(JobRole, on_delete=models.PROTECT, null=False, blank=False)
    work_city = models.CharField(max_length=100, null=True)
    target_date_to_finish_hiring = models.DateField(null=True, blank=True)
    expire_at_target_date = models.BooleanField(default=False)
    IsResumeRequired = models.BooleanField(default=False)
    MinSalary = models.IntegerField(null=True, blank=True, default=0)
    MaxSalary = models.IntegerField(null=True, blank=True, default=0)
    salaryPayout = models.CharField(null=True, blank=True, max_length=100)
    status = models.CharField(choices=STATUS, null=False, blank=False, default="Active", max_length=100)

    # Job Details
    jobType = models.CharField(null=True, blank=True, max_length=100)
    shiftDetails = models.CharField(null=True, blank=True, max_length=100)
    workStartTime = models.TimeField(default=None, null=True)
    workEndTime = models.TimeField(default=None, null=True)
    description = models.TextField(blank=True, null=True)
    extra_fields = models.JSONField(null=True, blank=True, default=dict) # (working days, benefits)


    # Candidate Preferences
    candidate_preferences = models.JSONField(null=True, blank=True, default=list)


    # Team
    teams = ArrayField(models.CharField(max_length=100, blank=True, null=True), blank=True, null=True)



    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    job_work_location = models.ManyToManyField(JobWorkLocation, blank=True)
    job_work_locality = models.ManyToManyField(JobWorkLocality)
    vendor_work_location = models.ManyToManyField(VendorWorkLocation, blank=True)
    stage = models.ManyToManyField(Stage)
    filter_stage = models.ManyToManyField(FilterStage)

    @property
    def total_positions(self):
        '''
            fetching total number of openings for all the jobworklocation
            if no jobworklocation is available then None will be there i.e., 0
        '''
        total_positions__sum = self.job_work_locality.aggregate(Sum('total_positions'))['total_positions__sum']
        return total_positions__sum if total_positions__sum else 0

    @property
    def available_positions(self):
        total_positions__sum = self.total_positions
        filled_positions__sum = self.job_work_locality.aggregate(Sum('filled_positions'))['filled_positions__sum']
        filled_positions__sum = filled_positions__sum if filled_positions__sum else 0
        return total_positions__sum - filled_positions__sum
    
    def __str__(self):
        return 'Job Role: {} - Location {} - {}'.format(self.role.name, self.work_city, self.job_id)

    class Meta:
        verbose_name = "Job"
        verbose_name_plural = "Jobs"
        unique_together = (('job_id', 'tenant'))

    def save(self, *args, **kwargs):
        super(Job, self).save(*args, **kwargs)

class HiringEvent(MyBaseModel):
    event_id = models.CharField(max_length=25)
    title = models.CharField(blank=True, null=True,max_length=50)
    description = models.TextField(blank=True, null=True)
    job = models.ManyToManyField(Job, blank=False)
    last_date_to_apply = models.DateTimeField(null=False, blank=False)
    event_start_date = models.DateTimeField(null=False, blank=False)
    event_end_date = models.DateTimeField(null=False, blank=False)
    reporting_date = models.DateField(null=False, blank=False)
    reporting_time = models.TimeField(null=False, blank=False)
    interview_location = models.CharField(blank=False, null=False,max_length=250)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    class Meta:
        verbose_name = "Hiring Event"
        verbose_name_plural = "Hiring Events"
        unique_together = (('event_id', 'tenant'))

class JobCandidate(MyBaseModel):
    SOURCE = (
        ("Sourced", "Sourced"),
        ("Referral", "Referral"),
        ("Walkin", "Walkin")
    )
    candidateId = models.CharField(max_length=25, blank=True)
    applicationId = models.CharField(max_length=25, blank=True)
    job = models.ForeignKey(Job, on_delete=models.PROTECT, null=False, blank=False)
    hiring_event = models.ForeignKey(HiringEvent, on_delete=models.PROTECT, null=True, blank=True)
    candidate = models.ForeignKey(OrganisationEntityMasterData, on_delete=models.PROTECT, null=False, blank=False)
    sourcing_partner = models.ForeignKey(HiringPartner, on_delete=models.PROTECT, null=True, blank=True)
    state = models.ForeignKey(HiringState, on_delete=models.PROTECT, null=True, blank=True)
    source = models.CharField(choices=SOURCE, null=False, blank=False, max_length=100, default="Sourced")
    job_board = models.CharField(null=True, blank=True, max_length=100)
    created_by = models.CharField(null=True, blank=True, max_length=100)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    class Meta:
        verbose_name = "Job Application"
        verbose_name_plural = "Job Applications"
        unique_together = (('applicationId', 'tenant'))
    
class JobCandidateStage(MyBaseModel):
    candidate = models.ForeignKey(JobCandidate, on_delete=models.PROTECT, null=False, blank=False)
    stage_name = models.CharField(max_length=100)
    stage_assignee = models.CharField(max_length=100)
    stage_date = models.DateTimeField(null=False, blank=False)

    class Meta:
        verbose_name = "Job Candidate Stage"
        verbose_name_plural = "Job Candidates Stage"
        unique_together = (('candidate', 'stage_name'))

def get_current_year():
    return datetime.now().year

class HeadCountPlan(MyBaseModel):
    role = models.ForeignKey(JobRole, on_delete=models.CASCADE, null=False, blank=False)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, blank=True, null=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('role', 'location'),)
        verbose_name = "HeadCountPlan"
        verbose_name_plural = "HeadCountPlans"

    def __str__(self):
        return 'Role: {} - Location {}'.format(self.role, self.location)

class HeadCountPlanDetail(MyBaseModel):
    MONTH = (
        ("January", "January"),
        ("February", "February"),
        ("March", "March"),
        ("April", "April"),
        ("May", "May"),
        ("June", "June"),
        ("July", "July"),
        ("August", "August"),
        ("September", "September"),
        ("October", "October"),
        ("November", "November"),
        ("December", "December")
    )
    total_count = models.IntegerField(null=False, blank=False, default=0)
    month = models.CharField(choices=MONTH, null=False, blank=False, max_length=100)
    year = models.IntegerField(null=False, blank=False, default=get_current_year)
    plan = models.ForeignKey(HeadCountPlan, on_delete=models.PROTECT, null=False, blank=False)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)


class Slot(MyBaseModel):
    class ChannelTypes(models.TextChoices):
        audio = 'audio', 'Audio'
        video = 'video', 'Video'
        f2f = 'f2f', 'Face To Face'
        
    date = models.DateField()
    start_time = models.TimeField()
    alloted_slots = models.PositiveIntegerField(default=0)
    booked_slots = models.PositiveIntegerField(default=0)
    allow_overbooking = models.BooleanField(default=False)
    job = models.ForeignKey(Job, on_delete=models.PROTECT)
    interview_location = models.ForeignKey(Location, on_delete=models.PROTECT, null=True, default=None, related_name="interview_location")
    work_location = models.ForeignKey(Location, on_delete=models.PROTECT, null=True, default=None, related_name="work_location")
    spoc = models.ForeignKey(OrganisationUser, on_delete=models.PROTECT, blank=True, null=True)
    channel = models.CharField(choices=ChannelTypes.choices, max_length=100)

    def __str__(self):
        day = self.date.day
        month = self.date.strftime('%b')
        year = self.date.year
        hour = self.start_time.strftime('%I')
        am_or_pm = self.start_time.strftime('%p')
        return f'{day} {month} {year} at {hour} {am_or_pm}'

def get_event_id():
    pass

def get_job_id():
    pass

def get_candidate_id():
    pass