# Create your models here.
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.contrib.auth.models import Group
from apps.org_form.models import OrganisationForm
from apps.org_portals.models import Portals
from apps.app_registry.models import MyBaseModel, OrderModel
from apps.organisations.models import Organisation
from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models.fields.files import FieldFile
from django.core.exceptions import ValidationError


class DynamicStorageFieldFile(FieldFile):

    def __init__(self, instance, field, name):
        super(DynamicStorageFieldFile, self).__init__(instance, field, name)
        self.storage = default_storage


class DynamicStorageFileField(models.FileField):
    attr_class = DynamicStorageFieldFile

    def pre_save(self, model_instance, add):
        storage = default_storage
        self.storage = storage
        model_instance.bulk_sample_url.storage = storage
        file = super(DynamicStorageFileField, self).pre_save(model_instance, add)
        return file

def generate_path(self, filename):
    return "files/{0}/{1}/bulk_sample".format(self.tenant.id, self.id)


def config_default_value():
    return {"entity_phone_number": "Phone Number", "entity_name": " Name"}

ENTITY = (
        ("Employee", "Employee"),
        ("User", "User"),
        ("Vendor", "Vendor"),
        ("Tag", "Tag"),
    )

class OrganisationWorkflow(OrderModel):
    app_key = models.CharField(max_length=100, db_index=True)
    is_open = models.BooleanField(default=False)
    is_process_initiable_from_app_context = models.BooleanField(default=False)
    is_admin_initiable = models.BooleanField(default=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=False, null=False, default="This is an organisation workflow.")
    icon_class = models.CharField(max_length=100, blank=True, null=True)
    process_key = models.CharField(max_length=100, blank=False, null=False)
    forms = models.ManyToManyField(OrganisationForm, blank=True)
    open_forms = models.ForeignKey(OrganisationForm, blank=True, null=True, on_delete=models.PROTECT, related_name="open_forms")
    portal = models.ForeignKey(Portals, on_delete=models.PROTECT, blank=True, null=True)
    selected_form_fields = models.JSONField(null=True,  blank=True, default=dict)
    selected_forms = models.JSONField(null=True,  blank=True, default=dict)
    bulk_sample_url = DynamicStorageFileField(upload_to=generate_path, max_length=256, null=True, blank=True)
    is_global = models.BooleanField(default=True)
    bulk_support = models.BooleanField(default=False)
    process_state_list = ArrayField(models.CharField(max_length=100), blank=True, null=True, default=list)
    process_search_list = models.JSONField(null=True, blank=True, default=config_default_value)
    entity = models.CharField(choices=ENTITY, null=True, blank=True, max_length=100, default="Employee")
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    kafka_topic = models.CharField(max_length=100, blank=True, null=True)
    kafka_domain_name = models.CharField(max_length=100, blank=True, null=True)
    kafka_topic_action = models.CharField(max_length=100, blank=True, null=True)
    process_view_column = models.JSONField(null=True,  blank=True, default=dict)
    task_view_column = models.JSONField(null=True,  blank=True, default=dict)
    filters = models.JSONField(null=True, blank=True, default=dict)
    custom_default_filter = models.JSONField(null=True, blank=True, default=dict)
    process_name = models.CharField(max_length=100,null=True, blank=True)

    @property
    def representation(self):
        return 'Workflow ID: {} Tenant : {}'.format(self.app_key, self.tenant.id)

    class Meta:
        verbose_name = "Organisation Workflow"
        verbose_name_plural = "Organisation Workflows"
        unique_together = (('app_key', 'process_key', 'tenant'))

    def __str__(self):
        return self.representation

    def open_form_link(self):
        url = "{0}://{1}/{2}/{3}/{4}/{5}".format(settings.DEFAULT_SCHEME, settings.CANDIDATE_DOMAIN_URL, "org", 
        str(self.tenant.id), "forms", str(self.open_forms.id))
        return url

    def save(self, *args, **kwargs):
        if self.process_search_list:
            if isinstance(self.process_search_list, (str)):
                self.process_search_list = eval(self.process_search_list)
        super(OrganisationWorkflow, self).save(*args, **kwargs)


class ProcessView(MyBaseModel):
    app = models.ForeignKey(OrganisationWorkflow, on_delete=models.PROTECT, related_name='role_view')
    role = models.ForeignKey(Group, on_delete=models.PROTECT, blank=True)
    selected_form_fields = models.JSONField(null=True,  blank=True, default=list)
    selected_forms = models.JSONField(null=True,  blank=True, default=list)

    class Meta:
        unique_together = (('app', 'role'),)
        verbose_name = "Process View"
        verbose_name_plural = "Process Views"

    def save(self, *args, **kwargs):
        if self.selected_form_fields:
            if isinstance(self.selected_form_fields, (str)):
                self.selected_form_fields = eval(self.selected_form_fields)
        if self.selected_forms:
            if isinstance(self.selected_forms, (str)):
                self.selected_forms = eval(self.selected_forms)
        super(ProcessView, self).save(*args, **kwargs)

class WorkflowAccess(MyBaseModel):
    app = models.ForeignKey(OrganisationWorkflow, on_delete=models.PROTECT)
    view = models.BooleanField(default=False)
    reassign = models.BooleanField(default=False)
    withdraw = models.BooleanField(default=False)
    bulk_initiate = models.BooleanField(default=False)
    initiate = models.BooleanField(default=False)
    upload = models.BooleanField(default=False)
    filter_on_task = models.BooleanField(default=False)
    policy = models.ForeignKey("org_users.PlatformPolicy", on_delete=models.PROTECT, blank=True)
    
    def save(self, *args, **kwargs):
        super(WorkflowAccess, self).save(*args, **kwargs)
    class Meta:
        unique_together = (('app', 'policy'),)
        verbose_name = "Workflow Access"
        verbose_name_plural = "Workflow Access"

class ProcessVarSync(MyBaseModel):
    app = models.ForeignKey(OrganisationWorkflow, on_delete=models.PROTECT, null=True, blank=True)
    entity = models.CharField(choices=ENTITY, null=True, blank=True, max_length=100, default="Active")
    tenant = models.ForeignKey(Organisation, null=True, blank=True, on_delete=models.CASCADE)
    kafka_topic = models.CharField(max_length=100, blank=True, null=True)
    kafka_domain_name = models.CharField(max_length=100, blank=True, null=True)
    kafka_topic_action = models.CharField(max_length=100, blank=True, null=True)
    mapping = models.JSONField(null=True,  blank=True, default=dict)
    source = models.CharField(max_length=100, blank=False, null=False, default="KAFKA_DATA") # KAFKA_DATA / GET_API_CALL

    def clean(self):
        if not self.app and (not self.entity or not self.tenant):
            raise ValidationError("Either 'Workflow' or both 'Entity' and 'Tenant' must be provided.")