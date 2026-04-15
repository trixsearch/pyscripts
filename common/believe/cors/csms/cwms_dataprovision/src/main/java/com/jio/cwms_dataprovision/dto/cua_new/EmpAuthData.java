package com.jio.cwms_dataprovision.dto.cua_new;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.*;

@Getter
@Setter
public class EmpAuthData {
	
	private String uname;
	// Blank
	private String logsys;
	private String plans;
	private String stell;
	// Blank
	private String buisness_T;
	// Blank
	private String buisness;
	// Blank
	private String segment;
	// Blank
	private String plstx;
	// Blank
	private String segment_T;
	@JsonProperty("class") private String class_;
	// Blank
	private String family;
	// Blank
	private String class_T;
	// Blank
	private String family_T;
	private String start_DATE;
	// Blank
	private String store_CODE;
	private String hire_FLAG;
	private String stltx;
	// Blank
	private String site_FLAG;
}
