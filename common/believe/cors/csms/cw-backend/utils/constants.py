# coding=utf-8

API_RESPONSE_STRUCTURE = {
    "success": "",
    "message": "",
    "error": None,
    "data": None
}


# BPM
TASKS_BASE_ENDPOINT = 'service/runtime/tasks'
PROCESS_INSTANCES_BASE_ENDPOINT = 'service/runtime/process-instances'
HISTORY_PROCESS_INSTANCES_BASE_ENDPOINT = 'service/history/historic-process-instances'
HISTORY_TASK_INSTANCES_BASE_ENDPOINT = 'service/history/historic-task-instances'
HISTORY_VARIABLE_INSTANCES_BASE_ENDPOINT = 'service/history/historic-variable-instances'
HISTORY_PROCESS_INSTANCE_COMMENTS = 'service/history/historic-process-instances/{0}/comments'
HISTORY_VARIABLE_INSTANCES_ENDPOINT = '{0}' + HISTORY_VARIABLE_INSTANCES_BASE_ENDPOINT
PROCESS_INSTANCES_DELETE_ENDPOINT = 'service/history/historic-process-instances/{0}/'
# tasks
TASK_UPDATE_ACTION = TASKS_BASE_ENDPOINT + '/{0}'
RUNTIME_TASK_INSTANCES = TASKS_BASE_ENDPOINT + '/{0}'
RUNTIME_TASK_VARIABLE = PROCESS_INSTANCES_BASE_ENDPOINT + '/{0}' + '/variables'
# process-instances
PROCESS_INSTANCE_DIAGRAM = PROCESS_INSTANCES_BASE_ENDPOINT + '/{0}/diagram'
PROCESS_INSTANCE_ID = PROCESS_INSTANCES_BASE_ENDPOINT + '/{0}'


# identity-links
CANDIDATE_USER_HISTORIC_PROCESS_INSTANCE = HISTORY_PROCESS_INSTANCES_BASE_ENDPOINT + '/{0}/identitylinks'
CANDIDATE_USER_RUNTIME_PROCESS_INSTANCE = PROCESS_INSTANCES_BASE_ENDPOINT + '/{0}/identitylinks'

CANDIDATE_USER_HISTORIC_TASK_INSTANCE = HISTORY_TASK_INSTANCES_BASE_ENDPOINT + '/{0}/identitylinks'
CANDIDATE_USER_RUNTIME_TASK_INSTANCE = TASKS_BASE_ENDPOINT + '/{0}/identitylinks'

# query
QUERY_IN_HISTORY_PROCESS_INSTANCE = 'service/query/historic-process-instances'
QUERY_IN_HISTORY_TASK_INSTANCE = 'service/query/historic-task-instances'

# process instance variables
# identity-links
PROCESS_INSTANCE_VARIABLES = PROCESS_INSTANCES_BASE_ENDPOINT + '/{0}/variables'

# historic activity instances, for entity Audit log
HISTORIC_ACTIVITY_INSTANCES = 'service/history/historic-activity-instances'

class FORMIO_MAPPING :
    DATATYPE = {
        "file" : "file",
        "textarea": "string",
        "datetime": "date",
        "date": "date",
        "select": "string",
        "textfield": "string",
        "phoneNumber": "string",
        "radio": "string",
        "password": "string",
        "checkbox": "string",
        "number": "long",
        "email": "string",
        "bool":"boolean"
    }
