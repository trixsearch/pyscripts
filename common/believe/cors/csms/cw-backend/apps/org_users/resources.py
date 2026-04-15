import json
from import_export import resources
from django.forms import ValidationError
from .models import ExternalUser, OrganisationUser

class ExternalUserResource(resources.ModelResource):

    class Meta:
        model = ExternalUser
        import_id_fields = ('email', )
        exclude=('is_staff', 'is_superuser', 'otp_expiration_time',
                   'user_permissions', 'groups', 'is_active','id', 'password','last_login','user_ptr')

    def before_import_row(self, row, *args, **kwargs):
        model_fields = ['first_name', 'last_name', 'mobile', 'gender', 'email', 'extra_fields','created_at','updated_at']
        all_data_fields = row.keys()
        list_difference = [item for item in all_data_fields if item not in model_fields]

        if not row['email']:
            row['email'] = "91" + str(row['mobile'])+ "@ezedox.com"
        if row['mobile']:
            if not str(row['mobile']).startswith("+91"):
                if len(str(row['mobile'])) > 10:
                    row['mobile'] = "+" + str(row['mobile'])
                else:
                    row['mobile'] = "+91" + str(row['mobile'])
        extra_json = {}
        if 'extra_fields' in row and row['extra_fields']:
            extra_json = json.loads(row['extra_fields'].replace("'", '"')).copy()
        for extra_key in list_difference:
            extra_json[extra_key] = row[extra_key]
        if extra_json:
            row['extra_fields'] = extra_json
        return row

class OrgUserResources(resources.ModelResource):
    class Meta:
        model = OrganisationUser
        import_id_fields = ('email', )
        exclude=('is_deleted', 'deleted_at', 'is_staff', 'is_superuser', 'user_permissions', 'groups', 'is_active','id', 'password','last_login','user_ptr', 'email_verified', 'display_picture')
    
    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "location":
                return obj.location.name
            elif field.column_name == "department":
                return obj.department.name
            elif field.column_name == "manager":
                return OrganisationUser.default_manager.get(id=str(field.export(obj))).email
        except:
            pass
        return field.export(obj)
        
    def before_import_row(self, row, *args, **kwargs):
        model_fields = ['first_name', 'last_name', 'middle_name', 'manager', 'location', 'department', 'employee_id', 'mobile', 'gender', 'email', 'extra_fields','created_at','updated_at']
        all_data_fields = row.keys()
        list_difference = [item for item in all_data_fields if item not in model_fields]

        if not row['email']:
            row['email'] = "91" + str(row['mobile'])+ "@ezedox.com"
        if row['mobile']:
            if not str(row['mobile']).startswith("+91"):
                if len(str(row['mobile'])) > 10:
                    row['mobile'] = "+" + str(row['mobile'])
                else:
                    row['mobile'] = "+91" + str(row['mobile'])
        extra_json = {}
        if 'extra_fields' in row and row['extra_fields']:
            extra_json = json.loads(row['extra_fields'].replace("'", '"')).copy()
        for extra_key in list_difference:
            extra_json[extra_key] = row[extra_key]
        if extra_json:
            row['extra_fields'] = extra_json
        return row