package com.jio.cwms.onboard.dto.response;

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
public class OnboardResponseResource {

	@JsonProperty("workerCode")
	private String workerCode;

	@JsonProperty("msg")
	private String message;

}
