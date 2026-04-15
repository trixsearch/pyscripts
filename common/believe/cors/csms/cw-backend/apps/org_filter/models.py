from django.db import models
from apps.org_users.models import OrganisationUser
from apps.organisations.models import Organisation
from apps.app_registry.models import MyBaseModel

# Create your models here.
class OrganisationFilter(MyBaseModel):

    createdOn = models.DateTimeField(null=True, blank=True, default= None)
    createdBefore = models.DateTimeField(null=True, blank=True, default= None)
    createdAfter = models.DateTimeField(null=True, blank=True, default= None)
    dueOn = models.DateTimeField(null=True, blank=True, default= None)
    dueBefore = models.DateTimeField(null=True, blank=True, default= None)
    dueAfter = models.DateTimeField(null=True, blank=True, default= None)
    nameLike = models.CharField(max_length=250, blank=True, null=True, unique=False, default= None)
    user =  models.ForeignKey(OrganisationUser,on_delete=models.PROTECT, null=True, blank=True, default= None)
    processDefinitionKey = models.CharField(max_length=50, blank=True, null=True, unique=False, default= None)
    processStateFilter = models.CharField(max_length=100, blank=True, null=True, unique=False, default= None)
    filter_query  = models.JSONField(null=True,  blank=True, default=dict)
    active_filter = models.BooleanField(default=False)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)


    @property
    def representation(self):
        return '{}'.format(self.user)

    class Meta:
        unique_together = (('processDefinitionKey', 'user', 'tenant'),)
        verbose_name = "Organisation Filter"
        verbose_name_plural = "Organisation Filters"

    def __str__(self):
        return self.representation
