from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from utils.utils import get_tenant_model


class Command(BaseCommand):
    help="To enable or disabled the notification for all tenant"

    def add_arguments(self, parser):
        parser.add_argument('to', type=str)

    def handle(self, *args, **options):
        try:
            status=options['to']
            if status not in ['enable', 'disable']:
                raise CommandError('Please pass correct parameter. Allowed -> <enable>, <disable>')

            connection.set_schema_to_public()
            for tenant in get_tenant_model().objects.all():
                if tenant.schema_name != 'public':
                    if status == "enable":
                        if tenant.support_notification is False:
                            tenant.support_notification = True
                            tenant.save()
                            print('Notification Enabled for {}'.format(tenant.schema_name))
                    elif status == "disable":
                        if tenant.support_notification:
                            tenant.support_notification = False
                            tenant.save()
                            print('Notification Disabled for {}'.format(tenant.schema_name))
            print("DONE!")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))
