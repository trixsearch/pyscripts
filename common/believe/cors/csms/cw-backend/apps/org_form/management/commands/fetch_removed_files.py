from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import connection
from tenant_schemas.utils import get_tenant_model

from apps.org_form.models import OrganisationFile
from utils import storage_utils


class Command(BaseCommand):
    help = "To fetch file id of missing s3 file url"

    def handle(self, *args, **options):
        try:
            start_time = datetime.now()
            connection.set_schema_to_public()
            f = open("logs/files_log.txt", "w+")
            for i in get_tenant_model().objects.all():
                
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        tenant_name = i.schema_name.split('_')[-1]
                        print("Checking files from tenant {}".format(tenant_name))
                        file_queryset = OrganisationFile.objects.all()
                        f.write("Files with unset process Instance id(s) \n")
                        for file_obj in file_queryset:
                            pid = file_obj.process_instance_id
                            if pid is not None:
                                try:
                                    storage_utils.load_file(file_obj)
                                except Exception as error:
                                    if error.response['Error']['Code'] == "404":
                                        print("File with id {}, name {} and type {} is missing in s3 bucket with process_instance_id {}".format(file_obj.id, file_obj.name, file_obj.doc_type, file_obj.process_instance_id))
                                        f.write("File with id {},name {} and type {} is missing in s3 bucket with process_instance_id {}".format(file_obj.id, file_obj.name, file_obj.doc_type, file_obj.process_instance_id))
                                    else:
                                        print("Unexpected error occured - {}".format())
                            else:
                                    f.write("File id {} and type {} and tenant {}\n".format(file_obj.id,file_obj.doc_type, tenant_name))
                    except Exception as error:
                        print("Error happened while setting tenant {}".format(error))
            f.close()
            print(datetime.now() - start_time)
        except Exception as error:
            print("Unexpected error occured - {0}".format(error))