from django.db import models
# from apps.org_users.models import OrganisationUser
from apps.app_registry.models import MyBaseModel
from utils.custom_function import strip_keys
from apps.organisations.models import Organisation

class Department(MyBaseModel):
    name = models.CharField(max_length=50, blank=False, null=False)
    slug = models.SlugField(blank=True, null=True)
    extra_fields = models.JSONField(null=True, blank=True, default=dict)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        unique_together = [['name', 'tenant'], ['slug', 'tenant']]

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        self.extra_fields = strip_keys(self.extra_fields)
        super(Department, self).save(*args, **kwargs)


class DepartmentDetail(models.Model):

    department = models.OneToOneField(
        Department,
        on_delete=models.PROTECT,
        to_field='id',
        blank=False,
        null=False,
        primary_key=True)

    head = models.ForeignKey(
        # OrganisationUser,
        "org_users.OrganisationUser",
        on_delete=models.PROTECT,
        blank=False,
        null=False)

    @property
    def representation(self):
        return 'Name: {} Head: {}'.format(self.department.name, self.head.employee_id)

    class Meta:
        verbose_name = "Department Detail"
        verbose_name_plural = "Department Details"

    def __str__(self):
        return self.representation
