import uuid

from django.core.files.storage import default_storage
from django.db import connection, models
from django.db.models.fields.files import FieldFile

from taggit.managers import TaggableManager
from taggit.models import TaggedItemBase

import jsonfield
from apps.org_users.models import User
from apps.app_registry.models import MyBaseModel, VersionModel
from apps.organisations.models import Organisation
from ezedox.custom_storage import FileStorage
from ezedox.settings import AWS_STORAGE_BUCKET_NAME, FILE_BUCKET, AZURE_CONTAINER
from .utils import TypeExtractionController


def generate_path(self, filename):
    if self.file_path:
        return "{0}/{1}-{2}".format(self.file_path,uuid.uuid4(),filename)
    if self.doc_type == "TASK_RELATED_DOCUMENTS":
        return "employee_documents/{0}-{1}".format(uuid.uuid4(),filename)
    elif self.doc_type == "UPLOADED_DOCUMENTS":
        return "employee_documents/{0}-{1}".format(uuid.uuid4(),filename)
    elif self.doc_type == "GENERATED_DOCUMENTS":
        return "employee_company_documents/{0}-{1}".format(uuid.uuid4(),filename)
    elif self.doc_type == "REPORTS":
        return "employee_documents/{0}-{1}".format(uuid.uuid4(),filename)

def get_default_bucket():
    if FILE_BUCKET == 'S3':
        return AWS_STORAGE_BUCKET_NAME
    else:
        return AZURE_CONTAINER


class OrganisationForm(VersionModel):

    name = models.CharField(max_length=50, blank=False, null=False)
    key = models.CharField(max_length=50, blank=False, null=False)
    description = models.TextField(blank=True, null=True, unique=False)
    keytypepair = models.JSONField(null=True, default=dict)
    content = models.JSONField(null=True, default=dict)
    language_option = jsonfield.JSONField(null=True, blank=True, default=dict)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    is_bulk_supported = models.BooleanField(default=False)

    @property
    def representation(self):
        return 'Name: {} Id: {}'.format(self.name, self.id)

    class Meta:
        verbose_name = "Form"
        verbose_name_plural = "Forms"
        unique_together = (("key", "version", "tenant"),)

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        if self.content:
            if isinstance(self.content, (str)):
                self.content = eval(self.content)
            self.keytypepair = TypeExtractionController(
                self.content).get_structure()
            if isinstance(self.language_option, (str)):
                self.language_option = eval(self.language_option)
        super(OrganisationForm, self).save(*args, **kwargs)


class Transaction(MyBaseModel):
    process_instance_id = models.UUIDField(default=None, editable=True, null=True, blank=True, db_index=True)
    data = models.JSONField(null=True, default=dict)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)    

    @property
    def representation(self):
        return 'Transaction: {}'.format(self.id)

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"

    def __str__(self):
        return self.representation

class TaggedFile(TaggedItemBase):
    content_object = models.ForeignKey('OrganisationFile', on_delete=models.SET_NULL, blank=True, null=True)

class DynamicStorageFieldFile(FieldFile):

    def __init__(self, instance, field, name):
        super(DynamicStorageFieldFile, self).__init__(instance, field, name)
        if instance.aws_bucket:
            self.storage = FileStorage(instance.aws_bucket)
        else:
            self.storage = default_storage


class DynamicStorageFileField(models.FileField):
    attr_class = DynamicStorageFieldFile

    def pre_save(self, model_instance, add):
        if model_instance.aws_bucket:
            storage = FileStorage(model_instance.aws_bucket)
        else:
            storage = default_storage
        self.storage = storage
        model_instance.file.storage = storage
        file = super(DynamicStorageFileField, self).pre_save(model_instance, add)
        return file

class OrganisationFile(MyBaseModel):

    TYPE_CHOICES = (
        ("TASK_RELATED_DOCUMENTS", "TASK RELATED DOCUMENTS"),
        ("UPLOADED_DOCUMENTS", "UPLOADED DOCUMENTS"),
        ("GENERATED_DOCUMENTS", "GENERATED DOCUMENTS"),
        ("REPORTS", "REPORTS")
    )

    name = models.CharField(max_length=100, blank=False, null=False)
    file = DynamicStorageFileField(upload_to=generate_path, max_length=2048)
    content_type = models.CharField(max_length=100, null=False, blank=False)
    file_label = models.CharField(max_length=100, null=True, blank=True)
    doc_type = models.CharField(choices=TYPE_CHOICES, max_length=100, blank=True, null=True)
    slug = models.SlugField(blank=True,max_length=100, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    process_instance_id = models.UUIDField(editable=True, null=True, blank=True)
    entity_id = models.UUIDField(editable=True, null=True, blank=True)
    transaction_id = models.ForeignKey(Transaction, default=None, on_delete= models.PROTECT, null=True, blank=True)
    tags = TaggableManager(through=TaggedFile)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)
    aws_bucket = models.CharField(max_length=64, blank=False, null=False, default=get_default_bucket())
    file_path = models.CharField(max_length=2048, blank=True, null=True)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "File"
        verbose_name_plural = "Files"

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        super(OrganisationFile, self).save(*args, **kwargs)
