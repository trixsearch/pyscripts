from import_export import resources

from django.forms import ValidationError

from .models import Sequence

class SequenceResource(resources.ModelResource):

    class Meta:
        model = Sequence
        import_id_fields = ('name',)
        exclude = ('id','last' )

    def before_import_row(self, row, *args, **kwargs):
        name = row.get('name')
        obj = Sequence.objects.filter(name = name)
        if obj:
            raise ValidationError('Sequence with this name already exists')
