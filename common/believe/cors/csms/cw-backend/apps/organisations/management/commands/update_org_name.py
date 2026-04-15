from django.db import connection
import requests
from django.core.management.base import BaseCommand
from apps.organisations.models import Organisation
from ezedox.settings import PLATFORM_INTERNAL_TOKEN, PLATFORM_BASE_URL, SSL_VERIFICATION


class Command(BaseCommand):
    
    help="""Updating All Organisation Name."""

    def handle(self, *args, **options):
        try:
            for item in Organisation.objects.all():
                url = PLATFORM_BASE_URL + '/api/customer-mgmt/org/' + str(item.id)
                headers = {
                    "content-type" : "application/json",
                    "Authorization" : "Bearer " + PLATFORM_INTERNAL_TOKEN
                }
                response = requests.request("GET", url, headers=headers, verify=SSL_VERIFICATION)
                if response.status_code == 200:
                    item.name = response.json()["name"]
                    item.save()
            print("All Organisation Naame Updated")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))
