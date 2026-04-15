package com.jio.cwms_dataprovision.dto.cua;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NJDetails {

	@JsonProperty("sch:UNAME")
	private String uname;
	@JsonProperty("sch:START_DATE")
	private String startDate;
	@JsonProperty("sch:STORE_CODE")
	private String storeCode;
	@JsonProperty("sch:JOB_CODE")
	private String jobCode;
	@JsonProperty("sch:BUSINESS")
	private String business;
	@JsonProperty("sch:SEGMENT")
	private String segment;
	@JsonProperty("sch:FAMILY")
	private String family;
	@JsonProperty("sch:CLASS")
	private String className;
	@JsonProperty("sch:HIRE_FLAG")
	private String hireFlag;
	@JsonProperty("sch:FROM_STORE")
	private String fromStore;
	@JsonProperty("sch:OLD_POSITION")
	private String oldPosition;
	@JsonProperty("sch:NEW_POSITION")
	private String newPosition;

	public void fromGeneralRequst(GeneralRequest request, String username) {
		
		DateTimeFormatter cwmsDateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter njDateFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy");
		
		ResourceDetails resourceDetails = request.getResource_Details();
		
		this.uname = username;
		this.startDate = LocalDate.parse(resourceDetails.getDate_of_Joining(), cwmsDateFormat).format(njDateFormat);
		this.storeCode = resourceDetails.getSite_Code();
		this.jobCode = resourceDetails.getJob_Code();
		this.business = resourceDetails.getBusiness_Code();
		this.segment = resourceDetails.getSegment_Code();
		this.family = resourceDetails.getFamily_Code();
		this.className = resourceDetails.getClass_Code();
		this.hireFlag = "NJ";
		this.fromStore = resourceDetails.getSite_Code();
		/// Need to discuss
		this.oldPosition = "0";
		/// Need to discuss
		this.newPosition = "0";
	}

}
