from django.core.management.base import BaseCommand
from ezedox.settings import ( PROCESS_IDM_URL, PROCESS_ENGINE_URL, PROCESS_MODELER_URL )
from apps.organisations.utils import get_cookies, flowable_cleanup_for_tenant
from ezedox.settings import HIGH_PRIORITY_TASK

class Command(BaseCommand):

    help="""cleaning flowable data"""
    def add_arguments(self, parser):
        parser.add_argument('--tenant', type=str)

    def handle(self, *args, **options):
        try:
            tenant_id = options['tenant']
            designer_url = PROCESS_MODELER_URL
            idm_url = PROCESS_IDM_URL
            processengine_url = PROCESS_ENGINE_URL
            try:
                if get_cookies(idm_url, tenant_id):
                    flowable_cleanup_for_tenant.apply_async(args=[tenant_id, designer_url, idm_url, processengine_url ], priority=HIGH_PRIORITY_TASK)
                    print("completed !!!!!!!!!!!!!!!!")
                else:
                    print('Failed: Failed to get authenticate user and get cookies')
            except Exception as e:
                print("Failed: flowable data cleanup failed for tenant {}. Due to: {}".format(tenant_id, str(e)))
        except Exception as e:
            print("Failed: flowable data cleanup failed for tenant {}. due to: {}".format(tenant_id, str(e)))
