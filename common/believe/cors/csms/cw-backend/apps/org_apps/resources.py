from django.forms import ValidationError
from django.contrib.auth.models import Group
from import_export import resources, fields
from .models import OrganisationWorkflow,ProcessView, WorkflowAccess
from apps.organisations.models import Organisation

class OrganisationWorkflowResource(resources.ModelResource):

    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "open_forms":
                return obj.open_forms.key + "::" + str(obj.open_forms.version)
            return field.export(obj)
        except:
            return field.export(obj)

    class Meta:
        model = OrganisationWorkflow
        import_id_fields = ('app_key', 'tenant')
        exclude = ('id','forms','app_registry','portal','selected_forms','selected_form_fields')


    def before_import_row(self, row, *args, **kwargs):
        name = row.get('name')
        obj = OrganisationWorkflow.objects.filter(name = name, tenant=row.get('tenant'))
        if obj:
            raise ValidationError('Organisation Workflow with this name already exists')


class ProcessViewResource(resources.ModelResource):
    class Meta:
        model = ProcessView
        import_id_fields = ('app','role',)
        exclude = ('id')

    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "app":
                return OrganisationWorkflow.objects.get(id=str(field.export(obj))).app_key
            if field.column_name =="role":
                if field.export(obj):
                    role = field.export(obj)
                    try:
                        role_name = Group.objects.get(id = int(role)).name
                    except:
                        raise ValidationError('role not found')
                    return role_name
        except:
            pass
        return field.export(obj)


    def before_import_row(self, row, **kwargs):
        app_key = row.get('app')
        try:
            row['app'] = str(OrganisationWorkflow.objects.get(app_key=app_key).id)
        except:
            raise ValidationError('app key not found')
        role = row['role']
        if role:
            try:
                roles_data = str(Group.objects.get(name = role).id)
            except:
                raise ValidationError('Incorrect role found')
            row['role'] = roles_data
        return row


class WorkflowAccessResource(resources.ModelResource):
    tenant = fields.Field(column_name='Tenant')
    policy_name = fields.Field(column_name='Policy Name')

    class Meta:
        model = WorkflowAccess
        exclude = ('created_at', 'updated_at')

    def dehydrate_policy_name(self, obj):
        return obj.policy.name

    def dehydrate_tenant(self, obj):
        return obj.app.tenant.name if obj.app.tenant.name else str(obj.app.tenant.id)

    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "app":
                return obj.app.app_key
        except:
            pass
        return field.export(obj)

    def before_import_row(self, row, **kwargs):
        app_key = row.get('app')
        try:
            row['app'] = str(OrganisationWorkflow.objects.get(app_key=app_key, tenant=Organisation.objects.get(name=row.get('Tenant'))).id)
        except Exception as e:
            raise ValidationError("app not found")
        return row
