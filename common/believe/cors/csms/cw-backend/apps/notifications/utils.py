from utils.loggerwrapper import Logger, getMessage
from .internal_errors import notifications_errors
logger = Logger(__name__)


def get_user_group(org_domain, user_id):
    name = "{}{}{}".format('group-user', org_domain, user_id)
    return ''.join(filter(str.isalnum, name))

def get_notification_group_name(org_domain, group_id):
    name = "{}{}{}".format('group', org_domain, group_id)
    return ''.join(filter(str.isalnum, name))

def get_tenant_room_name(tenant):
    name = "{}{}{}".format('tenant', tenant.schema_name, str(tenant.id))
    return ''.join(filter(str.isalnum, name))


def get_system_filter_value(filter_field,user_data):
    try:
        exect_value = []
        if filter_field =='entity_location':
            user_location_data = user_data.location
            if user_location_data:
                exect_value.append(user_location_data.name)
        elif filter_field =='entity_department':
            user_department_data = user_data.department
            if user_department_data:
                exect_value.append(user_department_data.name)
        else:
            user_extra_field_data  = user_data.extra_fields
            if user_extra_field_data:
                filter_field_value = user_extra_field_data[filter_field]
                if filter_field_value:
                    if isinstance(filter_field_value, dict) and filter_field_value['value']:
                        exect_value.append(filter_field_value['value'])
                    elif isinstance(filter_field_value, list):
                        for list_data in filter_field_value:
                            if list_data['value']:
                                exect_value.append(list_data['value'])
                    else:
                        exect_value.append(filter_field_value)
        return exect_value
    except Exception as error:
        internal_error = 5009
        logger.exception(getMessage(notifications_errors, internal_error).format(error), internal_error)
