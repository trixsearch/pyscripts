from django.core.management.base import BaseCommand
from apps.organisations.models import OrganisationLicense
from ezedox.settings import PROCESS_IDM_URL, PROCESS_MODELER_URL, PROCESS_ENGINE_URL

class Command(BaseCommand):

    help="""Update License """

    def handle(self, *args, **options):
        try:
            skip_org = []
            for item in OrganisationLicense.objects.all().exclude(organisation__id__in=skip_org):
                item.processengine = PROCESS_ENGINE_URL
                item.process_modeler = PROCESS_MODELER_URL
                item.process_idm = PROCESS_IDM_URL
                item.save()

        except Exception as e:
            print("Failed  {}".format(str(e)))