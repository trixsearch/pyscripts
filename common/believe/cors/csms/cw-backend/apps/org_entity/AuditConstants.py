class AuditConstants:
    TASK_CREATED = 'created'
    TASK_CREATED_TEXT = 'Task Created'
    TASK_CREATED_JSON = {
        'author_name': ''
    }

    SUBSCRIBER_ADDED ="subscriber_added"
    SUBSCRIBER_ADDED_TEXT ="Subscriber Added"

    SUBSCRIBER_REMOVE = "subscriber_removed"
    SUBSCRIBER_REMOVE_TEXT = "Subscriber Removed"

    TASK_UPDATED = 'updated'
    TASK_UPDATED_TEXT = 'Task Updated'
    TASK_UPDATED_JSON = {
        'author_name': '',
        'field': '',
        'from': '',
        'to': ''
    }

    DOCUMENT_UPLOADED = 'document_added'
    DOCUMENT_UPLOADED_TEXT = 'Document Uploaded'
    DOCUMENT_UPLOADED_JSON = {
        'user_name': '',
        'document_name': ''
    }

    DOCUMENT_DELETED = 'document_deleted'
    DOCUMENT_DELETED_TEXT = 'Document Uploaded'
    DOCUMENT_DELETED_JSON = {
        'user_name': '',
        'document_name': ''
    }

    COMMENTED = 'comment_added'
    COMMENTED_TEXT = 'Commented'
    COMMENTED_JSON = {
        'author_name': '',
        'comment': ''
    }

    ASSIGNED = 'assign'
    ASSIGNED_TEXT = 'Assigned'
    ASSIGNED_JSON = {
        'author_name': '',
        'to_whom': '',
        'comment': '',
        'sign': '',
        'approve': ''
    }

    SIGNED = 'sign'
    SIGNED_TEXT = 'Signed'
    SIGNED_JSON = {
        'author_name': '',
        'comment': ''
    }

    APPROVED = 'approve'
    APPROVED_TEXT = 'Approved'
    APPROVED_JSON = {
        'author_name': '',
        'comment': ''
    }

    ONHOLD = 'onhold'
    ONHOLD_TEXT = 'On Hold'
    ONHOLD_JSON = {
        'author_name': '',
        'comment': ''
    }

    INPROGRESS = 'inprogress'
    INPROGRESS_TEXT = 'In Progress'
    INPROGRESS_JSON = {
        'author_name': '',
        'comment': ''
    }

    REJECTED = 'reject'
    REJECTED_TEXT = 'Rejected'
    REJECTED_JSON = {
        'author_name': '',
        'comment': ''
    }

    RESOLVED = 'resolve'
    RESOLVED_TEXT = 'Resolved'
    RESOLVED_JSON = {
        'author_name': '',
        'comment': ''
    }

    ACTIONS = [ASSIGNED, SIGNED, APPROVED,
               ONHOLD, INPROGRESS, REJECTED, RESOLVED]

    MODEL_CHOICES = (
        (TASK_CREATED, TASK_CREATED_TEXT),
        (DOCUMENT_UPLOADED, DOCUMENT_UPLOADED_TEXT),
        (DOCUMENT_DELETED, DOCUMENT_DELETED_TEXT),
        (SUBSCRIBER_ADDED,SUBSCRIBER_ADDED_TEXT),
        (SUBSCRIBER_REMOVE,SUBSCRIBER_REMOVE_TEXT),

        # Actions
        (COMMENTED, COMMENTED_TEXT),
        (ASSIGNED, ASSIGNED_TEXT),

        # Permissions
        (SIGNED, SIGNED_TEXT),
        (APPROVED, APPROVED_TEXT),

        # Status
        (ONHOLD, ONHOLD_TEXT),
        (INPROGRESS, INPROGRESS_TEXT),
        (REJECTED, REJECTED_TEXT),
        (RESOLVED, RESOLVED_TEXT),
    )


STATUS_INPROGRESS = 1
STATUS_ONHOLD = 2
STATUS_REJECTED = 3
STATUS_RESOLVED = 4

PERMISSION_APPROVE = 1
PERMISSION_SIGN = 2
PERMISSION_NO_ACTION = 3

TASK_STATUS = (
    (STATUS_INPROGRESS, 'INPROGRESS'),
    (STATUS_ONHOLD, 'ONHOLD'),
    (STATUS_REJECTED, 'REJECTED'),
    (STATUS_RESOLVED, 'RESOLVED')
)

INPROGRESS = 1
SUCCESS = 2
ERROR = 3
IGNORED = 4

TASK_UPLOAD_STATUS = (
    (INPROGRESS, 'INPROGRESS'),
    (SUCCESS, 'SUCCESS'),
    (ERROR, 'ERROR'),
    (IGNORED, 'IGNORED')
)

TASK_PERMISSION = (
    (PERMISSION_APPROVE, 'APPROVE'),
    (PERMISSION_SIGN, 'SIGN'),
    (PERMISSION_NO_ACTION, 'NO_ACTION')
)

BASE_FOLDER_PATH = "{0}/EmployeeDocuments/{1}/"
BASE_FILE_PATH = "{0}/EmployeeDocuments/{1}/{2}"
