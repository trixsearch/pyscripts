package com.jio.cwms.onboard.dto.response;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.jio.cwms_soap.pojo.CandidateDetails;

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
public class Resource {
	
	public PlatformEmpOnboardResponse platformEmpOnboardResponse;
	public String status;
	public String modifiedon;
	public ArrayList<CandidateDetail> candidateDetail; 
	public String positionName;
	public String jioCenter;
	public int recCount;
	public int offCount; 
    public int availCount ;
    public int gapCount ;
	
	

	
}
