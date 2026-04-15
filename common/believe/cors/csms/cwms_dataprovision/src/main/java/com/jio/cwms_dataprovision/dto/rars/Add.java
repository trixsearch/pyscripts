package com.jio.cwms_dataprovision.dto.rars;


import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Add {
	
	@JsonProperty("MANDT")
	private String mandt;
	@JsonProperty("PERNR")
	private String pernr;
	@JsonProperty("ENAME")
	private String ename;
	@JsonProperty("PERNRMGR")
	private String pernrmgr;
	@JsonProperty("DOMAINID")
	private String domainId;
	@JsonProperty("EMAILID")
	private String emailId;
	@JsonProperty("MOBILE")
	private String mobile;
	@JsonProperty("BLOC")
	private String bloc;
	@JsonProperty("SHIFTSTM")
	private String shiftstm;
	@JsonProperty("SHIFTETM")
	private String shiftetm;
	@JsonProperty("DAYTYPE")
	private String dayType;
	@JsonProperty("FIELDEMP")
	private String fieldEmp;
	
	
	public void fromGeneralRequest(GeneralRequest request) {
		
		ResourceDetails resourceDetails = request.getResource_Details();
		
		this.mandt = "SC";
		this.pernr = resourceDetails.getPrmID() == null || resourceDetails.getPrmID().isBlank() ? resourceDetails.getWorkerCode() : resourceDetails.getPrmID();
		this.ename = resourceDetails.getFirst_Name() + " " + resourceDetails.getLast_Name();
		this.pernrmgr = resourceDetails.getManager_ECNO().replaceFirst("P", "");
		this.domainId = "NA";
		this.emailId = resourceDetails.getEmail_ID();
		this.mobile = resourceDetails.getPhone_Self();
		this.bloc = resourceDetails.getSite_Code();
		
		if(resourceDetails.getSiteID().equalsIgnoreCase("RR")) {
			if(!StringUtils.isEmpty(resourceDetails.getBuild_ID())) {
				this.bloc = resourceDetails.getBuild_ID();
			}
		}
		this.shiftstm = "093000";
		this.shiftetm = "183000";
		this.dayType = "J";
		this.fieldEmp = resourceDetails.getPrmID() == null  || resourceDetails.getPrmID().isBlank() ? resourceDetails.getRarsFlag() : "J";
	}
	

}
