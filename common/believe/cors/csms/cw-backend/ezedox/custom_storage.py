from django.core.files.storage import FileSystemStorage
from ezedox.settings import AZURE_CONTAINER, AZURE_URL_EXPIRATION_SECS
from urllib.request import urlopen
from storages.backends.azure_storage import AzureStorage
from utils.storage_utils import get_presigned_url_by_path
class AzureFileStorage(AzureStorage, FileSystemStorage):
    location = ''
    file_overwrite = True
    expiration_secs = AZURE_URL_EXPIRATION_SECS
    def __init__(self, bucket_name=AZURE_CONTAINER):
        super().__init__()
        self.azure_container = bucket_name

class AzureOtherFileStorage(AzureStorage):
    location = 'files'
    file_overwrite = True
    expiration_secs = AZURE_URL_EXPIRATION_SECS
    bucket_name = AZURE_CONTAINER

class AzurestaticFileStorage(AzureStorage, FileSystemStorage):
    location = 'bc_static'
    file_overwrite = True
    expiration_secs = AZURE_URL_EXPIRATION_SECS
    bucket_name = AZURE_CONTAINER

FileStorage = AzureFileStorage
OtherFileStorage = AzureOtherFileStorage

def read_file(obj):
    return urlopen(get_presigned_url_by_path(obj.file.name, obj.aws_bucket)).read()

def read_sample_bulk_file(obj):
    return urlopen(get_presigned_url_by_path(obj.bulk_sample_url.name, AZURE_CONTAINER)).read()