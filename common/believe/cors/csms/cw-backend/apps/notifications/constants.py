class NotificationConstant:
    TEST_NOTIFICATION = 'TEST_NOTIFICATION'
    REMINDER = 'REMINDER'
    REASSIGN = 'REASSIGN'
    GROUP_TASK = 'GROUP_TASK'
    INDIVIDUAL_TASK = 'INDIVIDUAL_TASK'
    OTHER_NOTIFICATION = 'OTHER_NOTIFICATION'

    TEST_NOTIFICATION_CHOICE = 0
    REMINDER_CHOICE = 1
    REASSIGN_CHOICE = 2
    GROUP_TASK_CHOICE = 3
    INDIVIDUAL_TASK_CHOICE = 4
    OTHER_NOTIFICATION_CHOICE = 5

    NOTIFICATION_CHOICES = (
        (TEST_NOTIFICATION_CHOICE, TEST_NOTIFICATION),
        (REMINDER_CHOICE, REMINDER),
        (REASSIGN_CHOICE, REASSIGN),
        (GROUP_TASK_CHOICE, GROUP_TASK),
        (INDIVIDUAL_TASK_CHOICE, INDIVIDUAL_TASK),
        (OTHER_NOTIFICATION_CHOICE, OTHER_NOTIFICATION),
    )

    MESSAGE = {
        TEST_NOTIFICATION: 'Some Test notification has been sent to you by {assignor}',
        REMINDER: 'New reminder has been sent to you by {assignor}',
        REASSIGN: 'New task is assigned to you by {assignor}',
        GROUP_TASK: 'New group task',
        INDIVIDUAL_TASK: 'New task is assigned to you',
        OTHER_NOTIFICATION: '{message}',
    }

    SUBJECT = {
        TEST_NOTIFICATION: 'New notification has been sent to you',
        REMINDER: 'New reminder has been sent to you',
        REASSIGN: 'New task is assigned to you',
        GROUP_TASK: 'New group task',
        INDIVIDUAL_TASK: 'New task is assigned to you',
        OTHER_NOTIFICATION: 'New notification has arrived',
    }

    def get_notification_message(self, type):
        return self.MESSAGE[type]

    @staticmethod
    def get_notification_from_type_choice(choice):
        return NotificationConstant.NOTIFICATION_CHOICES[choice][1]


class UpdatesConstant:
    UPDATE_ONGOING_PROCESS = 'UPDATE_ONGOING_PROCESS'
    UPDATE_COMPLETED_PROCESS = 'UPDATE_COMPLETED_PROCESS'
    UPDATE_WITHDRAWN_PROCESS = 'UPDATE_WITHDRAWN_PROCESS'

    UPDATE_BULK_PROCESS_RESULT = 'UPDATE_BULK_PROCESS_RESULT'
    BULK_PROCESS_STEP_PROGRESS = 'BULK_PROCESS_STEP_PROGRESS'

    CELERY_REPORT = 'CELERY_REPORT'
    UPDATE_USER_ATTR = 'UPDATE_USER_ATTR'


class MessageTypeConstant:
    UPDATES = 'UPDATES'
    NOTIFICATIONS = 'NOTIFICATIONS'
