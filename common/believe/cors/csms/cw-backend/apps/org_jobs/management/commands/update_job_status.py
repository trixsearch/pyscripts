from django.db import connection
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model
from apps.org_jobs.models import Job

class Command(BaseCommand):

    help="""Updating status in job"""

    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        print("updating job status in tenant {}.".format(i))
                        if Job.objects.all():
                            for job in Job.objects.all():
                                if job.old_status == "Active":
                                    job.status = "Open"
                                if job.old_status == "Inactive":
                                    job.status = "Achieved"
                                job.save()
                            print("Successfully updated job status in tenant {}.".format(i))
                        else:
                            print("No jobs found in tenant {}.".format(i))
                    except Exception as e:
                        print("Failed to update job status in tenant {}. due to {}".format(i, str(e)))
            print("updation of job status completed.")
        except Exception as e:
            print("Failed  {}".format(str(e)))
