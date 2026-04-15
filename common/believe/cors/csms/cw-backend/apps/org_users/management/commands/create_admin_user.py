import json
import base64
import requests

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from utils.utils import get_tenant_model
from django.contrib.auth.models import  Group 
from apps.organisations.models import Organisation, OrganisationLicense, Domain
from apps.org_users.models import OrganisationUser , InternalUser

from apps.org_apps.utils_urls import (ADD_PRIVILEGES, CREATE_USER, DELETE_USER,
                                      GET_PRIVILEGES, GET_USER )
from ezedox.settings import (PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_USER,
                             PROCESS_ENGINE_USERPASSWORD_SALT)
from apps.org_users.utils import (get_tenant, password_hash)

class Command(BaseCommand):
    help="To create a user to give modeller access"
    
    def get_tenant_obj(self, model, hostname):
        return Domain.objects.get(domain=hostname).tenant

    def get_domain(self, domain_url):
        return domain_url.split(".")[0]

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str)
        parser.add_argument('--password', type=str)
        parser.add_argument('--domain', type=str)
        parser.add_argument('--firstName', type=str)
        parser.add_argument('--lastName', type=str)
        parser.add_argument('--type', type=str)

    def handle(self, *args, **options):
        try:
            if options['domain'] == None:
                raise CommandError(
                    "Option `--domain=<your_organisation_domain>` must be specified.")

            if options['email'] == None:
                raise CommandError(
                    "Option `--email=<your_email_id>` must be specified.")

            if options['password'] == None:
                raise CommandError(
                    "Option `--password=<your_password>` must be specified.")
            
            if options['firstName'] == None:
                raise CommandError(
                    "Option `--firstName=<firstName>` must be specified.")

            if options['lastName'] == None:
                raise CommandError(
                    "Option `--lastName=<lastName>` must be specified.")

            if options['type'] == None:
                raise CommandError(
                    "Option `--type=<type>` must be specified.")
            
            connection.set_schema_to_public()
            hostname = options['domain']
            TenantModel = get_tenant_model()

            try:
                # get_tenant_obj must be implemented by extending this class.
                tenant_obj = self.get_tenant_obj(TenantModel, hostname)
                assert isinstance(tenant_obj, TenantModel)
            except TenantModel.DoesNotExist:
                print("\nNo tenant for : {}\n".format(hostname))
                exit()
            except AssertionError:
                print("\nInvalid Tenant : {}\n".format(hostname))
                exit()
    
            connection.set_tenant(tenant_obj)


            try:
                engine_url = OrganisationLicense.objects.get(organisation=tenant_obj)
                tenant =self.get_domain(Domain.objects.get(tenant=tenant_obj).domain)
                previlege_url = GET_PRIVILEGES.format(engine_url.processengine)
                action = requests.get(previlege_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD))
                for privilege in action.json()["data"]:
                    if privilege["name"] == "access-modeler":
                        privilege_id = privilege["id"]
                        break
                user_id = tenant + "_" + options['email']
                user_id = base64.b64encode(bytes(user_id, 'utf-8')).decode("utf-8")
                ezedox_email = "ezedox_" + options['email']
               

            except Exception as error:
                print("Unexpected error occcured - {0}".format(error))

            if  options['type'] == 'add' :
                  #write a code to create user
                user_obj = OrganisationUser.objects.create(
                    first_name=options['firstName'],
                    last_name =options['lastName'],
                    email=options['email'],
                    is_active=True,
                    email_verified=True,
                )
                user_obj.set_password(options['password'])
                user_obj.save()
                modeller_role = Group.objects.get(name='Modeller Administrator')
                user_obj.groups.add(modeller_role)
                # userId encoding
                ezedox_admin_obj = InternalUser.objects.create_superuser(email=ezedox_email,password=options['password'])

                req_body = {}
                req_body["id"] = user_id
                req_body["firstName"] = user_obj.first_name
                req_body["lastName"] = user_obj.last_name
                req_body["displayName"] = user_obj.first_name + " " + user_obj.last_name
                req_body["email"] = user_obj.email
                req_body["tenantId"] = tenant
                req_body["password"] = password_hash(user_obj.email)
                
                create_user_url = CREATE_USER.format(engine_url.processengine)
                action = requests.post(create_user_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), data=json.dumps(req_body), headers={'Content-Type': "application/json"})      
                add_previlege_url = ADD_PRIVILEGES.format(engine_url.processengine, privilege_id)
                req_body = {}
                req_body["userId"] = user_id
                action = requests.post(add_previlege_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), data=json.dumps(req_body), headers={'Content-Type': "application/json"})            
                print("Organisation User creation Done successfully Email: {} Password: {}".format(options['email'], options['password']))
                print("Django Admin User Email: ezedox_{} Password: {}".format(options['email'], options['password']))
                
            else : 
                user_obj = OrganisationUser.objects.get(email=options['email'])
                user_obj.erase()
                ezedox_admin_obj=InternalUser.objects.get(email=ezedox_email)
                ezedox_admin_obj.delete()
                url = DELETE_USER.format(engine_url.processengine, user_id)
                action = requests.delete(url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers={'Content-Type': "application/json"})
                print("User deleted successfully")
          
        except Exception as error:
            print("Unexpected error occcured - {0}".format(error))