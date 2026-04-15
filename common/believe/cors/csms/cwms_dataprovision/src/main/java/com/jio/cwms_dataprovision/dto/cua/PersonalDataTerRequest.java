package com.jio.cwms_dataprovision.dto.cua;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

public class PersonalDataTerRequest {

	@JsonProperty("sch:USERNAME")
	private String userName;

	@JsonProperty("sch:PERNR")
	private String pernr;

	@JsonProperty("sch:GLTGB")
	private String terminationDate;

	@JsonProperty("sch:USTYP")
	private String usType;

	@JsonProperty("sch:CLASS")
	private String className;

	public void fromGeneralRequest(GeneralRequest request, String username) {

		ResourceDetails resourceDetails = request.getResource_Details();

		this.userName = username;
		this.pernr = resourceDetails.getWorkerCode().substring(4);
		this.usType = "A";
		this.className = "SCRUMUSERS";
		this.terminationDate = resourceDetails.getTermination_Date().replaceAll("-", "");

	}
}
