package com.jio.cwms.onboard.dto.request;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Component
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(Include.NON_NULL)
public class CandidateStatusRequest {
	
	public String action;
	public String typeCode;
	public String candidateId;
	public String managerId;
	public String sapRoleCode;
	public String shortCode;

}


