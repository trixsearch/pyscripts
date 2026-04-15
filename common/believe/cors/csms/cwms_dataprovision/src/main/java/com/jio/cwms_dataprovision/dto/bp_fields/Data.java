package com.jio.cwms_dataprovision.dto.bp_fields;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Data {

	public Approval approval;
	public String employeeId;
	private String orgId;
	private String defaultLocation;
}
