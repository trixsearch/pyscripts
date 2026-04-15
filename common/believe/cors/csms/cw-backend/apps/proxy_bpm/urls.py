# coding=utf-8
from django.conf.urls import url
from rest_framework.routers import DefaultRouter

from .views import (HistoryProcessInstanceViewSet, BPMQueryViewSet, # CandidateProcessViewSet, CandidateTaskViewSet, ProcessInstanceDiagramViewSet,
                    ProcessInstanceViewSet,
                    RuntimeTaskInstanceViewSet,
                    HistoryTaskInstanceViewSet,
                    ProcessInstanceVariablesViewSet,
                    RuntimeProcessInstanceViewSet, TaskActionUpdateViewSet,
                    GroupTaskViewSet,
                    TaskViewSet, ProcessInstanceDeleteViewset, TaskVariableUpdateViewSet,
                    OpenInitiationViewSet, EntityAuditLogViewSet, TaskIdentityViewSet, AllTaskViewSet, ProcessDetailViewSet)

router = DefaultRouter(trailing_slash=False)

app_name="proxy_bpm"
# router.register(r'process-instances', ProcessInstanceViewSet, basename='process_instances')

router.register('open', OpenInitiationViewSet, basename='open_initiation')
router.register('tasks/', TaskViewSet, basename='tasks')
router.register('group-tasks/', GroupTaskViewSet, basename='group_tasks')
router.register('task/instance', RuntimeTaskInstanceViewSet, basename='tasks_instance')
router.register('history/historic-task-instances', HistoryTaskInstanceViewSet, basename='history_task_instances')
router.register('process-instances', RuntimeProcessInstanceViewSet, basename='pi_runtime')
router.register('history/historic-process-instances', HistoryProcessInstanceViewSet, basename='history_pi')
router.register('process-instances/delete', ProcessInstanceViewSet, basename='process_instances_del')
router.register('query/process', BPMQueryViewSet, basename='query_bpm')
router.register('process-instances/variables', ProcessInstanceVariablesViewSet, basename='process_instance_variables')
router.register('history/historic-activity-instances', EntityAuditLogViewSet, basename='add_entity_audit')

urlpatterns = [
    url('^process-details/', ProcessDetailViewSet.as_view({'post': 'post'}), name="process_details"),
    url('^task/variables/(?P<pi_id>[0-9A-Fa-f-]+)',
        TaskVariableUpdateViewSet.as_view({'put' : 'put'}), name="tasks_variable_update"),
    url('^tasks/(?P<task_id>[0-9A-Fa-f-]+)',
        TaskActionUpdateViewSet.as_view({'put': 'put','post': 'post'}), name="tasks_update"),
    url('^all-tasks/',
        AllTaskViewSet.as_view({'post': 'post'}), name="all_tasks"),
    url('^history/historic-process-instance/(?P<pi_id>[0-9A-Fa-f-]+)/delete',
        ProcessInstanceDeleteViewset.as_view({'delete': 'delete'}), name="process_delete"),
    url('^task/(?P<ti_id>[0-9A-Fa-f-]+)/identity',
        TaskIdentityViewSet.as_view({'get': 'list'}), name="tasks_identity"),
] + router.urls
