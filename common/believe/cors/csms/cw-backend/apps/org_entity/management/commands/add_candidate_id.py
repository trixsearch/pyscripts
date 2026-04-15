from django.db import connection
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model
from apps.org_entity.models import OrganisationEntityMasterData
class Command(BaseCommand):

    help="""Adding candidate id in Entity Master Data"""

    def handle(self, *args, **options):
        try:
            for tenant in get_tenant_model().objects.all():
                try:
                    serial_no = "00000"
                    print("Adding candidate id in entity master data for tenant {}.".format(tenant.id))
                    if OrganisationEntityMasterData.objects.filter(entity_model__tenant__id=tenant.id):
                            for data in OrganisationEntityMasterData.objects.filter(entity_model__tenant__id=tenant.id).order_by("created_at"):
                                    c_id = "C" + format(int(serial_no) + 1, "05")
                                    serial_no = int(serial_no) + 1 
                                    data.candidateId = c_id
                                    data.save()
                            print("Successfully updated job status in tenant {}.".format(tenant.id))
                    else:
                        print("No entity master data found in tenant {}.".format(tenant.id))
                except Exception as e:
                    print("Failed to add application id tenant {}. due to {}".format(tenant.id, str(e)))
            print("addition of applicant id completed.")
        except Exception as e:
            print("Failed  {}".format(str(e)))
