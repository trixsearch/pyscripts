from import_export import resources
from django.forms import ValidationError
from django.contrib.auth.models import Group
from apps.org_users.models import OrganisationUser
from .models import OrganisationGroup

class OrganisationGroupResource(resources.ModelResource):

    class Meta:
        model = OrganisationGroup
        import_id_fields = ('name', )
        exclude = ('slug')


    def before_import_row(self, row, *args, **kwargs):
        group_name = row.get('name')
        users_data = row.get('users').split(',')
        obj = OrganisationGroup.objects.filter(name = group_name)
        if obj:
            raise ValidationError('Group with this name already exists')
        new_user_data = []
        for item in users_data:
            try:
                user_id = str(OrganisationUser.default_manager.get(email=item).id)
                new_user_data.append(user_id)
            except:
                pass
        if not new_user_data:
            owner = Group.objects.get(name = 'Owner')
            user_id = str(OrganisationUser.default_manager.get(groups = owner).id)
            new_user_data.append(user_id)
        new_user_str = ','.join(new_user_data)
        row['users'] = new_user_str
        return row



    def export_field(self, field, obj):
        field_name = self.get_field_name(field)
        method = getattr(self, 'dehydrate_%s' % field_name, None)
        if method is not None:
            return method(obj)
        try:
            if field.column_name == "users":
                users_data = field.export(obj).split(',')
                new_user_data = []
                for item in users_data:
                    email = OrganisationUser.default_manager.get(id=item).email
                    new_user_data.append(email)
                new_user_str = ','.join(new_user_data)
                return new_user_str
        except:
            pass
        return field.export(obj)
