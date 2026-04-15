from import_export import resources
from .models import OrganisationEntityMasterModel, OrganisationEntityView

class OrganisationEntityMasterModelResource(resources.ModelResource):

    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "entity_forms":
                return [str(val.key + "::" + str(val.version)) for val in obj.entity_forms.all()]
            return field.export(obj)
        except:
            return field.export(obj)

    class Meta:
        model = OrganisationEntityMasterModel
        exclude = ('created_at')

class OrganisationEntityViewResource(resources.ModelResource):

    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "entity_master_model":
                return obj.entity_master_model.key
            if field.column_name == "entity_workflows":
                return [val.app_key for val in obj.entity_workflows.all()]
            if field.column_name == "entity_forms":
                return [str(val.key + "::" + str(val.version)) for val in obj.entity_forms.all()]
            return field.export(obj)
        except:
            return field.export(obj)


    class Meta:
        model = OrganisationEntityView
        exclude = ('id')