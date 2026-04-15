package com.jio.cwms.onboard.dto.response;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PlatformEmpOnboardResponse {
	
    public String entityType;
    public String employeeType;
    public String isConsentAccepted;
    public ArrayList<Contact> contacts;
    public String firstName;
    public String dob;
    public String gender;
    public String candidateId;
    public String employeeId;
    public String vendorCode;
    public String workerOrderId;
    public String defaultRole;
    public String reportsTo;
    public String defaultLocation;
    public String joiningDate;
    public String status;
    public String onboarderName;
    public String onboarderEmail;
    public String onboarderECNo;
    public String deploymentStartDate;
    public String orgId;
    public String userId;
    public String requestFrom;
    public ArrayList<String> tags;
    public ArrayList<TagAssignment> tagAssignment;
    public String uuid;
    public String createdOn;
    public String modifiedOn;
    public String createdBy;
    public String modifiedBy;
    public String isActive;
    public String lockStatus;
    public String nameInLowerCase;
    public String personId;
    
    @JsonProperty("_id")
    public String id;
    public String status_code;
    public String error_message;

}
