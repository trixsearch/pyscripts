from django.db import models
from django.contrib.postgres.indexes import GinIndex
from apps.app_registry.models import MyBaseModel
from .utils import strip_list_data
from apps.organisations.models import Organisation

# Create your models here.
class OrganisationLists(MyBaseModel):
    name = models.CharField(max_length=100, blank=False, null=False)
    key = models.SlugField(blank=False, null=False)
    list = models.JSONField(null=True,  blank=True, default=dict)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'List Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Organisation List"
        verbose_name_plural = "Organisation Lists"
        indexes = [GinIndex(fields=['list'])]
        unique_together = [['key', 'tenant'],]

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        if self.list and isinstance(self.list, (str)):
            self.list = eval(self.list)
        self.list = strip_list_data(self.list)
        super(OrganisationLists, self).save(*args, **kwargs)

class OrganisationAdvancedLists(MyBaseModel):
    name = models.CharField(max_length=100, blank=False, null=False)
    key = models.SlugField(blank=False, null=False)
    lists = models.JSONField(null=True,  blank=True, default=dict)
    schema = models.JSONField(null=True,  blank=True, default=dict)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    
    @property
    def representation(self):
        return 'Advanced List Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Organisation Advanced List"
        verbose_name_plural = "Organisation Advanced Lists"
        indexes = [GinIndex(fields=['lists'])]
        unique_together = [['key', 'tenant'],]

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        if self.lists and isinstance(self.lists, (str)):
            self.lists = eval(self.lists)
        if self.schema and isinstance(self.schema, (str)):
            self.schema = eval(self.schema)
        self.lists = strip_list_data(self.lists)
        self.schema = strip_list_data(self.schema)
        super(OrganisationAdvancedLists, self).save(*args, **kwargs)
