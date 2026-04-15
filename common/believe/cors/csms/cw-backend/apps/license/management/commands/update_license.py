from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.contrib.auth.models import Permission
from apps.license.models import License

class Command(BaseCommand):
    help="To set the permissions for license for existing orgs"

    help_for_license="""You Must provide a correct License name. \nUsage: \n \n"""

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
        parser.add_argument('--license', type=str, help=self.help_for_license)
        parser.add_argument('--action', type=str, help=self.help_for_action)
    
    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            model=options['model']
            license_name = options['license']
            action = options['action']

            if model == None:
                raise CommandError(
                    "Option `--model=<your_organisationmodel>` must be specified.")

            if not license_name:
                raise CommandError(self.help_for_license)
                
            if not action:
                raise CommandError(self.help_for_action)
            license_obj = License.objects.get(name=license_name)
            if action != 'download':
                for letter in action:
                    if not letter in 'crud':
                        raise CommandError(self.help_for_action)

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
            for permission in perm:
                license_obj.permissions.add(permission)
            print('DONE!')
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))