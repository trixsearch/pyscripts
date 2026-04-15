package com.jio.cwms_dataprovision.dto.mHere;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MHereO2CSiteList {
	
	@JsonProperty("Sector")
	private String sector;
	
	@JsonProperty("Plant")
	private String plant;
	
	@JsonProperty("Department")
	private String department;
	
	@JsonProperty("Trade")
	private String trade;
}
