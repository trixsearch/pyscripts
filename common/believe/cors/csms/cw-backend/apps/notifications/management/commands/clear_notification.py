import datetime
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from utils.utils import get_tenant_model
from apps.notifications.models import Notification


class Command(BaseCommand):
    help="To delete read notification from tenants"

    def add_arguments(self, parser):
        parser.add_argument('days', type=str)

    def handle(self, *args, **options):
        try:
            days=options['days']
            try:
                days = int(days)
            except Exception as error:
                print(error)
                raise CommandError('Please pass no of days')
            print('\n\n')
            connection.set_schema_to_public()
            for tenant in get_tenant_model().objects.all():
                # skipping public tenant
                if tenant.schema_name != 'public':
                    # setting connection to tenant
                    connection.set_tenant(tenant)
                    with transaction.atomic():
                        qs = Notification.objects.filter(created_at__lte=datetime.datetime.now()-datetime.timedelta(days=days), is_seen=True)
                        if qs.exists():
                            count, noti = qs.delete()
                            print('{} read notifications deleted from last {} days for tenant {}.'.format(count, days, tenant.name))
          
            print("DONE!")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))
