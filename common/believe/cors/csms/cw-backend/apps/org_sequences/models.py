from django.db import models
from apps.app_registry.models import MyBaseModel
from apps.organisations.models import Organisation
# Create your models here.``

class Sequence(MyBaseModel):
    name = models.CharField(max_length=100, blank=False, null=False)
    initial_value = models.PositiveIntegerField(null=True, blank=True)
    prefix = models.TextField(blank=True, null=True)
    suffix = models.TextField(blank=True, null=True)
    last = models.PositiveIntegerField(null=True, blank=True)
    digits_in_sequence_number = models.PositiveIntegerField(null=False, blank=False, default=0)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    
    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Sequence"
        verbose_name_plural = "Sequences"
        unique_together = [['name', 'tenant']]

    def __str__(self):
        return self.representation
