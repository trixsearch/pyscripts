from django.urls import path

from . import views

urlpatterns = [
    path('', views.MyView.as_view(), name='index'),
    path('deadletterJobs', views.DeadLetterJobsView.as_view(), name='deadletterJobs'),
    path('result', views.Result.as_view(), name='Result'),
    path('search-result', views.SearchResult.as_view(), name='SearchResult'),
    path('search-task', views.SearchTaskResult.as_view(), name='SearchTaskResult'),
    path('identity-link', views.IdentityLinkResult.as_view(), name='IdentityLinkResult'),
    path('job/dead_letter/<str:data_type>/<str:process_id>/<str:tenant_id>/<str:job_id>/', views.DeadLetterJobs.as_view(), name='DeadLetterJobs'),
    path('job/dead_letter/move_all/', views.MoveAllDeadLetterJobs.as_view(), name='DeadLetterJobs'),
    path('job/suspended/<str:data_type>/<str:process_id>/<str:tenant_id>/<str:job_id>/', views.SuspendedJobs.as_view(), name='SuspendedJobs'),
    path('job/timer/<str:data_type>/<str:process_id>/<str:tenant_id>/<str:job_id>/', views.TimerJobs.as_view(), name='TimerJobs'),
    path('tasks/update/<str:data_type>/<str:process_id>/<str:tenant_id>/<str:task_id>/', views.TaskUpdate.as_view(), name='TaskUpdate'),
    path('identityLink/add/<str:data_type>/<str:process_id>/<str:tenant_id>/', views.AddIdentityLink.as_view(), name='AddIdentityLink'),
    path('add/<str:process_id>/<str:data_type>/<str:tenant_id>/', views.AddProcessVariables.as_view(), name='AddProcessVariables'),
    path('identityLink/delete/<str:data_type>/<str:process_id>/<str:tenant_id>/<str:user>/<str:user_type>/', views.DeleteIdentityLink.as_view(), name='DeleteIdentityLink'),
    path('processVariable/add/<str:data_type>/<str:process_id>/<str:tenant_id>/', views.AddProcessVariables.as_view(), name='AddProcessVariables'),
    path('processVariable/update/<str:data_type>/<str:process_id>/<str:tenant_id>/<str:variable_name>/', views.UpadateProcessVariables.as_view(), name='UpadateProcessVariables'),
    path('processVariable/delete/<str:data_type>/<str:process_id>/<str:tenant_id>/<str:variable_name>/', views.DeleteProcessVariables.as_view(), name='DeleteProcessVariables'),
    path('processVariable/add_bulk/<str:data_type>/<str:process_id>/<str:tenant_id>/', views.AddBulkProcessVariables.as_view(), name='AddBulkProcessVariables'),
]
