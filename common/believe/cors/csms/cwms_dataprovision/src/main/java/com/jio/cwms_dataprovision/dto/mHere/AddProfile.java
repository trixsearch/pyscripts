package com.jio.cwms_dataprovision.dto.mHere;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AddProfile {

	private String userId;
	private String employeename;
	private String managerUserId ;
	private String domainid;
	private String emailid;
	private String mobile;
	private String baseOffice;
	private float baseOfficeLat;
	private float baseOfficeLon;
	private String shiftstm;
	private String shiftetm;
	private String daytype;
	private String pictureurl;
	private String fieldemp;
	private String type;
	private String business;
	@JsonProperty("sub_business")
	private String subBusiness;
	private String source;
	private String sid ;
	private String pincode;
	
	public void fromGeneralRequest(GeneralRequest request) {
		
		ResourceDetails resourceDetails = request.getResource_Details();
		String mobNo = StringUtils.isEmpty(resourceDetails.getPhone_Self()) ? "" : resourceDetails.getPhone_Self();
		String slicedPhoneNo = mobNo.length() > 10 ? (mobNo.substring(mobNo.length() - 10, mobNo.length())) : mobNo;
		String rarsFlag = StringUtils.isEmpty(resourceDetails.getRarsFlag()) ? "O" : resourceDetails.getRarsFlag().trim();
		String managerID = StringUtils.isEmpty(resourceDetails.getManager_ECNO()) ? "" : resourceDetails.getManager_ECNO().replaceFirst("P", "");
		String managerIDForO2C = StringUtils.isEmpty(resourceDetails.getEic_EC_No()) ? "" : resourceDetails.getEic_EC_No().replaceFirst("P", "");
		String name = StringUtils.isEmpty(resourceDetails.getName_as_per_Aadhar()) ? resourceDetails.getFirst_Name() : resourceDetails.getName_as_per_Aadhar();
		
		this.userId=resourceDetails.getPrmID() == null || resourceDetails.getPrmID().isBlank() ? resourceDetails.getWorkerCode() : resourceDetails.getPrmID();
		this.employeename=StringUtils.isEmpty(name) ? "" :name.replaceAll(" +", " ").trim();
		this.employeename = this.employeename.replaceAll("\\u00A0", " ");
		this.managerUserId=resourceDetails.getOrganization().equalsIgnoreCase("O2C") ? managerIDForO2C : managerID;
		this.domainid="";
		this.emailid=StringUtils.isEmpty(resourceDetails.getEmail_ID())? "" : resourceDetails.getEmail_ID();
		this.mobile=slicedPhoneNo;
		this.baseOffice=resourceDetails.getOrganization().equalsIgnoreCase("O2C") ? "" : resourceDetails.getSite_Code();
		if (resourceDetails.getSiteID().equalsIgnoreCase("RR")) {
			if (!StringUtils.isEmpty(resourceDetails.getBuild_ID())) {
				this.baseOffice = resourceDetails.getBuild_ID();
			}
		}
		this.baseOfficeLat = 0.0f;
		this.baseOfficeLon = 0.0f;
		this.shiftstm = "093000";
		this.shiftetm = "183000";
		this.daytype = "";
		this.pictureurl = "";
		if (resourceDetails.getOrganization().equalsIgnoreCase("RR")&&resourceDetails.getTransMode().equalsIgnoreCase("HIB")) {
		    this.fieldemp = "O";
		} else {
		    this.fieldemp = resourceDetails.getOrganization().equalsIgnoreCase("O2C") 
		                    ? "SO" 
		                    : rarsFlag;
		}
		this.type = "contractor";
		this.business = resourceDetails.getSiteID();
		this.subBusiness = "mHerePro";
		this.source = "BetterPlace";
		this.sid = "";
		this.pincode = "";
	}
}
