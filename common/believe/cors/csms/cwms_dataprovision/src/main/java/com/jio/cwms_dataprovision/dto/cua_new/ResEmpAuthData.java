package com.jio.cwms_dataprovision.dto.cua_new;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class ResEmpAuthData {

	private String uname;
	
	private String logsys;
	private String plans;
	private String stell;
	
	private String buisness_T;
	
	private String buisness;
	
	private String segment;
	
	private String plstx;
	
	private String segment_T;
	@JsonProperty("class") 
	private String class_;
	
	private String family;
	
	private String class_T;
	
	private String family_T;
	private String start_DATE;
	
	private String store_CODE;
	private String hire_FLAG;
	private String stltx;
	
	private String site_FLAG;
}
