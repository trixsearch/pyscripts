package com.jio.cwms_dataprovision.dto.oim;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;
import org.apache.commons.lang3.StringUtils;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(Include.NON_NULL)
public class Identity {

	private String businessCode;
	private String circle;
	private String city;
	private String classCode;
	private String companyCode;
	private String companyName;
	private String departmentNumber;
	private String displayName;
	private String distributionCenter;
	private String email;
	private String employeeNumber;
	private String familyCode;
	private String firstName;
	private String functionalManagerID;
	private String isContactPrimary;
	private String jobRoleCode;
	private String lastName;
	private String lineManagerID;
	private String middleName;
	private String mobile;
	private String segmentCode;
	private String state;
	private String title;
	private String userLogin;
	private String z5Code;
	private String endDate;
	private String fingerprint1;
	private String fingerprint2;
	private String group;
	private String organization;
	private String r4gState;
	private String sourceSystem;
	private String startDate;
	private String userType;
	
	
	public void fromRequest(GeneralRequest request) {
		
		ResourceDetails resourceDetails = request.getResource_Details();
		String transMode = request.getResource_Details().getTransMode();
		//if business code feature not going to prod then comment
//		if ("RR".equalsIgnoreCase(resourceDetails.getOrganization())) {
//			this.businessCode = resourceDetails.getBusiness_Code();
//		} else {
//			this.businessCode = null;
//		}
		this.circle = resourceDetails.getState_Short_Code();
//		this.city = resourceDetails.getArea();
		this.classCode = resourceDetails.getClass_Code();
		this.companyCode = resourceDetails.getOrganization().equalsIgnoreCase("O2C") ? resourceDetails.getContractor_Code() :resourceDetails.getBuild_ID();
		this.companyName = resourceDetails.getOrganization().equalsIgnoreCase("O2C") ? resourceDetails.getContractor_Name() : resourceDetails.getJio_Location();
		this.departmentNumber = resourceDetails.getLocation_Type_Code();
		this.displayName = resourceDetails.getFull_Name();
		this.distributionCenter = resourceDetails.getSite_Code();
		this.email = resourceDetails.getEmail_ID();
		this.employeeNumber = resourceDetails.getWorkerCode();
		this.familyCode = resourceDetails.getFamily_Code();
		this.firstName = resourceDetails.getFirst_Name();
		this.functionalManagerID = (resourceDetails.getManager_ECNO() != null && resourceDetails.getManager_ECNO().length() == 9)? resourceDetails.getManager_ECNO().replaceFirst("[Pp]", "") : resourceDetails.getManager_ECNO();
		this.isContactPrimary = "";
		this.jobRoleCode = resourceDetails.getOrganization().equalsIgnoreCase("O2C") ? (resourceDetails.getSiteID().equalsIgnoreCase("JMD-SOLAR") ? "ZK814": "ZK027") :resourceDetails.getJob_Code();
		this.lastName = resourceDetails.getLast_Name();
		this.lineManagerID = (resourceDetails.getManager_ECNO() != null && resourceDetails.getManager_ECNO().length() == 9)? resourceDetails.getManager_ECNO().replaceFirst("[Pp]", "") : resourceDetails.getManager_ECNO();
		this.middleName = StringUtils.isEmpty(resourceDetails.getMiddle_Name()) || resourceDetails.getMiddle_Name().equalsIgnoreCase("na") ? "" : resourceDetails.getMiddle_Name();
		this.mobile = resourceDetails.getPhone_Self();
		this.segmentCode = resourceDetails.getSegment_Code();
		this.state = resourceDetails.getState_Geo_Short_Code();
		this.title = resourceDetails.getGender().equalsIgnoreCase("Female") ? "MS." : "MR.";
		this.userLogin = resourceDetails.getWorkerCode();
		this.z5Code = resourceDetails.getZ5Code();
		this.endDate = "";
		this.fingerprint1 = "";
		this.fingerprint2 = "";
		
		this.r4gState = resourceDetails.getOrganization().equalsIgnoreCase("O2C") ? "GJ" :resourceDetails.getR4g_State();
		
		if(resourceDetails.getOrganization().equalsIgnoreCase("JIO")) {
			this.group = resourceDetails.getRole_Position_Code();
			
			if (request.getResource_Details().getTransMode().equalsIgnoreCase("ADD")){
				this.sourceSystem = "SCRUM";
				this.organization = resourceDetails.getWork_Stream_Segment().equalsIgnoreCase("SLP") ?  "SLP" : "RJIL";
			}
			
		}else {
			if (request.getResource_Details().getTransMode().equalsIgnoreCase("ADD")){
				this.sourceSystem = "SCRUM";
				this.organization =  resourceDetails.getOrganization().equalsIgnoreCase("O2C") ? "O2C" : "RJIL";
			}
			this.group = resourceDetails.getOrganization().equalsIgnoreCase("O2C") ? (resourceDetails.getSiteID().equalsIgnoreCase("JMD-SOLAR") ? "ZK814": "ZK027") :resourceDetails.getJob_Code();		
			
		}
		
	
		
		this.startDate = "";
		this.userType = transMode.equalsIgnoreCase("ADD") ?  "Contractor" : null;
		
	}
	
public void fromVENRequest(GeneralRequest request) {
		
		ResourceDetails resourceDetails = request.getResource_Details();
		String transMode = request.getResource_Details().getTransMode();
		
		this.circle = "MU";
		this.city = "";
		this.companyCode = "";
		this.companyName = "";
		this.departmentNumber = "";
		this.displayName = resourceDetails.getFull_Name();
		this.distributionCenter = "";
		this.email = resourceDetails.getEmail_ID();
		this.employeeNumber = resourceDetails.getWorkerCode();
		this.firstName = resourceDetails.getFirst_Name();
		this.functionalManagerID = "";
		this.lastName = resourceDetails.getLast_Name();
		this.lineManagerID = "";
		this.middleName= StringUtils.isEmpty(resourceDetails.getMiddle_Name()) || resourceDetails.getMiddle_Name().equalsIgnoreCase("na") ? "" : resourceDetails.getMiddle_Name();
		this.mobile = resourceDetails.getPhone_Self();
		this.state = resourceDetails.getState_Geo_Short_Code();
		this.title = resourceDetails.getGender().equalsIgnoreCase("Female") ? "MS." : "MR.";
		this.userLogin = resourceDetails.getWorkerCode();
		this.endDate = "";
		this.fingerprint1 = "";
		this.fingerprint2 = "";
		this.group = "C6";
		this.organization = transMode.equalsIgnoreCase("VENADD") ?  "RJIL" : null;
		this.r4gState = "MU";
		if (request.getResource_Details().getTransMode().equalsIgnoreCase("VENADD")) {
			this.sourceSystem = "SCRUM";
		}
		this.startDate = "";
		this.userType = transMode.equalsIgnoreCase("VENADD") ?  "Contractor" : null;
		
	}
public void fromGeneralrequest(GeneralRequest request) {
	ResourceDetails resourceDetails = request.getResource_Details();
	this.userLogin = resourceDetails.getWorkerCode();
	
}

}
