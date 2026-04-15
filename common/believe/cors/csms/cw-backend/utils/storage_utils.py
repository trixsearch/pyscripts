import requests
from ezedox.settings import AZURE_ACCOUNT_NAME, AZURE_ACCOUNT_KEY, AZURE_CONTAINER
from utils.loggerwrapper import Logger
from datetime import datetime, timedelta
logger = Logger(__name__)
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlockBlobService
from azure.storage.blob.models import ContainerPermissions

default_credential = DefaultAzureCredential()

def load_file(file_upload):
    blobService = BlockBlobService(account_name=AZURE_ACCOUNT_NAME, account_key=AZURE_ACCOUNT_KEY)
    sas_token = blobService.generate_container_shared_access_signature(AZURE_CONTAINER, ContainerPermissions.READ, datetime.utcnow() + timedelta(hours=1))
    url = 'https://' + AZURE_ACCOUNT_NAME + '.blob.core.windows.net/' + AZURE_CONTAINER + '/'+file_upload.file.name+'?' + sas_token
    requests.get(url, stream=True)

def delete_file(aws_bucket, file_path):
    blobService = BlockBlobService(account_name=AZURE_ACCOUNT_NAME, account_key=AZURE_ACCOUNT_KEY)
    blobService.delete_blob(AZURE_CONTAINER, file_path)

def read_blob_content(blob_name):
    blobService = BlockBlobService(account_name=AZURE_ACCOUNT_NAME, account_key=AZURE_ACCOUNT_KEY)
    blob_data = blobService.get_blob_to_bytes(AZURE_CONTAINER, blob_name)
    return blob_data.content

def copy_file(file_upload, bucket_name, new_key, copy_source=None):
    blobService = BlockBlobService(account_name=AZURE_ACCOUNT_NAME, account_key=AZURE_ACCOUNT_KEY)
    blob_url = blobService.make_blob_url(file_upload.aws_bucket, '/files/' + file_upload.file.name)
    blobService.copy_blob(bucket_name, 'files/' + new_key, copy_source=blob_url)

def get_presigned_url(file_upload):
    blobService = BlockBlobService(account_name=AZURE_ACCOUNT_NAME, account_key=AZURE_ACCOUNT_KEY)
    sas_token = blobService.generate_container_shared_access_signature(AZURE_CONTAINER, ContainerPermissions.READ, datetime.utcnow() + timedelta(hours=2))
    url = 'https://' + AZURE_ACCOUNT_NAME + '.blob.core.windows.net/' +\
        AZURE_CONTAINER + '/'+file_upload.file.name+'?' + sas_token
    return url
    
def get_presigned_url_by_path(file_path , bucket_name):
    blobService = BlockBlobService(account_name=AZURE_ACCOUNT_NAME, account_key=AZURE_ACCOUNT_KEY)
    sas_token = blobService.generate_container_shared_access_signature(bucket_name, ContainerPermissions.READ, datetime.utcnow() + timedelta(hours=2))
    url = 'https://' + AZURE_ACCOUNT_NAME + '.blob.core.windows.net/' + bucket_name + '/'+file_path+'?' + sas_token
    return url

def replace_file(old_file,new_file):
    blobService = BlockBlobService(account_name=AZURE_ACCOUNT_NAME, account_key=AZURE_ACCOUNT_KEY)
    blobService.create_blob_from_stream(AZURE_CONTAINER,old_file.file.name, new_file)