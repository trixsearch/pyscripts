from django.db import connection, models
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField

from apps.org_location.models import Location
from apps.user.models import User
from apps.app_registry.models import SoftDeleteModel, SoftDeleteManager, MyBaseModel
from apps.organisations.models import Organisation


# Create your models here.


def generate_display_picture_path(self, filename):
    return "{0}/{1}/profile_picture/{2}".format(self.tenant.id, self.id, filename)

def generate_signature_path(self, filename):
    return "{0}/{1}/signature/{2}".format(self.tenant.id, self.id, filename)

class InternalUser(User):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)

    @property
    def representation(self):
        return 'Email: {} Name: {}'.format(self.email, self.first_name)

    class Meta:
        verbose_name = "Internal User"
        verbose_name_plural = "Internal Users"

    def __str__(self):
        return self.representation


class SoftDeleteUserModel(SoftDeleteModel):
    def delete(self,*args,**kwargs):
        if self.is_deleted:
            return
        self.is_deleted=True
        self.is_active=False
        self.deleted_at=timezone.now()
        self.save()

    class Meta:
        abstract = True

class PlatformPolicy(MyBaseModel):
    ORG_CHOICES = (
        ("MY_ORG", "MY_ORG"),
        ("VENDOR_ORG", "VENDOR_ORG"),
        ("CLIENT_ORG", "CLIENT_ORG")
    )
    name = models.CharField(max_length=150)
    policy_id = models.CharField(max_length=150)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    relation = models.CharField(choices=ORG_CHOICES, max_length=256, blank=False, null=False, default="MY_ORG")
    source_tenant = models.ForeignKey(Organisation, null=True, blank=True, on_delete=models.CASCADE, related_name="source_tenant")

    @property
    def representation(self):
        return 'Name: {} Tenant: {}'.format(self.name, self.tenant.name)
    
    def __str__(self):
        return self.representation
    
    def save(self, *args, **kwargs):
        super(PlatformPolicy, self).save(*args, **kwargs)

class OrganisationUser(User,SoftDeleteUserModel):

    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Transgender', 'Transgender')
    )

    default_manager = SoftDeleteManager()
    first_name = models.CharField(max_length=50, blank=False, null=False)
    last_name = models.CharField(max_length=50, blank=False, null=False)
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    manager = models.ForeignKey('self', on_delete=models.PROTECT, blank=True, null=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, blank=True, null=True)
    employee_id = models.CharField(max_length=50, unique=False, blank=True, null=True)
    email_verified = models.BooleanField(default=False, verbose_name='Email Verified')
    display_picture = models.ImageField(upload_to=generate_display_picture_path, blank=True, null=True)
    signature = models.ImageField(upload_to=generate_signature_path, blank=True, null=True)
    gender = models.CharField(choices=GENDER_CHOICES, blank=True, null=True, max_length=12)
    mobile = PhoneNumberField(blank=True, null=True, default=None, verbose_name="Mobile Number")
    extra_fields = models.JSONField(null=True, blank=True, default=dict)
    platform_policy = models.ManyToManyField(PlatformPolicy)

    @property
    def representation(self):
        return 'Email: {} Name: {}'.format(self.email, self.first_name)

    class Meta:
        verbose_name = "Organisation User"
        verbose_name_plural = "Organisation Users"

    def __str__(self):
        return self.representation


class ExternalUser(User):
    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Transgender', 'Transgender')
    )

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    mobile = PhoneNumberField(blank=False, null=False, verbose_name="Mobile Number")
    otp_expiration_time = models.DateTimeField(blank=True, null=True, verbose_name='OTP Key Expiration DateTime')
    gender = models.CharField(choices=GENDER_CHOICES, blank=True, null=True, max_length=12)
    extra_fields = models.JSONField(null=True, blank=True, default=dict)

    @property
    def representation(self):
        return 'Email: {} Name: {} Mobile: {}'.format(self.email, self.first_name, self.mobile)

    class Meta:
        verbose_name = "External User"
        verbose_name_plural = "External Users"

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        if self.extra_fields:
            if isinstance(self.extra_fields, (str)):
                self.extra_fields = eval(self.extra_fields)
        super(ExternalUser, self).save(*args, **kwargs)

class OpenExternalUser(User):
    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Transgender', 'Transgender')
    )

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    mobile = PhoneNumberField(blank=False, null=False, verbose_name="Mobile Number")
    otp_expiration_time = models.DateTimeField(blank=True, null=True, verbose_name='OTP Key Expiration DateTime')
    gender = models.CharField(choices=GENDER_CHOICES, blank=True, null=True, max_length=12)

    @property
    def representation(self):
        return 'Email: {} Name: {} Mobile: {}'.format(self.email, self.first_name, self.mobile)

    class Meta:
        verbose_name = "Open External User"
        verbose_name_plural = "Open External Users"

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        super(OpenExternalUser, self).save(*args, **kwargs)
