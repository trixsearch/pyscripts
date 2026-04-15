def skip_work_flow_hook(data):
    
    # 1. profile is created and details are filled ->  trigger -> change the status to
    # pre_verified and generate employeeId workflow
    
    # 2. if the profile is pre verified and the employeeId is generated -> trigger approval workflows
    
    # 3. if the profile is hired or locked don't trigger lanch process        

    mandatory_fields = [
        "defaultLocation", 
        "defaultRole",
        "documents",
        "addresses",
        "origin_org",
        "workOrderId",
        "vendorCode",
        "reportsTo",
        "languages",
        "healthDetails",
        "firstName",
        "contacts",
        "gender",
        "isConsentAccepted",
        "isIndian",
        "employeeType",
        "employeeId",
        "status",
        "entityType",
        "bankDetails",
        "religion",
        "financeDetails",
        "maritalStatus",
        "qualification"
    ]
    
    for mandatory_field in mandatory_fields:
        value = data.get(mandatory_field)
        
        if value is None:
            data["skipWorkFlow"] = True
            break
        
        if isinstance(value, str) and value.strip() == "":
            data["skipWorkFlow"] = True
            break
        
        if isinstance(value, list) and len(value) == 0:
            data["skipWorkFlow"] = True
            break
        
        if isinstance(value, dict) and len(value) == 0:
            data["skipWorkFlow"] = True
            break

    if data.get("status") and data.get("status").lower() in ["hired", "pre_hired"]:
        data["skipWorkFlow"] = True
