package com.jio.cwms_dataprovision.dto.cua;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class PersonalData {
	
	@JsonProperty("sch:USERNAME")
	private String userName;
	@JsonProperty("sch:PERNR")
	private String pernr;
	@JsonProperty("sch:USTYP")
	private String usType;
	@JsonProperty("sch:CLASS")
	private String className;
	@JsonProperty("sch:FIRSTNAME")
	private String firstName;
	@JsonProperty("sch:LASTNAME")
	private String lastName;
	@JsonProperty("sch:TEL1_NUMBR")
	private String telNo;
	@JsonProperty("sch:E_MAIL")
	private String email;
	@JsonProperty("sch:SPLD")
	private String spld;
	@JsonProperty("sch:SPDB")
	private String spdb;
	@JsonProperty("sch:SPDA")
	private String spda;
	@JsonProperty("sch:DCPFM")
	private String dcpfm;
	
	
	public void fromGeneralRequest(GeneralRequest request, String username) {
		
		ResourceDetails resourceDetails = request.getResource_Details();
		
		this.userName= username;
		this.pernr= resourceDetails.getWorkerCode().substring(4);
		this.usType = "A";
		this.className = "SCRUMUSERS";
		this.firstName = resourceDetails.getFirst_Name();
		this.lastName = resourceDetails.getLast_Name();
		this.telNo = resourceDetails.getPhone_Self().replaceAll("\\+91","");
		this.email = resourceDetails.getEmail_ID();
		this.spld = "LOCL";
		this.spdb = "G";
		this.spda = "D";
		this.dcpfm = "X";
		
	}
	

}
