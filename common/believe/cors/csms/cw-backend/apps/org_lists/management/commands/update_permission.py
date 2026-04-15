from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from utils.utils import get_tenant_model
from django.contrib.auth.models import Group, Permission


class Command(BaseCommand):
    help="To set the permissions for owner and superadmin for existing orgs"

    help_for_role="""You Must provide a correct role. \nUsage: \n \n
'--role o' for Owner
'--role s' for Super Administrator
'--role u' for User Management
'--role m' for Modeller Administrator
'--role n' for Normal Organisation User
'--role t' for Third Party Users
'--role i' for Inventory Management\n
'FOR MORE THAN ONE ROLE AT A TIME'
'--role os<...>' for owner, Super Administrator,<Roles first character> \n \n"""

    help_for_action=""" Usage:
'--action c' for giving only create permission
'--action r' for giving only read permission\n
'FOR MORE THAN ONE ACTION AT A TIME'
'--action cr' for giving create and read permission
'--action rud' for giving read, update, and delete permissions
'--action crud' for giving create, read, update, and delete permissions
'--action download' for giving report download permissions\n\n"""

    def add_arguments(self, parser):
        parser.add_argument('--model', type=str)
        parser.add_argument('--role', type=str, help=self.help_for_role)
        parser.add_argument('--action', type=str, help=self.help_for_action)
    
    def handle(self, *args, **options):
        try:
            model=options['model']
            role = options['role']
            action = options['action']

            if model == None:
                raise CommandError(
                    "Option `--model=<your_organisationmodel>` must be specified.")

            if not role:
                raise CommandError(self.help_for_role)
                
            if not action:
                raise CommandError(self.help_for_action)

            for letter in role:
                if not letter in 'osumnti':
                    raise CommandError(self.help_for_role)
            if action != 'download' and action != 'masterrecords' and action != 'manage_reports' :
                for letter in action:
                    if not letter in 'crud':
                        raise CommandError(self.help_for_action)

            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)

                    perm = Permission.objects.filter(content_type__model=model)
                    if not perm.exists():
                        raise CommandError('{} is not a valid model name'.format(model))

                    if 'c' not in action:
                        perm = perm.exclude(codename__contains='add')

                    if 'r' not in action:
                        perm = perm.exclude(codename__contains='view')

                    if 'u' not in action:
                        perm = perm.exclude(codename__contains='change')

                    if 'd' not in action:
                        perm = perm.exclude(codename__contains='delete')

                    if 'download' in action:
                        perm = Permission.objects.filter(codename='download_reports')
                    
                    if 'manage_reports' in action:
                        perm = Permission.objects.filter(codename='manage_reports')

                    
                    if 'masterrecords' in action:
                        perm = Permission.objects.filter(codename='manage_masterrecords')


                    owner=''
                    super_administrator=''
                    user_management=''
                    modeller_administrator=''
                    normal_organisation_user=''
                    third_party_users=''
                    inventory_management=''

                    for permission in perm:
                        if 'o' in role:
                            if Group.objects.filter(name="Owner").exists():
                                Group.objects.filter(name="Owner")[0].permissions.add(permission)
                                owner='owner, '
                        if 's' in role:
                            if Group.objects.filter(name="Super Administrator").exists():
                                Group.objects.filter(name="Super Administrator")[0].permissions.add(permission)
                                super_administrator='Super Administrator, '
                        if 'i' in role:
                            if Group.objects.filter(name="Inventory Management").exists():
                                Group.objects.filter(name="Inventory Management")[0].permissions.add(permission)
                                inventory_management='Inventory Management, '
                        if 'u' in role:
                            if Group.objects.filter(name="User Management").exists():
                                Group.objects.filter(name="User Management")[0].permissions.add(permission)
                                user_management='User Management, '
                        if 'm' in role:
                            if Group.objects.filter(name="Modeller Administrator").exists():
                                Group.objects.filter(name="Modeller Administrator")[0].permissions.add(permission)
                                modeller_administrator='Modeller Administrator, '
                        if 't' in role:
                            if Group.objects.filter(name="Third Party Users").exists():
                                Group.objects.filter(name="Third Party Users")[0].permissions.add(permission)
                                third_party_users='Third Party Users, '
                        if 'n' in role:
                            if Group.objects.filter(name="Normal Organisation User").exists():
                                Group.objects.filter(name="Normal Organisation User")[0].permissions.add(permission)
                                normal_organisation_user='Normal Organisation User, '

                    print('''
                    Permission List ({action}) Updated for {}{}{}{}{}{}{} in Tenant : {tenant}
                    '''.format(owner, super_administrator, inventory_management, user_management, modeller_administrator, third_party_users, normal_organisation_user, tenant=i.schema_name, action=action))
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))