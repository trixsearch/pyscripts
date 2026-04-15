from django.db import models
from django.contrib.auth.models import Permission
from django.utils.translation import gettext_lazy as _
from apps.app_registry.models import MyBaseModel

class License(MyBaseModel):
    name = models.CharField(max_length=50)
    transactions = models.IntegerField(blank=False, null=False, verbose_name="Maximum number of transactions" )
    permissions = models.ManyToManyField(Permission, verbose_name=_('permissions'), blank=True,)
    slug = models.SlugField(unique=True, blank=True, null=True)

    @property
    def representation(self):
        return 'Name: {} Transactions: {}'.format(self.name, self.transactions)

    class Meta:
        verbose_name = "License"
        verbose_name_plural = "Licenses"

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        super(License, self).save(*args, **kwargs)
