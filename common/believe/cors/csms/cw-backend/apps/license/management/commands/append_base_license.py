from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.db import transaction
from apps.license.models import License
from apps.organisations.models import OrganisationLicense

class Command(BaseCommand):
    help="To set the base license to all existing tenant"

    def handle(self, *args, **options):
        try:
            permission_list = Permission.objects.all()
            from django.db import connection
            connection.set_schema_to_public()
            with transaction.atomic():
                if not License.objects.filter(name='full_access').exists():
                    license_obj = License.objects.create(name='full_access', transactions=-1)
                    license_obj.permissions.set(permission_list)
                    print("full_access license created successfully.")
                else:
                    license_obj = License.objects.get(name = 'full_access')
                    license_obj.permissions.set(permission_list)
                    print("full_access license already exists")

                print('Appending full access license to all organisation') 
                for i in OrganisationLicense.objects.all():
                    i.license = license_obj
                    i.save()
                print('DONE.')
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))