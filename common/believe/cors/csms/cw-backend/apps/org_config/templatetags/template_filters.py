import json
from datetime import datetime
from django.template.defaulttags import register
import dateutil.parser
from dateutil import *
from dateutil.tz import *


def day_convertor(day):
    if  11 != int(day) and 12 != int(day) and 13 != int(day):
        date_value = int(day) % 10
    else:
        date_value = day

    switcher={
            1: day +'st',
            2: day +'nd',
            3: day +'rd',
            }
    return switcher.get(date_value,day +"th")

@register.filter
def date_convertor(date_str):
    date_obj = dateutil.parser.parse(date_str)
    day = date_obj.strftime('%-d')
    date = day_convertor(day)
    return '{} Day of {}, {}'.format(date,date_obj.strftime('%B'),date_obj.strftime('%Y'))

@register.filter
def blood_group(blood_group_str):
    try:
        ret_str = blood_group_str[0].upper()
        if "positive" in blood_group_str.lower():
            ret_str = ret_str + "+ve"
        if "negative" in blood_group_str.lower():
            ret_str = ret_str + "-ve"
    except :
        ret_str = blood_group_str
    return ret_str

@register.filter
def dateinddmmyyy(date_str):
    try:
        return dateutil.parser.parse(date_str).strftime('%d/%m/%Y')
    except:
        return date_str

@register.filter
def to_json(json_str, json_key=None):
    try:
        if json_key:
            return json.loads(json_str)[json_key]
        return json.loads(json_str)
    except:
        return json_str

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)

@register.filter
def ist_date_dd_mmm_yyyy(date_str,date_type):
    utc_zone = tz.gettz('UTC')
    TIME_ZONE = tz.gettz('Asia/Kolkata')
    if date_type =="entity":
        date_str=date_str.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    if date_type=="head_date":
        date_str = datetime.strptime(date_str,  "%Y-%m-%dT%H:%M:%SZ").strftime("%Y-%m-%d %H:%M:%S")
    else:
        date_str = datetime.strptime(date_str,  "%Y-%m-%dT%H:%M:%S.%fZ").strftime("%Y-%m-%d %H:%M:%S")
    local_time = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
    local_time = local_time.replace(tzinfo=utc_zone)
    ist_time = local_time.astimezone(TIME_ZONE)
    ist_date_string = ist_time.strftime("%d-%b-%Y %H:%M:%S")
    return ist_date_string


@register.filter
def mask_phone_number(phone_number):
    try:
        if phone_number:
            return phone_number[:3]+'*'*(len(phone_number) - 6)+phone_number[-3:]
        else:
            return "-"
    except:
        return phone_number

@register.filter
def get_date(date_obj, type=None):
    try:
        if date_obj:
            if type =="date_and_time":
                return datetime.fromtimestamp(date_obj/1000).strftime("%Y-%m-%d %H:%M:%S")
            elif type =="time_only":
                return datetime.fromtimestamp(date_obj/1000).strftime("%H:%M:%S")
            else:
                return datetime.fromtimestamp(date_obj/1000).strftime('%Y-%m-%d')
                
        else:
            return "-"
    except:
        return date_obj

@register.filter
def get_case_type(caseList, case_type):
    try:
        if caseList:
            case_flag = False
            for case_data in caseList:
                if case_data['type'] == case_type:
                    case_flag = True
            return case_flag
        else:
            return False
    except:
        return False


@register.filter
def aadhaar_value_separator(aadhaar):
    try:
        if aadhaar:
            return aadhaar[:4] +" "+ aadhaar[4:8] +" "+ aadhaar[8:]
        else:
            return ""
    except:
        return aadhaar