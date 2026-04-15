from import_export import resources
from .models import HiringState

class HiringStateResource(resources.ModelResource):

    class Meta:
        model = HiringState
        import_id_fields = ('name', 'tenant')

    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        if field.column_name == "fixed_status":
            return obj.fixed_status
        return field.export(obj)
