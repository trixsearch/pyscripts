package com.jio.cwms.onboard.dto.response;

import java.util.List;

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
public class CreateClaimResponse {

	public boolean error;
	public boolean success;
	public String message;
	public String code;
	public String description;
	public List<String> ackId;
	public String errors;
	
	
}
