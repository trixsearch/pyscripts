from import_export import resources
from .models import OrganisationLists, OrganisationAdvancedLists

class ListResource(resources.ModelResource):
    class Meta:
        model = OrganisationLists
        exclude = ('id', 'created_at')
        import_id_fields = ('key', )


class AdvancedListResource(resources.ModelResource):
    class Meta:
        model = OrganisationAdvancedLists
        exclude = ('id', 'created_at')
        import_id_fields = ('key', )
