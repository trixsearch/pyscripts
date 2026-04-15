from import_export import resources
from import_export.fields import Field
from django.forms import ValidationError
from django.contrib.auth.models import Group
from apps.org_users.models import OrganisationUser
from .models import DepartmentDetail,Department

class DepartmentDetailResource(resources.ModelResource):

    extra_fields = Field(attribute='extra_fields', column_name='extra_fields')

    class Meta:
        model = DepartmentDetail
        import_id_fields = ('department', )
        fields = ('department','head','extra_fields')

    def before_import_row(self, row, **kwargs):
        department_name = row.get('department')
        extra_fields = row.get('extra_fields','')
        head = row.get('head','')
        department_data = Department.objects.filter(name = department_name)
        if department_data:
            raise ValidationError('Department with this name already exists')
        try:
            row['head'] = str(OrganisationUser.default_manager.get(email=head).id)
        except:
            owner = Group.objects.get(name = 'Owner')
            row['head'] = str(OrganisationUser.default_manager.get(groups = owner).id)
        obj, created = Department.objects.get_or_create(name=department_name, defaults={'name': department_name,'extra_fields':extra_fields})
        if obj:
            row['department'] = str(obj.id)
            row['extra_fields'] = extra_fields
        return row


    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "department":
                return obj.department.name
            if field.column_name == "extra_fields":
                return obj.department.extra_fields
            if field.column_name == "head":
                return OrganisationUser.default_manager.get(id=str(field.export(obj))).email
        except:
            pass
        return field.export(obj)
