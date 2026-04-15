// Organisation Roles
export const OWNER = "Owner";
export const SUPER_ADMINISTRATOR = "Super Administrator";
export const USER_MANAGEMENT = "User Management";
export const MODELLER_ADMINISTRATOR = "Modeller Administrator";
export const NORMAL_ORGANISATION_USER = "Normal Organisation User";
export const THIRD_PARTY_USER = "Third Party Users";
export const INVENTORY_MANAGEMENT = "Inventory Management";

export const SYSTEM_ROLES = [OWNER, SUPER_ADMINISTRATOR, USER_MANAGEMENT, MODELLER_ADMINISTRATOR,
    NORMAL_ORGANISATION_USER, THIRD_PARTY_USER, INVENTORY_MANAGEMENT]

// Task/Workflow Filter/Order Constants
export const CURRENT_TASK_FILTER_NAME = "Current_Task_Filter_Name";
export const DASHBOARD_CURRENT_APP_FILTER_NAME = "Dashboard_Current_App_Filter_Name";
export const THEME_CONTROLLER = "Theme_Controller";
export const GROUP_TASK_ORDER = "Group_Task_Order";
export const MY_TASK_ORDER = "My_Task_Order";
export const SELECTED_DASHBOARD_APP = "Selected_Dashboard_App";
export const ALL_WORKFLOWS ="All Workflows";

// Entity Constants
export const ENTITY_EMAIL = "entity_email";
export const ENTITY_PHONE_NUMBER = "entity_phone_number";
export const ENTITY_NAME = "entity_name";
export const ENTITY_PHOTO = "entity_photo";
export const ENTITY_INITIATOR = "initiator";
export const CANDIDATE_USER = "Candidate User";
export const ENTITY_LIST_FILTER = 'ENTITY_LIST_FILTER';

// Date constants
export const DATETIME_FORMAT = 'DD MMM YYYY, h:mm a'
export const DATE_FORMAT = 'DD MMM YYYY'
export const PROCESS_DATETIME_FORMAT = 'DD MMM YYYY HH:mm:ss'
export const GROUP_FILTER_FIELDS = [{ "label": "Location", "key": "entity_location" }/*, { "label": "Department", "key": "entity_department" }*/]
export const TOKEN = "token"
// Backend values are mapped  0-> ignored 1-> day , 2-> week , 3 -> month , 4-> custom 
export const REPORT_CHOICES = ['', 'day', 'week', 'month', 'custom']

// Process page
export const PAGE_SIZE_MAX_LIMIT = 100000000
export const ONGOING_PROCESS = "Ongoing process"
export const COMPLETED_PROCESS = "Completed process"
export const WITHDRAWN_PROCESS = "Withdrawn process"
export const DEFAULT_PAGE_SIZE = 5
export const MAX_PAGE_SIZE = 50

// Types of Docs
export const GENERATED_DOC = "Generated"
export const UPLOADED_DOC = "Uploaded"

export const ENTITY = "entity"
export const ENTITY_AADHAAR = "entity_aadhaar"
export const ENTITY_AADHAAR_MASKED = "entity_aadhaar_masked"
export const ENTITY_AADHAAR_HASHED = "entity_aadhaar_hashed"

// Updates types || websocket constants
export const NOTIFICATIONS = 'NOTIFICATIONS'
export const UPDATES = 'UPDATES'

export const UPDATE_ONGOING_PROCESS = 'UPDATE_ONGOING_PROCESS'
export const UPDATE_WITHDRAWN_PROCESS = 'UPDATE_WITHDRAWN_PROCESS'
export const UPDATE_COMPLETED_PROCESS = 'UPDATE_COMPLETED_PROCESS'
export const UPDATE_TASKS = 'UPDATE_TASKS'
export const DASHBOARD_UPDATE_VARIABLE = [
    UPDATE_COMPLETED_PROCESS, UPDATE_ONGOING_PROCESS, UPDATE_WITHDRAWN_PROCESS
]
export const UPDATE_BULK_PROCESS_RESULT = 'UPDATE_BULK_PROCESS_RESULT'
export const BULK_PROCESS_STEP_PROGRESS = 'BULK_PROCESS_STEP_PROGRESS'
export const CELERY_REPORT = 'CELERY_REPORT'

// config view tabs
export const CONFIG_VIEW_DASHBOARD = 'Dashboard'
export const CONFIG_VIEW_PROCESS = 'Process';
export const CONFIG_VIEW_ENTITY = 'Entity';
export const CONFIG_VIEW_JOB = 'Job'
export const CONFIG_VIEW_EVENT = 'Event'


