from import_export import resources
from import_export.fields import Field
from django.forms import ValidationError
from django.contrib.auth.models import Group
from apps.org_users.models import OrganisationUser
from .models import Location

class LocationResource(resources.ModelResource):
    
    class Meta:
        model = Location
        import_id_fields = ('name', 'tenant')
