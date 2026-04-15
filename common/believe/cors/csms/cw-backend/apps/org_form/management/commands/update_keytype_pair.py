from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models import Q

from apps.org_form.models import OrganisationForm
from apps.organisations.models import Organisation

class Command(BaseCommand):

    def handle(self, *args, **options):
        try:
            tenant_queryset = Organisation.objects.filter(~Q(schema_name='public'))
            for tenant in tenant_queryset:
                connection.set_tenant(tenant)
                for item in OrganisationForm.objects.all():
                    item.save()
        except Exception as error:
            print("Unexpected error occured {}".format(error))
