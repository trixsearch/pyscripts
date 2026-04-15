from django.db import connection
from django.core.management.base import BaseCommand
from utils.platform_employe_sync import update_user_policy
from apps.org_users.models import OrganisationUser
from ezedox.settings import PLATFORM_INTERNAL_TOKEN, PLATFORM_BASE_URL, HIGH_PRIORITY_TASK


class Command(BaseCommand):

    help="""Updating All User Policy."""
    
    def handle(self, *args, **options):
        try:
            for item in OrganisationUser.objects.all():
                update_user_policy.apply_async(args=[PLATFORM_BASE_URL, str(item.tenant.id), item.userId, PLATFORM_INTERNAL_TOKEN], priority=HIGH_PRIORITY_TASK)
            print("All User Policy Updated")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))