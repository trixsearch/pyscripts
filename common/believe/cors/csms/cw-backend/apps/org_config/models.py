from django.db import models, connection
from django.forms import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.postgres.fields import ArrayField

from phonenumber_field.modelfields import PhoneNumberField
from apps.app_registry.models import MyBaseModel, VersionModel
from apps.org_apps.models import OrganisationWorkflow
from apps.org_entity.models import OrganisationEntityMasterModel
from apps.organisations.models import Organisation
from apps.org_jobs.models import HiringState


class SMSTemplate(MyBaseModel):
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    dlt_sender_id = models.CharField(max_length=250, blank=False, null=False)
    template_name = models.CharField(max_length=250, blank=False, null=False)
    default_status = models.OneToOneField(HiringState, blank=True, null=True, on_delete=models.SET_NULL)
    dlt_id = models.CharField(max_length=250, blank=False, null=False)
    template = models.TextField()
    allowed_from_status = models.ManyToManyField(HiringState, related_name="allowed_from_status", default=None, blank=True)

class EmailService(MyBaseModel):

    is_service_active = models.BooleanField(default=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    class Meta:
        abstract = True

class SMTPSettings(EmailService):
    ENCRYPTION_CHOICES = (
        (1, 'TLS'),
        (2, 'SSL'),
    )

    host = models.CharField(max_length=250, blank=False, null=False)
    port = models.IntegerField(default=25, validators=[MinValueValidator(0), MaxValueValidator(9999)])
    encryption = models.IntegerField(choices=ENCRYPTION_CHOICES, default=1)
    email = models.EmailField(unique=True, blank=False, null=False)
    username = models.CharField(max_length=250, blank=False, null=False)
    password = models.CharField(max_length=250, blank=False, null=False)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Email: {}'.format(self.email)

    class Meta:
        verbose_name = "SMTP Setting"
        verbose_name_plural = "SMTP Settings"

    def __str__(self):
        return self.representation


class ReportTemplate(MyBaseModel):
    REPORT_CHOICES = (
        (1, 'DAILY'),
        (2, 'WEEKLY'),
        (3, 'MONTHLY'),
        (4, 'CUSTOM')
    )

    PROCESS_CHOICES = (
        ('ONGOING', 'ONGOING'),
        ('COMPLETED', 'COMPLETED'),
        ('WITHDRAWN', 'WITHDRAWN')
    )

    REPORT_ON_CHOICES = (
        ('PROCESS', 'PROCESS'),
        ('ENTITY', 'ENTITY')
    )

    name = models.CharField(max_length=250, blank=False, null=False)
    description = models.TextField(blank=True, null=True, unique=False)
    apps = models.ForeignKey(OrganisationWorkflow, on_delete=models.PROTECT, blank=True, null=True)
    query = models.JSONField(null=False, default=dict)
    user_filter = ArrayField(models.CharField(max_length=256, blank=True, null=True), blank=True, null=True)
    is_involved = models.BooleanField(default=False)
    process_type = models.CharField(choices=PROCESS_CHOICES, max_length=256, blank=True, null=True)
    selected_fields = models.JSONField(null=False, default=dict)
    prompt_variable = models.BooleanField(default=False)
    report_type = models.IntegerField(choices=REPORT_CHOICES, default=4)
    send_via_email = models.BooleanField(null=False, blank=False, default=True)
    report_on = models.CharField(choices=REPORT_ON_CHOICES, max_length=256, default='PROCESS', null=False, blank=False)
    entity_master_model = models.ForeignKey(OrganisationEntityMasterModel, on_delete=models.PROTECT, blank=True, null=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Report Template"
        verbose_name_plural = "Report Templates"
        permissions = (
             ("download_reporttemplate", "Can download reports of all workflows"),
        )

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        if self.selected_fields:
            if isinstance(self.selected_fields, (str)):
                self.selected_fields = eval(self.selected_fields)
        if self.query:
            if isinstance(self.query, (str)):
                self.query = eval(self.query)
        super(ReportTemplate, self).save(*args, **kwargs)


class DocumentTemplate(VersionModel):
    name = models.CharField(max_length=250, blank=False, null=False)
    key = models.CharField(max_length=250,blank=True, null=True)
    description = models.TextField(blank=True, null=True, unique=False)
    html = models.TextField(blank=True, null=True, unique=False)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Document Template"
        verbose_name_plural = "Document Templates"

    def __str__(self):
        return self.representation


class EmailIdentity(EmailService):
    email = models.EmailField(unique=True, blank=False, null=False)
    display_name = models.TextField(blank=True, null=True, unique=False)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Email: {}'.format(self.email)

    class Meta:
        verbose_name = "Email Identity"
        verbose_name_plural = "Email Identities"


class CustomAttribute(MyBaseModel):
    type = models.TextField(blank=True, null=True)
    custom_attribute = models.JSONField(null=True, blank=True, default=dict)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Type: {}'.format(self.type)
    class Meta:
        verbose_name = "Custom Attribute"
        verbose_name_plural = "Custom Attributes"
        unique_together = (('type', 'tenant'))

    def save(self, *args, **kwargs):
        if self.custom_attribute and isinstance(self.custom_attribute, (str)):
            self.custom_attribute = eval(self.custom_attribute)
        super(CustomAttribute, self).save(*args, **kwargs)
        from .utils import update_custom_attribute
        if self.type:
            update_custom_attribute(self.type, self.custom_attribute['components'], str(self.tenant.id))

class EmailDigest(MyBaseModel):
    to = ArrayField(models.CharField(max_length=256, blank=True, null=True), blank=True, null=True)
    msg = models.CharField(max_length=256,blank=True,null=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

class DashboardView (MyBaseModel):
    name        = models.CharField(default=None, max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True, unique=False)
    grid_data   = models.JSONField(null=True, blank=True,default=list)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    class Meta:
        verbose_name = "DashboardView"
        verbose_name_plural = "DashboardViews"
        unique_together = (('name', 'tenant'))

class JobConfigView (MyBaseModel):
    name        = models.CharField(default=None, max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True, unique=False)
    grid_data   = models.JSONField(null=True, blank=True,default=list)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    class Meta:
        verbose_name = "JobConfigView"
        verbose_name_plural = "JobConfigViews"
        unique_together = (('name', 'tenant'))

class EventConfigView (MyBaseModel):
    name        = models.CharField(default=None, max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True, unique=False)
    grid_data   = models.JSONField(null=True, blank=True,default=list)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    class Meta:
        verbose_name = "EventConfigView"
        verbose_name_plural = "EventConfigViews"
        unique_together = (('name', 'tenant'))

class ChartName(MyBaseModel):
    CHART_NAME = (
        ("HiringStatus", "HiringStatus"),
        ("Source", "Source"),
        ("OpenPosition", "OpenPosition"),
        ("SourcingChannelEfficiency", "SourcingChannelEfficiency"),
        ("TimeToHire", "TimeToHire")
    )
    charts = ArrayField(models.CharField(choices=CHART_NAME, max_length=100), blank=True, null=True, default=list)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        if not self.pk and ChartName.objects.filter(tenant=self.tenant).exists():
            raise ValidationError('There is can be only one ChartName instance')
        return super(ChartName, self).save(*args, **kwargs)
    

class ProcessInstanceCleanupConfig(MyBaseModel):
    batch_size = models.IntegerField(default=100)
    batch_limit = models.IntegerField(default=150000)
    cleanup_after_days = models.IntegerField(default=25)

    def save(self, *args, **kwargs):
        if not self.pk and ProcessInstanceCleanupConfig.objects.exists():
            raise ValidationError(
                "Only one ProcessInstanceCleanupConfig instance is allowed"
            )
        return super().save(*args, **kwargs)

class ProcessInstanceCleanupLog(MyBaseModel):
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(blank=True, null=True)
    total_process_instances = models.IntegerField(default=100)
    status_code = models.IntegerField(default=200)
    failure = models.IntegerField(default=0)
    failure_process_instance = models.JSONField(null=True, blank=True, default=dict)
    failure_text = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Cleanup Log"
        verbose_name_plural = "Cleanup Logs"