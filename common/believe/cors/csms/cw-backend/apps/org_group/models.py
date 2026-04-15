from django.db import models
from django.core.validators import RegexValidator
from apps.app_registry.models import MyBaseModel
from apps.org_users.models import OrganisationUser
from apps.organisations.models import Organisation

alphanumeric = RegexValidator(r'^[a-zA-Z]+[,0-9a-zA-Z_\-\s]*[0-9a-zA-Z]$', 'Special Characters are not allowed except Comma, Underscore, Hyphen and the name can not start and end with any special character or space.')
class OrganisationGroup(MyBaseModel):
    name = models.CharField(max_length=120, blank=False, null=False, validators=[alphanumeric])
    users = models.ManyToManyField(OrganisationUser, blank=False)
    slug = models.SlugField(max_length=120, blank=True, null=True)
    filter_by = models.CharField(max_length=50, blank=True, null=True)
    key = models.CharField(max_length=120, blank=True, null=True, db_index=True)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Organisation Group"
        verbose_name_plural = "Organisation Groups"
        unique_together = [['name', 'key', 'tenant']]

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        if self.key is None:
            self.key = self.slug
        super(OrganisationGroup, self).save(*args, **kwargs)
        