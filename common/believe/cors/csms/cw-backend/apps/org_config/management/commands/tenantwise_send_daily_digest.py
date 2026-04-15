from django.core.management.base import BaseCommand
from apps.org_config.utils import tenantwise_send_daily_digest
from apps.organisations.models import Organisation

class Command(BaseCommand):
    help = 'Send daily digest email.'

    def success_message(self, message):
        if hasattr(self.style, 'SUCCESS'):
            self.stdout.write(self.style.SUCCESS(message))
        else:
            # Django 1.8
            self.stdout.write(self.style.MIGRATE_SUCCESS(message))

    def handle(self, *args, **options):
        for org in Organisation.objects.all().exclude(schema_name="public"):
            tenantwise_send_daily_digest(org)

            self.success_message('Sent daily digest for ' + org.schema_name.split('_')[1])