// non-corporate email providers
export const UNALLOWED_EMAIL_PROVIDERS = ['gmail', 'googlemail', 'yahoo', 'outlook', 'hotmail','rediffmail',
        'rocketmail', 'aol', 'msn', 'live', 'gmx', 'yandex', 'ymail']

// Special Characters
export const SPECIAL_CHARACTERS_ERROR_REGEX = /(^[a-zA-Z]{1}$)|(^[a-zA-Z]+[0-9a-zA-Z,_\-\s]*[0-9a-zA-Z]$)/

// Backslash regex
export const BACK_SLASH_REGEX = /^[^\\]+$/

export const ITEMS_PER_PAGE = 10

//Permissions
export const CW_SERVICE_DASHBOARD_VIEW = 'CW_SERVICE_DASHBOARD:VIEW';
export const CW_SERVICE_PROCESSES_VIEW = 'CW_SERVICE_PROCESSES:VIEW';
export const CW_SERVICE_TASKS_VIEW = 'CW_SERVICE_TASKS:VIEW';
export const CW_SERVICE_CONFIG_VIEW = 'CW_SERVICE_CONFIG:VIEW';
export const CW_SERVICE_USER_VIEW = 'CW_SERVICE_USER:VIEW';
export const CW_SERVICE_GROUP_VIEW = 'CW_SERVICE_GROUP:VIEW';
export const CW_SERVICE_LIST_VIEW = 'CW_SERVICE_LIST:VIEW';
export const CW_SERVICE_PORTAL_VIEW = 'CW_SERVICE_PORTAL:VIEW';
export const CW_SERVICE_REPORTS_VIEW = 'CW_SERVICE_REPORTS:VIEW';
export const CW_SERVICE_LIST_UPDATE = 'CW_SERVICE_LIST:UPDATE';
export const CW_SERVICE_LIST_CREATE = 'CW_SERVICE_LIST:CREATE';
export const CW_SERVICE_LIST_DELETE = 'CW_SERVICE_LIST:DELETE';
export const CW_SERVICE_GROUP_UPDATE = 'CW_SERVICE_GROUP:UPDATE';
export const CW_SERVICE_GROUP_CREATE = 'CW_SERVICE_GROUP:CREATE';
export const CW_SERVICE_GROUP_DELETE = 'CW_SERVICE_GROUP:DELETE';
export const CW_SERVICE_USER_CREATE = 'CW_SERVICE_USER:CREATE';
export const CW_SERVICE_USER_UPDATE = 'CW_SERVICE_USER:UPDATE';
export const CW_SERVICE_APP_CREATE = 'CW_SERVICE_APP:CREATE';
export const CW_SERVICE_APP_VIEW = 'CW_SERVICE_APP:VIEW';
export const CW_SERVICE_POLICY_VIEW = 'CW_SERVICE_POLICY_MGMT:VIEW';
export const CW_SERVICE_POLICY_UPDATE = 'CW_SERVICE_POLICY_MGMT:UPDATE';
export const CW_SERVICE_CONTENT_CREATE = 'CW_SERVICE_CONTENT:CREATE';
export const CW_SERVICE_CONTENT_UPDATE = 'CW_SERVICE_CONTENT:UPDATE';
export const CW_SERVICE_CONTENT_DELETE = 'CW_SERVICE_CONTENT:DELETE';
export const CW_SERVICE_CONTENT_VIEW = 'CW_SERVICE_CONTENT:VIEW';
export const CW_SERVICE_PORTAL_CREATE = 'CW_SERVICE_PORTAL:CREATE';
export const CW_SERVICE_PORTAL_UPDATE = 'CW_SERVICE_PORTAL:UPDATE';
export const CW_SERVICE_PORTAL_DELETE = 'CW_SERVICE_PORTAL:DELETE';
export const CW_SERVICE_REPORTS_DOWNLOAD = 'CW_SERVICE_REPORTS:DOWNLOAD';
export const CW_SERVICE_TASKS_ACTION = 'CW_SERVICE_TASKS:ACTION';
export const CW_SERVICE_DRISHTI_VIEW = 'CW_SERVICE_DRISHTI:VIEW';
export const WORKFLOW_VIEW = 'WORKFLOW:VIEW';
export const WORKFLOW_INITIATE = 'WORKFLOW:INITIATE';
export const WORKFLOW_BULKINITIATE = 'WORKFLOW:BULKINITIATE';
export const WORKFLOW_UPLOAD = 'WORKFLOW:UPLOAD';
export const WORKFLOW_WITHDRAW = 'WORKFLOW:WITHDRAW';
export const WORKFLOW_REASSIGN = 'WORKFLOW:REASSIGN';
