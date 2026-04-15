#The purpose of this script to clear form cache
#limitation: This script will clear cache for all the forms not limited to recently imported forms 
from django.core.management.base import BaseCommand
from utils.cache import delete_cache
from apps.org_form.models import OrganisationForm

class Command(BaseCommand):
    help='Clear Cache for form'

    def handle(self, *args, **options):
        try:
            for form_obj in OrganisationForm.objects.all():
                delete_cache(form_obj.key + "::" + str(form_obj.version) + str(form_obj.tenant.id))
                print('Cleared cache for {}::{}'.format(form_obj.key, form_obj.version))
        except Exception as error:
            print("Unexpected error occurred - {0}".format(error))
