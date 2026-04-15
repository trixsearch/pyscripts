package com.jio.cwms.onboard.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class GateAccess {

	//@JsonProperty("gate")
	private String gate;

	//@JsonProperty("gate_Profiles")
	private String gate_Profiles;

	//@JsonProperty("gate_Code")
	private String gate_Code;

	//@JsonProperty("gate_Identifier")
	private String gate_Identifier;

}
