from django.db import models, connection

from apps.app_registry.models import MyBaseModel
from apps.org_users.models import OrganisationUser
from apps.organisations.models import Organisation
from ezedox.custom_storage import FileStorage


def generate_path(self, filename):
    return "{0}/entity_import/{1}/{2}".format(self.tenant.id, self.transaction_id, filename)

class EntityImport(MyBaseModel):

    STATUS_CHOICES  = (
        ('IN_PROGRESS', 'IN_PROGRESS'),
        ('COMPLETED', 'COMPLETED'),
        ('ERROR', 'ERROR')
    )

    transaction_id  = models.UUIDField(editable=True, null=False, blank=False, unique=True)
    result          = models.JSONField(null=True, default=dict)
    started_at      = models.DateTimeField(blank=True,null=True)
    completed_at    = models.DateTimeField(blank=True,null=True)
    status          = models.CharField(choices=STATUS_CHOICES , max_length=100, blank=True, null=True)
    entity_type     = models.CharField(max_length=100, blank=True,null=True)
    user            = models.ForeignKey(OrganisationUser, on_delete=models.PROTECT, null=True, blank=True, default= None)
    file            = models.FileField(storage=FileStorage(),upload_to=generate_path, max_length=356, null=True, blank=True)
    tenant          = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
