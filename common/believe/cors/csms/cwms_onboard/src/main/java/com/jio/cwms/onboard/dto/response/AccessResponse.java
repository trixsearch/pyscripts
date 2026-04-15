package com.jio.cwms.onboard.dto.response;

import java.util.ArrayList;
import java.util.List;

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
public class AccessResponse {
	
        private String workerCode;
		private String activity;
		@JsonProperty("card_No")
		private String cardNo;
		@JsonProperty("card_Format")
		private String cardFormat;
		@JsonProperty("card_IssueLevel")
		private String cardIssueLevel;
		List<SystemResponse> system = new ArrayList<>();

	

}
