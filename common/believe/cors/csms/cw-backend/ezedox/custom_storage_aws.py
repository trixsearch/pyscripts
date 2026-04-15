from storages.backends.s3boto3 import S3Boto3Storage
from storages.backends.azure_storage import AzureStorage
from django.core.files.storage import FileSystemStorage
from ezedox.settings import AWS_HIRE_STORAGE_BUCKET_NAME, AWS_STORAGE_BUCKET_NAME, AZURE_CONTAINER, FILE_BUCKET
from urllib.request import urlopen

class S3FileStorage(S3Boto3Storage, FileSystemStorage):
    location = ''
    file_overwrite = True

    def __init__(self, bucket_name=AWS_STORAGE_BUCKET_NAME):
        super().__init__()
        self.bucket_name = bucket_name

class S3OtherFileStorage(S3Boto3Storage, FileSystemStorage):
    location = 'files'
    file_overwrite = True
    bucket_name = AWS_HIRE_STORAGE_BUCKET_NAME

class S3staticFileStorage(S3Boto3Storage, FileSystemStorage):
    location = 'bc_static'
    file_overwrite = True
    bucket_name = AWS_HIRE_STORAGE_BUCKET_NAME

FileStorage = S3FileStorage
OtherFileStorage = S3OtherFileStorage

def read_file(obj):
    if FILE_BUCKET == 'S3':
        return obj.file.read()
    else:
        return urlopen(obj.file.url).read()

def read_sample_bulk_file(obj):
    if FILE_BUCKET == 'S3':
        return obj.bulk_sample_url.read()
    else:
        return urlopen(obj.bulk_sample_url.url).read()