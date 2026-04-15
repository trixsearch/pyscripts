from django.core.management.base import BaseCommand
from apps.org_apps.models import OrganisationWorkflow, WorkflowAccess
from apps.org_users.models import PlatformPolicy

class Command(BaseCommand):
    def handle(self, *args, **options):
        try:
            for item in OrganisationWorkflow.objects.all():
                for item_2 in PlatformPolicy.objects.filter(tenant=item.tenant):
                    WorkflowAccess.objects.create(app=item,policy=item_2)
        except Exception as e:
            print("Error: Unexpected error occcured - {0}".format(e))