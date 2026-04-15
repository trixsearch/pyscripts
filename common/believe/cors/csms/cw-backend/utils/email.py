import os
import uuid
import shutil

from PIL import Image, ExifTags
import requests

from django.conf import settings
from django.utils.translation import gettext as _
from django.core.mail import EmailMessage ,EmailMultiAlternatives
from django.core.mail.backends.smtp import EmailBackend
from rest_framework import status
from rest_framework.response import Response

from apps.org_config.models import SMTPSettings  , EmailIdentity
from utils.cipher import AESCipher
from utils.loggerwrapper import Logger
from ezedox.celery import app
# for attachments

logger = Logger(__name__)
cipher_obj = AESCipher()

@app.task(name="ezedox_send_mail")
def ezedox_send_mail(subject,message,recipient_list, type,
        text_content,html_content, cc_recipient_list=[],bcc_recipient_list=[],
        attachment_path=None, attachmentUrl=None, mimetype=None, tenant_mail=False):
    # email_type is used diffrence the normal email or EmailMultiAlternatives
    # normal: for the simple mail to send
    # mutli : for the html and context rendering
    if tenant_mail:
        smtp_data = SMTPSettings.objects.all().first()
        ses_data=  EmailIdentity.objects.all().first()
        if attachment_path:
            file_name = os.path.basename(attachment_path)
            data = open(attachment_path, 'rb').read()
        folder = ''
    try:
        if attachmentUrl:
            attachments=''
            attachmentList=[]
            for url in attachmentUrl:
                folder, attachments = download_file(url, folder)
                attachmentList.append(attachments)

        if tenant_mail and ses_data and ses_data.is_service_active:
            from_email =ses_data.email
            if type == "normal":
                mail = EmailMessage(
                        subject=subject,
                        body=message,
                        from_email=from_email,
                        to=recipient_list,
                        cc=cc_recipient_list,
                        bcc=bcc_recipient_list,
                    )
                mail.content_subtype = "html"
                if attachmentUrl:
                    for attachment in attachmentList:
                        mail.attach_file(attachment)
                if mail.send():
                    context = {
                        "success": True, "message": _("Organisation Email send successfully.")}
                    logger.info("Organisation Email send successfully.")
                else:
                    context = {
                        "success": True, "message": _("Email sending Failed .")}
                    logger.error("Email sending Failed.")
            else:
                email = EmailMultiAlternatives(
                    subject =subject,
                    body =text_content,
                    from_email =from_email,
                    to=recipient_list,
                    cc=cc_recipient_list,
                    bcc=bcc_recipient_list,
                )
                if attachment_path:
                    email.attach(file_name, data, mimetype=mimetype)
                email.attach_alternative(html_content, "text/html")
                if attachmentUrl:
                    for attachment in attachmentList:
                        email.attach_file(attachment)
                email.send()
                logger.info("Organisation Email send successfully.")

        elif tenant_mail and smtp_data and smtp_data.is_service_active:
            password=cipher_obj.decrypt(smtp_data.password)
            email=cipher_obj.decrypt(smtp_data.email)

            connection = EmailBackend(
                            host=smtp_data.host,
                            port=smtp_data.port,
                            username=smtp_data.username,
                            password=password,
                            use_tls= True if smtp_data.encryption == 1 else False,
                            use_ssl=True if smtp_data.encryption == 2  else False,
                            fail_silently=False
                        )
            if type == "normal":
                from_email = smtp_data.host
                mail = EmailMessage(subject=subject,
                                    body=message,
                                    from_email=email,
                                    to=recipient_list,
                                    cc=cc_recipient_list,
                                    bcc=bcc_recipient_list,
                                    connection=connection)
                mail.content_subtype = "html"
                if attachmentUrl:
                    for attachment in attachmentList:
                        mail.attach_file(attachment)
                if mail.send():
                    context = {
                        "success": True, "message": _("Organisation Email send successfully.")}
                    logger.info(context)
                else:
                    context = {
                        "success": True, "message": _("Email sending Failed .")}
                    logger.info(context)
            else:
                email = EmailMultiAlternatives(
                        subject=subject,
                        body=text_content,
                        from_email=email,
                        to=recipient_list,
                        connection =connection,
                        cc=cc_recipient_list,
                        bcc=bcc_recipient_list,
                    )
                if attachment_path:
                    email.attach(file_name, data, mimetype=mimetype)
                email.attach_alternative(html_content, "text/html")
                if attachmentUrl:
                    for attachment in attachmentList:
                        email.attach_file(attachment)
                email.send()
                logger.info("Organisation Email send successfully.")
        else:
            from_email = settings.EMAIL_HOST_USER
            if type == "normal":
                mail = EmailMessage(
                        subject=subject,
                        body=message,
                        from_email=from_email,
                        to=recipient_list,
                        cc=cc_recipient_list,
                        bcc=bcc_recipient_list,
                    )
                mail.content_subtype = "html"
                if attachmentUrl:
                    for attachment in attachmentList:
                        mail.attach_file(attachment)
                if mail.send():
                    context = {
                        "success": True, "message": _("Organisation Email send successfully.")}
                    logger.info("Organisation Email send successfully.")
                else:
                    context = {
                        "success": True, "message": _("Email sending Failed .")}
                    logger.info("Email sending Failed.")
            else:
                email = EmailMultiAlternatives(
                        subject= subject,
                        body=text_content,
                        from_email =from_email,
                        to=recipient_list,
                        cc=cc_recipient_list,
                        bcc=bcc_recipient_list,
                    )
                if attachment_path:
                    email.attach(file_name, data, mimetype=mimetype)
                email.attach_alternative(html_content, "text/html")
                if attachmentUrl:
                    for attachment in attachmentList:
                        email.attach_file(attachment)
                email.send()
                logger.info("Organisation Email send successfully.")

    except Exception as error:
        logger.exception("Email Sending Failed, Exception:{}. ".format(error))
        context = {'error': str(error), "success": False, "message": _(
            "Email Sending Failed.")}
        return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if attachmentUrl:
            delete_folder(folder)

