from django.db import connection
from django.core.management.base import BaseCommand
# from utils.utils import get_tenant_model
from apps.org_jobs.models import JobCandidate

class Command(BaseCommand):

    help="""Add application id in Job Candidate"""

    def handle(self, *args, **options):
        try:
            print("adding application id .")
            if JobCandidate.objects.all():
                for candidate in JobCandidate.objects.all():
                    if not candidate.applicationId:
                        c_id = candidate.candidateId
                        a_id = "A" + c_id[1:]
                        candidate.applicationId = a_id
                        candidate.save()
                print("Successfully added application id for all tenants.")
            else:
                print("No job Candidates record found.")
        except Exception as e:
                print("Failed to add application id due to {}".format(str(e)))
