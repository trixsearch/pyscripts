import boto3

from ezedox.settings import AWS_S3_REGION_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_STORAGE_BUCKET_NAME
from utils.loggerwrapper import Logger
logger = Logger(__name__)

def load_file(file_upload):
    s3 = boto3.resource('s3')
    new_file_key = file_upload.file.name
    logger.info(f"loading file {new_file_key}")
    return s3.Object(file_upload.aws_bucket, new_file_key).load()
    
def delete_file(aws_bucket, file_path):
    s3 = boto3.resource('s3')
    logger.info(f"loading file {file_path}")
    s3.Object(aws_bucket, file_path).delete()

def copy_file(file_upload, bucket_name, new_key, copy_source=None):
    s3 = boto3.resource('s3')
    if file_upload:
        copy_source = file_upload.aws_bucket + '/files/' + file_upload.file.name
        bucket_name = file_upload.aws_bucket
    s3.Object(bucket_name, 'files/' + new_key)\
        .copy_from(CopySource=copy_source)

def get_presigned_url(file_upload):
    session = boto3.session.Session(region_name=AWS_S3_REGION_NAME)
    s3client = session.client('s3', aws_access_key_id=AWS_ACCESS_KEY_ID,
                                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                                config=boto3.session.Config(signature_version='s3v4'))
    report_link = s3client.generate_presigned_url('get_object', {'Bucket': AWS_STORAGE_BUCKET_NAME,
                                                                    'Key': "files/" + file_upload.file.name}, 86400)
    return report_link
    
def get_presigned_url_by_path(file_path , bucket_name):
    session = boto3.session.Session(region_name=AWS_S3_REGION_NAME)
    s3client = session.client('s3', aws_access_key_id=AWS_ACCESS_KEY_ID,
                                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                                config=boto3.session.Config(signature_version='s3v4'))
    report_link = s3client.generate_presigned_url('get_object', {'Bucket': bucket_name,
                                                                    'Key': file_path}, 86400)
    return report_link

def replace_file(old_file,new_file):
    s3 = boto3.client('s3')
    s3.put_object(
        Body=new_file,
        Bucket=old_file.aws_bucket,
        Key=old_file.file.name
        )
