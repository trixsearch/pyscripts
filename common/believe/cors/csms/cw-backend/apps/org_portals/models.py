from django.db import models
from apps.app_registry.models import MyBaseModel
from apps.organisations.models import Organisation

class Portals(MyBaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(blank=False, null=False)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Portal"
        verbose_name_plural = "Portals"

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        super(Portals, self).save(*args, **kwargs)


class Content(MyBaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    content = models.BinaryField(editable=True, blank=True, null=True)
    slug = models.SlugField(blank=False, null=False)
    tenant = models.ForeignKey(Organisation, null=False, blank=False, on_delete=models.CASCADE)

    @property
    def representation(self):
        return 'Name: {}'.format(self.name)

    class Meta:
        verbose_name = "Content"
        verbose_name_plural = "Contents"

    def __str__(self):
        return self.representation

    def save(self, *args, **kwargs):
        self.slug = self.name.lower().strip().replace(" ", "_")
        super(Content, self).save(*args, **kwargs)


class PortalContentOrder(MyBaseModel):
    portal = models.ForeignKey(Portals, on_delete=models.PROTECT, blank=False, null=False)
    content = models.ForeignKey(Content,on_delete=models.PROTECT,blank=False,null=False)
    order = models.IntegerField()

    @property
    def representation(self):
        return 'Portal: {}  Content: {}  Order:{}'.format(self.portal, self.content, self.order)

    class Meta:
        verbose_name = "PortalContentOrder"
        verbose_name_plural = "PortalContentOrder"
        unique_together = (("portal", "content"), ("portal", "order"))

    def __str__(self):
        return self.representation
