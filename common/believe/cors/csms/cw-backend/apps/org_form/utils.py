# Standard Library
import logging
from collections import OrderedDict
from rest_framework.response import Response
from rest_framework import status
from utils.constants import FORMIO_MAPPING
from utils.cache import set_cache, get_cache

logger = logging.getLogger(__name__)

class FileUploadTokenController:
    """
    Get the form components with tag
    """

    def __init__(self, form, transactionId):
        self.form = form
        self.transactionId = transactionId
        if not transactionId:
            self.transactionId = ''

    def parse_components(self, forms):
        for form in forms:
            if form['type'] == 'form':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'panel':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'container':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'datagrid':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'editgrid':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'tabs':
                for tabs in form["components"]:
                    tabs['components'] = self.parse_components(tabs['components'])
            elif form['type'] == 'columns':
                for col in form['columns']:
                    col['components'] = self.parse_components(col['components'])
            elif form['type'] == 'table':
                for row in form['rows']:
                    for col in row:
                        col['components'] = self.parse_components(col['components'])
            else:
                if form['type'] == 'file' and 'url' in form["storage"]:
                    form["url"] +="&transactionId="+ str(self.transactionId) + "&label=" + form["label"]
        return forms

    def get_components(self):
        self.form['components'] = self.parse_components(self.form['components'])
        return self.form

class FormPreviewController:
    """
    Get the form components with tag
    """
    def __init__(self, form):
        self.form = form

    def parse_components(self, forms):
        for form in forms:
            if form['type'] == 'form':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'panel':
                if  'breadcrumbClickable' in form and form['breadcrumbClickable'] == False:
                    form['breadcrumbClickable'] = True
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'container':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'datagrid':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'editgrid':
                form['components'] = self.parse_components(form['components'])
            elif form['type'] == 'tabs':
                for tabs in form["components"]:
                    tabs['components'] = self.parse_components(tabs['components'])
            elif form['type'] == 'columns':
                for col in form['columns']:
                    col['components'] = self.parse_components(col['components'])
            elif form['type'] == 'table':
                for row in form['rows']:
                    for col in row:
                        col['components'] = self.parse_components(col['components'])
            else:
                form['calculateValue'] = ""
                form['validate']= {"json": "","customMessage": ""}
                form['logic'] = []
                form['conditional'] = {"json": "", "show": "", "when": ""}
                if form['type'] == 'file':
                    form["hidden"] = True
                elif form['type'] == 'textfield' and 'widget' in form:
                    form["widget"]['maxDate'] = ""
                    form["widget"]['minDate'] = ""
                elif form['type'] == 'select':
                    form["template"] = ""
                    form['data'] = {"values" : [{"label" : "", "value":""}]}
        return forms

    def get_components(self):
        self.form['components'] = self.parse_components(self.form['components'])
        return self.form

class TypeExtractionController:

    def __init__(self, form):
        self.form = form
        self.structure = []

    def parse_components(self, forms):
        for form in forms:
            if form['type'] == 'form':
                self.parse_components(form['components'])
            elif form['type'] == 'panel':
                self.parse_components(form['components'])
            elif form['type'] == 'tabs':
                for tabs in form["components"]:
                    self.parse_components(tabs['components'])
            elif form['type'] == 'well':
                self.parse_components(form['components'])
            elif form['type'] == 'container':
                keytype_structure = {}
                keytype_structure["key"] = form['key']
                keytype_structure["type"] = "date"
                keytype_structure["label"] = form['label']
                keytype_structure["isHidden"] = form.get("hidden", False)
                keytype_structure["tableView"] = form['tableView']
                if 'required' in form['validate']:
                    keytype_structure["required"] = True
                else:
                    keytype_structure["required"] = False
                self.structure.append(keytype_structure)
                # self.parse_components(form['components'])
            elif form['type'] == 'columns':
                for col in form['columns']:
                    self.parse_components(col['components'])
            elif form['type'] == 'table':
                for row in form['rows']:
                    for col in row:
                        self.parse_components(col['components'])
            elif form['type'] == 'button':
                pass
            elif form['type'] == 'htmlelement':
                pass
            elif not form['input']:
                pass
            elif form['type'] == 'datetime':
                keytype_structure = {}
                keytype_structure["key"] = form['key']
                keytype_structure["type"] = "date"
                keytype_structure["label"] = form['label']
                keytype_structure["isHidden"] = form.get("hidden", False)
                keytype_structure["tableView"] = form['tableView']
                if 'required' in form['validate']:
                    keytype_structure["required"] = True
                else:
                    keytype_structure["required"] = False
                self.structure.append(keytype_structure)
            else:
                keytype_structure = {}
                keytype_structure["key"] = form['key']
                keytype_structure["type"] = form['type']
                keytype_structure["label"] = form['label']
                keytype_structure["isHidden"] = form.get("hidden", False)
                keytype_structure["tableView"] = form['tableView']
                if 'required' in form['validate']:
                    keytype_structure["required"] = True
                else:
                    keytype_structure["required"] = False

                self.structure.append(keytype_structure)

    def get_structure(self):
        self.parse_components(self.form["components"])
        return self.structure

