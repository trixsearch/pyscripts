from django.core.management.base import BaseCommand
from django.db import connection
from utils.utils import get_tenant_model

from apps.org_form.models import OrganisationFile

class Command(BaseCommand):
    help='Update existing files with Uploaded & Generated tag'

    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        file_queryset = OrganisationFile.objects.all()
                        if file_queryset.exists():
                            for file_query in file_queryset:
                                if file_query.doc_type == 'TASK_RELATED_DOCUMENTS' or file_query.doc_type == 'UPLOADED_DOCUMENTS':
                                    file_query.tags.add('Uploaded')
                                else:
                                    file_query.tags.add('Generated')
                            print("Files updated with tags in tenant {}".format(i))
                        else:
                            print("No file exists in this tenant")
                    except Exception as error:
                        print(str(error))
        except Exception as error:
            print("Unexpected error occcured - {0}".format(error))
