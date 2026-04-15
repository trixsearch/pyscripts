package com.jio.cwms.onboard.dto.request;

import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Component
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CandidateOnboardRequest {
	   
		public String action;
		public CandidateDetails candidateDetails;
		
	}


