from django.core.management.base import BaseCommand
from apps.org_users.models import OrganisationUser
from apps.org_users.utils import userwise_data_update
from ezedox.settings import HIGH_PRIORITY_TASK

class Command(BaseCommand):

    help="""Updating Email id to userId."""

    def handle(self, *args, **options):
        print("Email Id Mapping : ")
        print("Count : " + str(len(OrganisationUser.objects.all().count())))
        
        tables = ["act_id_user", "act_hi_actinst", "act_hi_identitylink", "act_hi_taskinst", "act_ru_variable", "act_ru_actinst", "act_ru_task", "act_ru_identitylink", "act_hi_varinst"]
        for item in tables:
            userwise_data_update.apply_async(args=[item], priority=HIGH_PRIORITY_TASK)
            print("Mission Starts !!!!!")
                
        