from django.db import connection
from apps.org_users.models import OrganisationUser, InternalUser, ExternalUser
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model


class Command(BaseCommand):

    def handle(self, *args, **options):
        try:
            print("Copy users old created at and updated at field data to new fields")
            connection.set_schema_to_public()
            for tenant in get_tenant_model().objects.all():
                if tenant.schema_name != 'public':
                    connection.set_tenant(tenant)
                    print('For {}'.format(str(tenant)))
                    try:
                        for org_user in OrganisationUser.objects.all():
                            if org_user.old_created_at or org_user.old_updated_at:
                                org_user.created_at = org_user.old_created_at
                                org_user.updated_at = org_user.old_updated_at
                                org_user.save()
                        for ext_user in ExternalUser.objects.all():
                            if ext_user.old_created_at or ext_user.old_updated_at:
                                ext_user.created_at = ext_user.old_created_at
                                ext_user.updated_at = ext_user.old_updated_at
                                ext_user.save()      
                        for int_user in InternalUser.objects.all():
                            if int_user.old_created_at or int_user.old_updated_at:
                                int_user.created_at = int_user.old_created_at
                                int_user.updated_at = int_user.old_updated_at
                                int_user.save()
                    except Exception as e:
                            print("Failed {}".format(str(e)))
        except Exception as e:
            print("Failed {}".format(str(e)))
        
        print("Script executed Succesfully.\n")
