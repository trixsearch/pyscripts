package com.jio.cwms_dataprovision.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(Include.NON_NULL)
public class System {

	@JsonProperty("system_Name")
	private String systemName;
	@JsonProperty("system_Status")
	private String systemStatus;
	@JsonProperty("ref_No")
	private String refNo;
	private String prm_id;
	@JsonProperty("card_StatusCode")
	private String cardStatusCode;
	@JsonProperty("system_Msg")
	private String systemMsg;

}
