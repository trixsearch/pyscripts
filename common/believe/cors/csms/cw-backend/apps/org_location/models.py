import imp
from django.db import models
import uuid
# from apps.org_users.models import OrganisationUser
from django.core.validators import RegexValidator
from apps.app_registry.models import MyBaseModel
from apps.organisations.models import Organisation
from utils.custom_function import strip_keys
from .options_module import *

alphanumeric = RegexValidator(r'^[a-zA-Z]+[,0-9a-zA-Z_\-\s]*[0-9a-zA-Z]$', 'Special Characters are not allowed except Comma, Underscore, Hyphen and the name can not start and end with any special character or space.')
class Location(MyBaseModel):
    name = models.CharField(max_length=50, blank=False, null=False, validators=[alphanumeric])
    city = models.CharField(max_length=50, blank=True, validators=[alphanumeric])
    address = models.CharField(max_length=200, blank=True)
    country = models.CharField(max_length=50, blank=True, null=False, choices=COUNTRY_OPTIONS)
    state = models.CharField(max_length=50, blank=True, choices=STATE_OPTIONS)
    type = models.CharField(max_length=50, blank=True, null=False, choices=TYPE_OPTIONS)
    latitude = models.DecimalField(blank=True,max_digits=9, decimal_places=6, null=True)
    longitude = models.DecimalField(blank=True,max_digits=9, decimal_places=6, null=True)
    locality = models.CharField(max_length=200, blank=True)
    slug = models.SlugField(blank=True, null=True)
    extra_fields = models.JSONField(null=True, blank=True, default=dict)
    platform_id = models.UUIDField( default = uuid.uuid4, editable = True, null=True, blank=False)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Location"
        verbose_name_plural = "Locations"
        unique_together = [['name', 'tenant'], ['slug', 'tenant']]

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        self.extra_fields = strip_keys(self.extra_fields)
        super(Location, self).save(*args, **kwargs)
