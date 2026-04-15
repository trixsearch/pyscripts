from django.core.management.base import BaseCommand
from django.db import connection, transaction
from utils.utils import get_tenant_model
from apps.org_group.models import OrganisationGroup

# this script will only run once to clear existing groups data
class Command(BaseCommand):
    help="To delete group from tenants"

    def handle(self, *args, **options):
        try:
            COUNT = 30
            print('\n\n')
            connection.set_schema_to_public()
            for tenant in get_tenant_model().objects.all():
                # skipping public tenant
                if tenant.schema_name != 'public':
                    # setting connection to tenant
                    connection.set_tenant(tenant)
                    with transaction.atomic():
                        qs = OrganisationGroup.objects.filter()
                        group_count = qs.count()
                        if qs.exists() and group_count > COUNT:
                            print('{} has {} groups. Do you want to delete extra groups? yes or no'.format(tenant.name, qs.count()))
                            response = input('>')
                            if response == 'yes':
                                qs = qs[COUNT: ]
                                for g in qs:
                                    g.delete()

                                print('{} groups deleted for tenant {}.'.format(group_count-COUNT, tenant.name))
                            else:
                                print('Group deletion skipped.')

            print("DONE!")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))

