from import_export import resources
from .models import OrganisationForm

class FormResource(resources.ModelResource):
    class Meta:
        model = OrganisationForm
        exclude = ('id', 'created_at')
        import_id_fields = ('key', 'version', 'tenant')