def get_reporting_label(data):
    res = {}
    discarded_list = ["datagrid", "editgrid", "signature", "file"]
    for item in data:
        if item["tableView"] == True and item["type"] not in discarded_list and item["isHidden"] == False:
            res[item["key"]] = item["label"]
    return res

def get_label(data):
    res = OrderedDict()
    for item in data:
        res[item["key"]] = item["label"]
    return res

def get_nonhidden_label(data):
    res = OrderedDict()
    discarded_list = ["datagrid", "editgrid", "signature", "file", "signature"]
    for item in data:
        if item["isHidden"] == False and item["type"] not in discarded_list:
            res[item["key"]] = item["label"]
    return res

def get_file_label(data):
    res = {}
    for item in data:
        if item["type"] == "file":
            res[item["key"]] = item["label"]
    return res

def get_file_label_in_json(data):
    res = []
    for item in data:
        if item["type"] == "file":
            res.append({item["key"]:item["label"]})
    return res

def get_key_type(data):
    res = {}
    for item in data:
        res[item["key"]] = item["type"]
    return res

def get_nonhidden_key_type(data):
    res = {}
    discarded_list = ["datagrid", "editgrid", "signature", "file", "signature"]
    for item in data:
        if item["isHidden"] == False and item["type"] not in discarded_list:
            res[item["key"]] = item["type"]
    return res

def get_non_hidden_required_labels(data):
    res = {}
    discarded_list = ["datagrid", "editgrid", "signature", "file", "signature"]
    for item in data:
        if not item["isHidden"] and item["type"] not in discarded_list:
            if 'required' in item and item["required"]:
                res[item["key"]] = True
            else:
                res[item["key"]] = False
    return res

def get_reporting_view(data):
    res = []
    discarded_list = ["datagrid", "editgrid", "signature", "file"]
    for item in data:
        if item["tableView"] == True and item["type"] not in discarded_list and item["isHidden"] == False:
            var = {}
            var["key"] = item["key"]
            var["name"] = item["label"]
            if item["type"] in FORMIO_MAPPING.DATATYPE:
                var["type"] = FORMIO_MAPPING.DATATYPE[item["type"]]
            else:
                var["type"] = "string"
            res.append(var)
    return res


class GetComponentsController:

    def __init__(self, form, key):
        self.form = form
        self.key = key
        self.structure = {}

    def parse_components(self, forms):
        for form in forms:
            if form['type'] == 'form':
                self.parse_components(form['components'])
            elif form['type'] == 'panel':
                self.parse_components(form['components'])
            elif form['type'] == 'tabs':
                for tabs in form["components"]:
                    self.parse_components(tabs['components'])
            elif form['type'] == 'datagrid':
                self.parse_components(form['components'])
            elif form['type'] == 'editgrid':
                self.parse_components(form['components'])
            elif form['type'] == 'container':
                self.parse_components(form['components'])
            elif form['type'] == 'columns':
                for col in form['columns']:
                    self.parse_components(col['components'])
            elif form['type'] == 'table':
                for row in form['rows']:
                    for col in row:
                        self.parse_components(col['components'])
            elif form['type'] == 'button':
                pass
            elif form['type'] == 'htmlelement':
                pass
            elif form['type'] == 'selectboxes':
                if form["key"] == self.key:
                    self.structure = form
            elif form['type'] == 'select':
                if form["key"] == self.key:
                    self.structure = form
            elif form['type'] == 'checkbox':
                if form["key"] == self.key:
                    self.structure = form
            elif form['type'] == 'radio':
                if form["key"] == self.key:
                    self.structure = form
            else:
                pass

    def get_structure(self):
        self.parse_components(self.form["components"])
        return self.structure

    def get_select_options(self):
        self.parse_components(self.form["components"])
        options = []
        if "dataSrc" not in self.structure and "data" in self.structure:
            for i in self.structure["data"]["values"]:
                options.append(i["value"])
        return options

    def get_radio_options(self):
        self.parse_components(self.form["components"])
        options = []
        if "values" in self.structure:
            for i in self.structure["values"]:
                options.append(i["value"])
        return options

def get_form_util(request, tenant):
    from .models import OrganisationForm
    if not 'form_key_version' in request.query_params:
        context = {'error': 'form_key_version has not been properly passed as query parameter', "success": False,
                    "message": "Failed to get Organisation Form data."}
        return None, Response(context, status=status.HTTP_400_BAD_REQUEST)
    form_key_version = request.query_params['form_key_version']
    cache_data = get_cache(form_key_version + tenant)
    if cache_data:
        return cache_data, None
    actual_form_key, form_version = form_key_version.split("::") if "::" in form_key_version else (form_key_version, None)
    if not form_version:
        obj = OrganisationForm.objects.filter(key=form_key_version, tenant__id=tenant).order_by('-version').first()
        cache_key = form_key_version + "::" + str(obj.version) + tenant
    else:
        obj = OrganisationForm.objects.filter(key=actual_form_key, version=form_version, tenant__id=tenant).first()
        cache_key = form_key_version + tenant
    if not obj:
        context = {'error': None, 'success': False, 'message': 'Organisation form not found with given details'}
        return None, Response(context, status=status.HTTP_404_NOT_FOUND)
    set_cache(cache_key, obj)
    return obj,None
