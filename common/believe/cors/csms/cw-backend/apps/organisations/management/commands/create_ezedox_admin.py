# coding=utf-8

import os

from django.core.management import BaseCommand

from apps.user.models import User
from apps.organisations.models import Organisation


class Command(BaseCommand):
    help = "Create ezeDox Administrator"

    def handle(self, *args, **options):
        try:
            if not User.objects.all():
                username = os.environ.get('EZEDOX_ADMIN_USERNAME', 'ezedox_admin@ezedox.com')
                password = os.environ.get('EZEDOX_ADMIN_PASSWORD', '3Y10aJs3dj32O6K9p2')
                admin = User.objects.create(email=username, is_staff=True, is_superuser=True, tenant=None, userId=username)
                admin.set_password(password)
                admin.save()
                print("ezeDox administrator created successfully with following credentials.\nUsername: ezedox_admin@ezedox.com\nPassword: {}".format(password))
            else:
                print("ezeDox administrator is already created")
        except Exception as e:
            print(
                "Unexpected error occurred while creating ezeDox administrator :  {0}".format(e))