def download_file(url, folder=''):
    if not folder:
        folder = str(uuid.uuid4())
    fname = ""
    content_type = ""
    try:
        if url.endswith("/"):
            url = url[:-1]
        r = requests.get(url)
        content_type = r.headers["Content-Type"]
        if 'image' in content_type:
            fname = "/tmp/" + folder + "/" + url.split("/")[-1] + ".jpg"
        elif 'pdf' in content_type:
            fname = "/tmp/" + folder + "/" + url.split("/")[-1] + ".pdf"
        else:
            logger.error("Unsupported Filetype :" + content_type + " For: " + url)
            return False, folder, fname, content_type
            #throw exception
        os.makedirs(os.path.dirname(fname), exist_ok=True)
        logger.info("File download : {}".format(fname))
        open(fname , 'wb').write(r.content)
        if 'image' in content_type:
            try:
                logger.info("Starting EXIF processing")
                image=Image.open(fname)
                for orientation in ExifTags.TAGS.keys():
                    if ExifTags.TAGS[orientation]=='Orientation':
                        break
                exif=dict(image._getexif().items())
                if exif[orientation] == 3:
                    image=image.rotate(180, expand=True)
                elif exif[orientation] == 6:
                    image=image.rotate(270, expand=True)
                elif exif[orientation] == 8:
                    image=image.rotate(90, expand=True)
                image.save(fname)
                logger.info("Done EXIF processing")
            except Exception as err:
                logger.error(str(err))
            finally:
                image.close()

        return folder, fname
    except Exception as err:

        error = 'Error while downloading and processing file from url {} . Reason: '.format(url) + str(err)
        logger.error(error)
        return False, folder, fname


def delete_folder(folder_name):
    try:
        folder = '/tmp/'+folder_name
        shutil.rmtree(folder)
        logger.debug("Folder Removed: {}".format(folder))
    except Exception as err:
        error = 'Folder {} Deleting Failed. Reason: '.format(folder_name) + str(err)
        logger.error(error)
