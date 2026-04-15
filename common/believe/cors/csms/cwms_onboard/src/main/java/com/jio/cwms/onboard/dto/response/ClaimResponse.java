package com.jio.cwms.onboard.dto.response;

import java.util.List;

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
public class ClaimResponse {

	public String message;
	public String code;
	public String description;
	public List<String> ackId;
	public String errors;
}
