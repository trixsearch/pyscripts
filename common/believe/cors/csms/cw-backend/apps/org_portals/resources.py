from import_export import resources

from .models import Portals, Content, PortalContentOrder
class PortalsResource(resources.ModelResource):

    class Meta:
        model = Portals
        import_id_fields = ('id', )
        exclude = ('slug')

class ContentsResource(resources.ModelResource):

    class Meta:
        model = Content
        import_id_fields = ('id', )
        exclude = ('slug')

    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        if not obj.content is None or '':
            if field.column_name == "content":
                return str(obj.content, 'utf-8')
        return field.export(obj)

    def before_import_row(self, row, **kwargs):
        if "content" in row:
            row['content'] = row.get('content').encode()
        return row

class PortalContentOrderResource(resources.ModelResource):

    class Meta:
        model = PortalContentOrder
        import_id_fields = ('id', )
