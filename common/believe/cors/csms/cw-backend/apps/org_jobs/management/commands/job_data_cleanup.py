from django.db import connection
from django.db import transaction
from django.core.management.base import BaseCommand
from apps.organisations.models import Organisation
from apps.org_jobs.models import Job, JobCandidate, HiringEvent, HiringState, HeadCountPlanDetail, HeadCountPlan, JobRole
from apps.org_entity.models import OrganisationEntityMasterData

class Command(BaseCommand):

    help="""Updating status in job"""
    def add_arguments(self, parser):
        parser.add_argument('--tenant', type=str)

    def handle(self, *args, **options):
        try:
            tenant = options['tenant']
            org_obj = Organisation.objects.get(schema_name="ezedox_" + tenant)
            connection.set_tenant(org_obj)
            try:
                with transaction.atomic():
                    print("Starting: deleting job data in tenant {}.".format(tenant))
                    JobCandidate.objects.all().delete()
                    for entity_data in OrganisationEntityMasterData.objects.all_with_deleted():
                        entity_data.erase()
                    HiringEvent.objects.all().delete()
                    Job.objects.all().delete()
                    HiringState.objects.all().delete()
                    HeadCountPlanDetail.objects.all().delete()
                    HeadCountPlan.objects.all().delete()
                    JobRole.objects.all().delete()
                    print("Completed: successfully deleted job data in tenant {}.".format(tenant))
            except Exception as e:
                print("Failed: job data deletion failed for tenant {}. Due to: {}".format(tenant, str(e)))
        except Exception as e:
            print("Failed: for tenant {}. due to: {}".format(tenant, str(e)))
