from django.db import connection
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model
from apps.org_apps.models import OrganisationWorkflow,ProcessView
from django.contrib.auth.models import Group

class Command(BaseCommand):
    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        ProcessView.objects.all().delete()
                        workflow_data = OrganisationWorkflow.objects.all()
                        role_data = Group.objects.all()
                        if workflow_data.exists():
                            for workflow in workflow_data:
                                selected_forms_keys = []
                                selected_form_fields_keys = []
                                if workflow.selected_forms:
                                    for selected_forms in workflow.selected_forms:
                                        if workflow.selected_forms[selected_forms]:
                                                selected_forms_keys.append(selected_forms)
                                if workflow.selected_form_fields:
                                    for sel_form_fields in workflow.selected_form_fields:
                                        key = sel_form_fields
                                        value = workflow.selected_form_fields[key]
                                        selected_form_fields_keys.append({key:value})
                                workflow_id = str(workflow.id)
                                if selected_forms_keys or selected_form_fields_keys:
                                    post_data = {}
                                    post_data['app'] = workflow
                                    post_data['selected_forms'] = selected_forms_keys
                                    post_data['selected_form_fields'] = selected_form_fields_keys
                                    if role_data:
                                        for role in role_data:
                                            post_data['role'] = role
                                            try:
                                                obj = ProcessView.objects.create(**post_data)
                                            except Exception as e:
                                                print("\n \nFailed to create role base process view in tenant {}. due to {}".format(i,str(e)))
                    except Exception as e:
                        print("\n \nFailed to create role base process view in tenant {}. due to {}".format(i,str(e)))                    
        except Exception as e:
            print("Failed  {}".format(str(e)))