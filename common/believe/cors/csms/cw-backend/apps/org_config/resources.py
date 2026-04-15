from import_export import resources
from django.forms import ValidationError
from django.contrib.auth.models import Group
from apps.org_apps.models import OrganisationWorkflow
from .models import ChartName, DocumentTemplate, ReportTemplate, CustomAttribute, SMSTemplate

class DocumentTemplateResource(resources.ModelResource):

    class Meta:
        model = DocumentTemplate
        import_id_fields = ('name', 'key' , 'version')

class CustomAttributeResource(resources.ModelResource):

    class Meta:
        model = CustomAttribute
        import_id_fields = ('type', 'custom_attribute')


class ReportTemplateResource(resources.ModelResource):
    class Meta:
        model = ReportTemplate
        exclude = ('created_at','id')
        import_id_fields = ('name', )

    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "apps":
                return OrganisationWorkflow.objects.get(id=str(field.export(obj))).app_key
            if field.column_name =="roles":
                if field.export(obj):
                    role = field.export(obj).split(",")
                    roles_list = []
                    for role_id in role:
                        try:
                            roles_data = Group.objects.get(id = int(role_id)).name
                        except:
                            raise ValidationError('role not found')
                        roles_list.append(roles_data)
                    new_role_data = ','.join(roles_list)
                    return new_role_data
        except:
            pass
        return field.export(obj)


    def before_import_row(self, row, **kwargs):
        app_key = row.get('apps')
        if app_key:
            row['apps'] = str(OrganisationWorkflow.objects.get(app_key=app_key).id)
        role_string = row['roles']
        if role_string:
            role_list = role_string.split(",")
            role_id_list = []
            for role_name in role_list:
                try:
                    roles_data = str(Group.objects.get(name = role_name).id)
                except:
                    raise ValidationError('Incorrect role found')
                role_id_list.append(roles_data)
            role_id_str = ','.join(role_id_list)
            row['roles'] = role_id_str
        return row


class ChartNameResource(resources.ModelResource):
    class Meta:
        model = ChartName
    
    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        if field.column_name == "charts":
            return field.export(obj).split(",")
        return field.export(obj)

class SMSTemplateResource(resources.ModelResource):

    class Meta:
        model = SMSTemplate
        import_id_fields = ('default_status', 'tenant')