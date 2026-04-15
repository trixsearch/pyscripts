package com.jio.cwms_dataprovision.dto.cua;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jio.cwms_dataprovision.dto.AccessDetails;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PTDetails {

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
	private String classCode;
	@JsonProperty("sch:HIRE_FLAG")
	private String hireFlag;
	@JsonProperty("sch:FROM_STORE")
	private String fromStore;
	@JsonProperty("sch:OLD_POSITION")
	private String oldPosition;
	@JsonProperty("sch:NEW_POSITION")
	private String newPosition;
	@JsonProperty("sch:SITE_FLAG")
	private String siteFlag;

	public void fromGeneralRequest(GeneralRequest request, String username) {

		ResourceDetails resourceDetails = request.getResource_Details();
		AccessDetails accessDetails = request.getAccess_Details();

		DateTimeFormatter cwmsDateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		DateTimeFormatter ptDateFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy");

		this.uname = username;
		this.startDate = LocalDate.parse(resourceDetails.getDate_of_Joining(), cwmsDateFormat).format(ptDateFormat);
		this.storeCode = resourceDetails.getSite_Code();
		this.jobCode = resourceDetails.getJob_Code();
		this.business = resourceDetails.getBusiness_Code();
		this.segment = resourceDetails.getSegment_Code();
		this.family = resourceDetails.getFamily_Code();
		this.classCode = resourceDetails.getClass_Code();
		this.hireFlag = "PT";
		this.fromStore = resourceDetails.getSite_Code();
		/// Need to discuss
		this.oldPosition = "0";
		/// Need to discuss
		this.newPosition = "0";
		this.siteFlag = "";

	}

}
