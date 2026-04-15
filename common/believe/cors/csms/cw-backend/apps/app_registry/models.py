import uuid
from django.db import models
from django.db import connection
from ezedox.custom_storage import OtherFileStorage
from django.db.models.query import QuerySet

# Create your models here.

class MyBaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        abstract = True


class VersionModel(MyBaseModel):
    version = models.IntegerField(default=1)

    class Meta:
        abstract = True

class SoftDeleteQuerySet(QuerySet):
    def __init__(self,*args,**kwargs):
        return super(self.__class__, self).__init__(*args, **kwargs)

    def delete(self,*args,**kwargs):
        for obj in self: obj.delete()

class SoftDeleteManager(models.Manager):
    """ Use this manager to get objects that have a is_deleted field """
    def get_queryset(self,*args,**kwargs):
        return SoftDeleteQuerySet(model=self.model, using=self._db, hints=self._hints).filter(is_deleted=False).filter(*args, **kwargs)

    def all_with_deleted(self,*args,**kwargs):
        return SoftDeleteQuerySet(model=self.model, using=self._db, hints=self._hints).filter(*args, **kwargs)

    def deleted_set(self,*args,**kwargs):
        return SoftDeleteQuerySet(model=self.model, using=self._db, hints=self._hints).filter(is_deleted=True).filter(*args, **kwargs)

    def get(self, *args, **kwargs):
        """ if a specific record was requested, return it even if it's deleted """
        return self.all_with_deleted().get(*args, **kwargs)

    def filter(self, *args, **kwargs):
        """ if pk was specified as a kwarg, return even if it's deleted """
        if 'pk' in kwargs:
            return self.all_with_deleted().filter(*args, **kwargs)
        return self.get_queryset().filter(*args, **kwargs)

class SoftDeleteModel(MyBaseModel):
    objects=SoftDeleteManager()
    is_deleted   = models.BooleanField(default=False, verbose_name="Is Deleted")
    deleted_at = models.DateTimeField(null=True, blank=True)

    def delete(self,*args,**kwargs):
        if self.is_deleted : return
        self.is_deleted=True
        self.deleted_at=timezone.now()
        self.save()

    def erase(self,*args,**kwargs):
        """
        Actually delete from database.
        """
        super(SoftDeleteModel,self).delete(*args,**kwargs)

    def restore(self,*args,**kwargs):
        if not self.is_deleted: return
        self.is_deleted=False
        self.deleted_at = ""
        self.save()

    class Meta:
        abstract = True

class OrderModel(MyBaseModel):
    order_id = models.IntegerField(default=1)

    class Meta:
        abstract = True

def generate_path2(self, filename):
    return "{0}/deployment_artifacts/{1}".format("public", filename)

class DeploymentArtifacts(MyBaseModel):
    TYPE = (
        ("Forms", "Forms"),
        ("Workflow", "Workflow"),
        ("DocumentTemplate", "DocumentTemplate"),
        ("Location", "Location"),
        ("Department", "Department"),
        ("OrganisationEntityMasterModel", "OrganisationEntityMasterModel"),
        ("Groups", "Groups"),
        ("List", "List"),
        ("AdvancedList", "AdvancedList"),
        ("Sequence", "Sequence"),
        ("HiringState", "HiringState"),
        ("App", "App"),
        ("ReportTemplate", "ReportTemplate"),
        ("CustomAttribute", "CustomAttribute"),
        ("EntityView", "EntityView"),
        ("ProcessView", "ProcessView"),
        ("ChartName", "ChartName")
    )
    name = models.CharField(max_length=200, unique=True)
    type = models.CharField(choices=TYPE, null=False, blank=False, max_length=100)
    file = models.FileField(storage=OtherFileStorage(), upload_to=generate_path2, max_length=356)
    
    @property
    def representation(self):
        return 'Name: {}'.format(self.name)
    
    def __str__(self):
        return self.representation

class DeploymentPackage(MyBaseModel):
    name = models.CharField(max_length=200, unique=True)
    artifacts = models.ManyToManyField(DeploymentArtifacts, blank=False)
    license = models.ForeignKey("license.License", on_delete=models.PROTECT, blank=True, null=True)

def generate_path3(self, filename):
    return "{0}/deployment_files/{1}".format("public", filename)

class DeploymentFiles(MyBaseModel):
    name = models.CharField(max_length=200, unique=True)
    file_key = models.CharField(max_length=200)
    deploy_file = models.FileField(storage=OtherFileStorage(), upload_to=generate_path3, max_length=356)

class DefaultJobRole(MyBaseModel):
    name = models.CharField(blank=False, null=False,max_length=50)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(blank=True, null=True)

    def __str__(self):
        return '{}'.format(self.name)

    class Meta:
        verbose_name = "Default Job Role"
        verbose_name_plural = "Default Job Roles"
        unique_together = (('name', 'slug'))

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        super(DefaultJobRole, self).save(*args, **kwargs)