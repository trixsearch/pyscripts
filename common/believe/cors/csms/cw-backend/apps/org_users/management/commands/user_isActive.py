from django.db import connection
from apps.org_users.models import OrganisationUser 
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model


class Command(BaseCommand):

    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for tenant in get_tenant_model().objects.all():
                if tenant.schema_name != 'public':
                    connection.set_tenant(tenant)
                    print('For {}'.format(str(tenant)))
                    users = OrganisationUser.objects.all()
                    try:
                        for user in users:
                            if not user.email_verified:
                                user.is_active = False
                                print("{} ==> email is not verified, setting is_active to false\n".format(user))
                            user.save()
                    except Exception as e:
                            print("Failed {}".format(str(e)))
        except Exception as e:
            print("Failed {}".format(str(e)))
        
        print("Script executed Succesfully.\n")
