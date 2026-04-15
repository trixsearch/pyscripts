from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.db.models import Count
from utils.utils import get_tenant_model
from apps.notifications.models import Notification


class Command(BaseCommand):
    help="To delete read notification from tenants"


    def handle(self, *args, **options):
        try:
            print('\n\n')
            connection.set_schema_to_public()
            for tenant in get_tenant_model().objects.all():
                # skipping public tenant
                if tenant.schema_name != 'public':
                    # setting connection to tenant
                    connection.set_tenant(tenant)
                    with transaction.atomic():
                        qs = Notification.objects.values('recipient','notification_type','task_id').annotate(Count('id')).order_by().filter(id__count__gt=1)
                        if qs.exists():
                            for item in qs:
                                total = item.get('id__count')
                                query = Notification.objects.filter(task_id=item.get('task_id'))
                                flag = 1
                                for noti in query:
                                    if flag == 1:
                                        flag += 1
                                        continue
                                    noti.delete()
                            print('Duplicated notification deleted for {}'.format(tenant.name))

            print("DONE!")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))
