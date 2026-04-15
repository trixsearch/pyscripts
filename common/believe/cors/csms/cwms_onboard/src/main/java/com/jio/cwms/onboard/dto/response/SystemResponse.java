package com.jio.cwms.onboard.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
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
@JsonInclude(Include.NON_NULL)
public class SystemResponse {

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
