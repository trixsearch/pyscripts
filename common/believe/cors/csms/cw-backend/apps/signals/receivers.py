import logging
import os
from ezedox.celery import app
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.template.loader import render_to_string

from apps.license.models import License
from apps.organisations.serializers import OrganisationLicenseSerializer, Organisation
from apps.user.models import User
from .signals import reset_password_email, invitation_email

logger = logging.getLogger(__name__)


@receiver(reset_password_email)
@receiver(invitation_email)
def email_handler(sender, **kwargs):
    logger.info("This will help us to send an email")

@receiver(post_save, sender=Organisation)
def tenant_setup(sender, instance, created, **kwargs):
    '''
    This function will run after the tenant is saved, its schema created and synced.
    '''
    if created:
        logger.info("**** New Organisation onboarding******")

        org_data = dict()
        org_data['process_idm'] = settings.PROCESS_IDM_URL
        org_data['processengine'] = settings.PROCESS_ENGINE_URL
        org_data['license'] = License.objects.filter(name='basic').first().id
        org_data['process_modeler'] = settings.PROCESS_MODELER_URL
        org_data['organisation'] = instance.id

        serializer = OrganisationLicenseSerializer(data=org_data)
        if serializer.is_valid(raise_exception=False):
            serializer.save()
            logger.info("Default license is attached to this organisation")
        else:
            logger.exception(serializer.errors)
        username =  str(instance.id) + "@ezedox.com"    
        admin = User.objects.create(email=username, is_staff=True, is_superuser=True, tenant=instance, userId=username)
        password = User.objects.make_random_password()
        admin.set_password(password)
        admin.save()
        text_content = 'Admin Activation Email'
        subject = 'Admin Activation Email'
        template_name = os.path.join(os.path.dirname(
            __file__), 'templates/send_admin_credentials.html')
        recipients = [settings.EZEDOX_INTERNAL_EMAIL]
        admin_url = "{0}://{1}{2}".format(settings.DEFAULT_SCHEME,
                                      settings.DJANGO_ADMIN_DOMAIN_URL, '/cw/admin/')
        context = {
            'admin_email': username,
            'admin_password': password,
            "admin_url": admin_url
        }
        html_content = render_to_string(template_name, context)
        message=""
        email_type  ="multi"
        #ezedox_send_mail(subject, message,recipients,email_type,text_content,html_content)
    else:
        pass