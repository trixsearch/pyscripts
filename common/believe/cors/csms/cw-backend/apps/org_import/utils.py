from apps.notifications.constants import UpdatesConstant
from apps.org_import.serializers import EntityImportToJsonSerializer
from utils.loggerwrapper import Logger, getMessage
from .internal_errors import org_import_errors
logger = Logger(__name__)


def send_updates_for_import(tenant, import_obj):
    """ Sending final updates after bulk import completed in process, location, group """

    try:
        from apps.notifications.notification import send_updates # pylint: disable=import-outside-toplevel
        send_updates(tenant,import_obj.user, UpdatesConstant.UPDATE_BULK_PROCESS_RESULT, EntityImportToJsonSerializer(import_obj).data)
    except Exception as error:
        internal_error = 14005
        logger.exception(getMessage(org_import_errors, internal_error).format(str(error)), internal_error)
