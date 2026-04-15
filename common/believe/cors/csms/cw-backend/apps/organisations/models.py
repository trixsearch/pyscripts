import imp
import os
import uuid

from phonenumber_field.modelfields import PhoneNumberField

from datetime import datetime, timedelta
from croniter import croniter
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.core.files.images import get_image_dimensions
from django.db import connection, models
from colorful.fields import RGBColorField
from rest_framework import status
from apps.app_registry.models import MyBaseModel, VersionModel
from ezedox.settings import PLATFORM_INTERNAL_TOKEN, PLATFORM_BASE_URL, SSL_VERIFICATION

from django.db.models.signals import post_save
from django.dispatch import receiver
import requests

def generate_logo_path(self, filename):
    obj_filename, obj_file_extension = os.path.splitext(filename)
    obj_name = str(uuid.uuid4()) + str(obj_file_extension)
    return "{0}/org-logo/{1}".format(self.id, obj_name)


class Organisation(MyBaseModel):
    BUTTON_TEXT_CHOICES = (
        ('BLACK', 'BLACK'),
        ('WHITE', 'WHITE'),
    )

    def validate_image_192(file_obj):
        w, h = get_image_dimensions(file_obj)

        if h != 192:
            raise ValidationError("Height should be 192 pixels. Your image height is {0} pixels".format(
                h), status.HTTP_400_BAD_REQUEST)
        if w != 192:
            raise ValidationError("Width should be 192 pixels. Your image width is {0} pixels".format(
                w), status.HTTP_400_BAD_REQUEST)

    def validate_image_512(file_obj):
        w, h = get_image_dimensions(file_obj)

        if h != 512:
            raise ValidationError("Height should be 512 pixels. Your image height is {0} pixels".format(
                h), status.HTTP_400_BAD_REQUEST)
        if w != 512:
            raise ValidationError("Width should be 512 pixels. Your image width is {0} pixels".format(
                w), status.HTTP_400_BAD_REQUEST)
    
    id = models.UUIDField(primary_key=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    short_name = models.CharField(max_length=25, null=True, blank=True)
    logo = models.ImageField(upload_to=generate_logo_path, blank=True, null=True)
    icon_512_size = models.ImageField(upload_to=generate_logo_path, blank=True, null=True, validators=[validate_image_512])
    icon_192_size = models.ImageField(upload_to=generate_logo_path, blank=True, null=True, validators=[validate_image_192])
    show_org_name = models.BooleanField(default=False)
    assets_opacity = models.PositiveIntegerField(default=45, validators=[MinValueValidator(1), MaxValueValidator(100)])
    first_primary_color = RGBColorField(default='#0c60ae')
    second_primary_color = RGBColorField(default='#7df0ba')
    first_button_color = RGBColorField(default='#66aef1')
    second_button_color = RGBColorField(default='#267acc')
    icon_color = RGBColorField(default='#31a18a')
    button_text_color = models.CharField(choices=BUTTON_TEXT_CHOICES, default='WHITE', max_length=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    support_notification = models.BooleanField(default=True)
    description = models.CharField(max_length=255, blank=True)
    org_address = models.CharField(max_length=120, blank=True)
    cin = models.CharField(max_length=100, blank=True)
    pan = models.CharField(max_length=100, blank=True)
    gstn = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "Organisation"
        verbose_name_plural = "Organisations"

    # def __str__(self):
    #     return self.name


class OrganisationLicense(MyBaseModel):
    DUE_TODAY_AND_OVERDUE='DUE_TODAY_AND_OVERDUE'
    ALL_TASKS='ALL_TASKS'
    EMAILER_CHOICES = (
        (ALL_TASKS, ALL_TASKS),
        (DUE_TODAY_AND_OVERDUE, DUE_TODAY_AND_OVERDUE),
    )

    license = models.ForeignKey("license.License", on_delete=models.PROTECT, blank=False, null=False)
    organisation = models.OneToOneField(Organisation, on_delete=models.CASCADE, blank=False, null=False)
    is_active = models.BooleanField(default=True)
    processengine = models.CharField(max_length=100, null=True, blank=True)
    processengine_read_replica = models.CharField(max_length=100, null=True, blank=True, default=None)
    process_modeler = models.CharField(max_length=100, null=True, blank=True)
    process_idm = models.CharField(max_length=100, null=True, blank=True)
    groups_allowed = models.IntegerField(default=30)
    emailer_type = models.CharField(max_length=32, choices=EMAILER_CHOICES, default=None, null=True, blank=True)
    default_package = models.BooleanField(default=False)
    show_completed_tasks = models.BooleanField(default=False)
    task_view_columns = models.JSONField(null=True, blank=True, default=dict)

    class Meta:
        verbose_name = "Organisation License"
        verbose_name_plural = "Organisations License"
        permissions = (
            ('theme_organisationlicense','Can view and change theme of organisation'),
            ('dynamicdashboard_organisationlicense','dynamic dashboard permission'),
            ('master_organisationlicense','Can view masterrecord of organisation'),
            ('bulkprocess_organisationlicense','Can do bulk process of organisation'),
        )

    # def __str__(self):
    #     return self.name

class ScheduledReport(MyBaseModel):

    last_run_at         = models.DateTimeField(null=True, blank=True)
    next_run_at         = models.DateTimeField(null=True, blank=True)
    cron_expression     = models.CharField(max_length=200)
    stop_scheduling     = models.BooleanField(default=False)
    start_date          = models.DateTimeField(blank=True,null=True)
    end_date            = models.DateTimeField(blank=True,null=True)
    tenant_name         = models.CharField(max_length=200)
    report_template_id  = models.UUIDField(default=None, null=True, blank=True)
    report_recipients   = models.TextField(blank=True, null=True, unique=False)
    recipients_group    = models.TextField(blank=True,null=True, unique=False)
    timezone_offset     = models.IntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.last_run_at = timezone.now()
        delta = timedelta(minutes=self.timezone_offset)
        curr_local_time = self.last_run_at - delta
        iter = croniter(self.cron_expression, curr_local_time)
        self.next_run_at = iter.get_next(datetime) + delta
        super(ScheduledReport, self).save(*args, **kwargs)

    class Meta:
        verbose_name = "Scheduled Report"
        verbose_name_plural = "Scheduled Reports"

class Domain():
    pass


class OrganisationSMS(MyBaseModel):

    DELIVERY_STATUS_CHOICES = (
        ('REJECTED', 'REJECTED'),
        ('DELIVERED', 'DELIVERED'),
        ('SUCCESS', 'SUCCESS'),
        ('STATUS_AWAITING','STATUS_AWAITING')
    )

    sms_body = models.TextField(blank=False, null=False, max_length=100,default=None)
    mobile = PhoneNumberField(blank=False, null=False, default=None, verbose_name="Mobile Number")
    process_instance_id = models.UUIDField(editable=True, null=False, blank=False)
    entity_id = models.UUIDField(editable=True, null=True, blank=True)
    date_sent = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    partner_request_id = models.CharField(blank=True, null=True,max_length=50)
    delivery_status = models.CharField(choices=DELIVERY_STATUS_CHOICES ,blank=True,null=True, max_length=50)
    dlt_id = models.CharField(blank=True,null=True, max_length=50)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Mobile Number: {}'.format(self.mobile)
    class Meta:

        verbose_name = "Organisation SMS"


@receiver(post_save, sender=Organisation)
def get_org_details(sender, instance=None, created=False, **kwargs):
    if created:
        url = PLATFORM_BASE_URL + '/api/customer-mgmt/org/' + str(instance.id)
        headers = {
            "content-type" : "application/json",
            "Authorization" : "Bearer " + PLATFORM_INTERNAL_TOKEN
        }
        response = requests.request("GET", url, headers=headers, verify=SSL_VERIFICATION)
        if response.status_code == 200:
            instance.name = response.json()["name"]
            instance.save()
