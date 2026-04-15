import os
import xlsxwriter

from django.utils import timezone
from django.db import connection
from django.db.models import Q
from celery.utils.log import get_task_logger

from apps.organisations.models import OrganisationLicense
from apps.org_config.models import ReportTemplate
from apps.org_users.utils import send_scheduled_report
from apps.organisations.models import ScheduledReport, Organisation
from apps.org_apps.utils import create_report

logger = get_task_logger(__name__)

COMPARISION = {
    "EQUALS": "equals",
    "NOT_EQUALS": "notEquals",
    "NOT_EQUALS_IGNORE_CASE": "notEqualsIgnoreCase",
    "EQUALS_IGNORE_CASE": "equalsIgnoreCase",
    "GREATER_THAN": "greaterThan",
    "GREATER_THAN_OR_EQUALS": "greaterThanOrEquals",
    "LESS_THAN": "lessThan",
    "LESS_THAN_OR_EQUALS": "lessThanOrEquals",
    "LIKE": "like",
    "LIKE_IGNORE_CASE": "likeIgnoreCase"
}

def schedule_report_and_email():
    current_time = timezone.now()
    from .utils import get_report_data
    from apps.org_group.models import OrganisationGroup
    try:
        scheduled_reports = ScheduledReport.objects.filter(Q(next_run_at__lt = current_time) & Q(start_date__lt = current_time) & Q(end_date__gt = current_time))
        for scheduled_report in scheduled_reports:
            schema_name= 'ezedox_' + scheduled_report.tenant_name
            tenant = Organisation.objects.get(schema_name=schema_name)
            connection.set_tenant(tenant)
            report_recipients = []
            recipients_group = []
            recipients = []
            if scheduled_report.stop_scheduling == False:
                if scheduled_report.report_recipients:
                    report_recipients = scheduled_report.report_recipients.split(",")
                if scheduled_report.recipients_group:
                    recipients_group = scheduled_report.recipients_group.split(",")
                recipients += report_recipients
                if len(recipients_group) != 0:
                    for group in recipients_group:
                        try:
                            group_obj = OrganisationGroup.objects.get(name = group)
                            email_list = group_obj.users.all().values_list('email', flat=True)
                            for email in list(email_list):
                                recipients.append(email)
                        except Exception as e:
                            logger.exception(e)
                report_id = scheduled_report.report_template_id
                report_template = ReportTemplate.objects.get(id = report_id)
                report_type = report_template.report_type
                query = report_template.query
                #Generating dynamic Queries
                if report_type < 4:
                    started_after = scheduled_report.last_run_at.strftime("%Y-%m-%dT%H:%M:%SZ")
                    finished_before = scheduled_report.next_run_at.strftime("%Y-%m-%dT%H:%M:%SZ")
                    if report_template.process_type == "ONGOING":
                        start_query_obj ={}
                        start_query_obj["type"] = "common"
                        start_query_obj["comparision"] = "EQUALS"
                        start_query_obj["attribute"] = "startedAfter"
                        start_query_obj["value"] = started_after
                        query['query'].append(start_query_obj)
                    elif report_template.process_type == "COMPLETED" or report_template.process_type == "WITHDRAWN":
                        finished_query_obj = {}
                        finished_query_obj["type"] = "common"
                        finished_query_obj["comparision"] = "EQUALS"
                        finished_query_obj["attribute"] = "finishedAfter"
                        finished_query_obj["value"] = started_after
                        query['query'].append(finished_query_obj)
                        finished_query_obj = {}
                        finished_query_obj["type"] = "common"
                        finished_query_obj["comparision"] = "EQUALS"
                        finished_query_obj["attribute"] = "finishedBefore"
                        finished_query_obj["value"] = finished_before
                        query['query'].append(finished_query_obj)
                    else:
                        start_query_obj ={}
                        start_query_obj["type"] = "common"
                        start_query_obj["comparision"] = "EQUALS"
                        start_query_obj["attribute"] = "startedAfter"
                        start_query_obj["value"] = started_after
                        query['query'].append(start_query_obj)
                        finished_query_obj = {}
                        finished_query_obj["type"] = "common"
                        finished_query_obj["comparision"] = "EQUALS"
                        finished_query_obj["attribute"] = "finishedAfter"
                        finished_query_obj["value"] = started_after
                        query['query'].append(finished_query_obj)
                        finished_query_obj = {}
                        finished_query_obj["type"] = "common"
                        finished_query_obj["comparision"] = "EQUALS"
                        finished_query_obj["attribute"] = "finishedBefore"
                        finished_query_obj["value"] = finished_before
                        query['query'].append(finished_query_obj)
                #Generated
                selected_fields = report_template.selected_fields
                tenant = connection.get_tenant()
                engine_url = OrganisationLicense.objects.get(
                    organisation=tenant).processengine
                tenant_id = tenant.id
                request_body = get_report_data(query, selected_fields, engine_url, tenant_id, report_template.apps.process_key, COMPARISION)
                attachment_path = os.path.join(os.path.dirname(
                    __file__), 'Report.xlsx')
                workbook = xlsxwriter.Workbook(attachment_path)
                create_report(workbook, request_body)
                workbook.close()
                send_scheduled_report(recipients, attachment_path, report_template.name)
                logger.info("Report named {} send to {} at {}".format(report_template.name,recipients,scheduled_report.next_run_at.strftime("%Y-%m-%dT%H:%M:%SZ")))
                os.remove(attachment_path)
                scheduled_report.save()
    except Exception as e:
        logger.exception(e)
        