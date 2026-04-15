package com.jio.cwms.onboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EPVendorFetchResponse {
	
	private String entryPermitNumber;
	private String contractorLabourName;
	private String contractorLabourMobileNumber;
	private String siteName;
	private String contractorCode;
	private String contractorName;
	private String eicName;
	private int nonTerminatedEpCount;

}
