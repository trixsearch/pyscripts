from django.db import models
from apps.app_registry.models import MyBaseModel
from apps.organisations.models import Organisation

class UrlShortner(MyBaseModel):
    short_url = models.CharField(max_length=10, blank=False, null=False, unique=True)
    long_url = models.CharField(max_length=2048, blank=False, null=False)
    expiration = models.DateTimeField(null=True, blank=True)

    @property
    def representation(self):
        return 'Short Url: {}'.format(self.short_url)

    class Meta:
        verbose_name = "Short Url"
        verbose_name_plural = "Short Urls"

    def __str__(self):
        return self.representation
