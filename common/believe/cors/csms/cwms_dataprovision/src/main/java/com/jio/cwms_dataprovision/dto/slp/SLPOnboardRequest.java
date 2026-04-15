package com.jio.cwms_dataprovision.dto.slp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SLPOnboardRequest {

    @JsonProperty("EmployeeCode")
    private String employeeCode;

    @JsonProperty("FirstName")
    private String firstName;

    @JsonProperty("LastName")
    private String lastName;

    @JsonProperty("EmployeeName")
    private String employeeName;

    @JsonProperty("JobRoleCode")
    private String jobRoleCode; 

    @JsonProperty("JobDescription")
    private String jobDescription;

    @JsonProperty("Region")
    private String region;

    @JsonProperty("State")
    private String state;

    @JsonProperty("Email")
    private String email;

    @JsonProperty("MobileNumber")
    private String mobileNumber;

    @JsonProperty("L1EmployeeCode")
    private String l1EmployeeCode;

    @JsonProperty("L1Name")
    private String l1Name;

    @JsonProperty("L1EmailID")
    private String l1EmailId;

    @JsonProperty("EmploymentStatus")
    private String employmentStatus;
    
    @JsonProperty("Segment")
    private String segment;

    @JsonProperty("Area")
    private String area;

    @JsonProperty("Business")
    private String business;

    @JsonProperty("BusinessDescription")
    private String businessDescription; 

    public void fromGeneralRequest(GeneralRequest request) {
        
        ResourceDetails details = request.getResource_Details();

        this.employeeCode = getValueOrEmpty(details.getWorkerCode());
        this.firstName = getValueOrEmpty(details.getFirst_Name());
        this.lastName = getValueOrEmpty(details.getLast_Name());
        this.employeeName = getValueOrEmpty(details.getName_as_per_Aadhar(), details.getFull_Name());
        this.jobRoleCode = getValueOrEmpty(details.getJob_Code());
        this.jobDescription = getValueOrEmpty(details.getArea_of_Movement_Jobkey());
        this.business = getValueOrEmpty(details.getBusiness_Code());
        this.businessDescription = getValueOrEmpty(details.getWork_Area_Business());
        this.region = getValueOrEmpty(details.getRegion());
        this.state = getValueOrEmpty(details.getState());
        this.area = getValueOrEmpty(details.getArea());
        this.email = getValueOrEmpty(details.getEmail_ID());
        this.mobileNumber = getValueOrEmpty(details.getPhone_Self());
        this.l1EmployeeCode = getValueOrEmpty(details.getManager_ECNO());
        this.l1Name = getValueOrEmpty(details.getManager_Name());
        this.l1EmailId = ""; //L1 Email ID is not available in the request
        this.employmentStatus = getValueOrEmpty(details.getApproval_Status());
        this.segment = getValueOrEmpty(details.getSegment_Code());

    }

    private String getValueOrEmpty(String value) {
        return StringUtils.isNotEmpty(value) ? value : "";
    }

    private String getValueOrEmpty(String primaryValue, String fallbackValue) {
        if (StringUtils.isNotEmpty(primaryValue)) {
            return primaryValue;
        }
        return StringUtils.isNotEmpty(fallbackValue) ? fallbackValue : "";
    }
}




