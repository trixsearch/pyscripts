# coding=utf-8

import base64
import os

from django.contrib.auth import authenticate
from django.core.management import BaseCommand, CommandError
from django.db import connection
from utils.utils import get_tenant_model
from rest_framework_jwt.utils import jwt_encode_handler, jwt_payload_handler
from apps.org_users.utils import password_hash

class Command(BaseCommand):
    help = "Generate designer credentials"

    def get_tenant_obj(self, model, hostname):
        return model.objects.get(domain_url=hostname)

    def get_domain(self, domain_url):
        return domain_url.split(".")[0]

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str)
        parser.add_argument('--password', type=str)
        parser.add_argument('--domain', type=str)

    def handle(self, *args, **options):
        try:
            if options['domain'] is None:
                raise CommandError(
                    "Option `--domain=<your_organisation_domain>` must be specified.")

            if options['email'] is None:
                raise CommandError(
                    "Option `--email=<your_email_id>` must be specified.")

            if options['password'] is None:
                raise CommandError(
                    "Option `--password=<your_password>` must be specified.")

            # Connection needs first to be at the public schema, as this is where
            # the tenant metadata is stored.
            connection.set_schema_to_public()

            hostname = options['domain']
            TenantModel = get_tenant_model()

            try:
                # get_tenant_obj must be implemented by extending this class.
                tenant = self.get_tenant_obj(TenantModel, hostname)
                assert isinstance(tenant, TenantModel)
            except TenantModel.DoesNotExist:
                print("\nNo tenant for : {}\n".format(hostname))
                exit()
            except AssertionError:
                print("\nInvalid Tenant : {}\n".format(hostname))
                exit()

            connection.set_tenant(tenant)
            user_id = self.get_domain(
                tenant.domain_url) + "_" + options['email']
            hashed_password = password_hash(options['email'])
            username = base64.b64encode(
                bytes(user_id, 'utf-8')).decode("utf-8")

            user = authenticate(
                username=options['email'], password=options['password'])
            if not user:
                print('\nInvalid Login Credentials\n')
                exit()

            payload = jwt_payload_handler(user)
            token = jwt_encode_handler(payload)

            print(
                "***********************\nDesigner credentials\n***********************\n")
            base_org_domain_url = os.environ.get(
                'BASE_ORG_DOMAIN_URL', 'codzelocal.com')
            designer_login_url = 'https://{}/designer'.format(
                base_org_domain_url)
            print("Login URL : {}\n".format(designer_login_url))
            print("Username: {0}\nPassword: {1}\n".format(
                username, hashed_password))

            print(
                "Designer URL : https://{0}/designer/?token={1}&url=https://{2}/org/workflows\n\n".format(base_org_domain_url, token, options['domain']))
        except Exception as e:
            print(
                "Unexpected error occurred while generating designer credentials - {0}".format(e))
