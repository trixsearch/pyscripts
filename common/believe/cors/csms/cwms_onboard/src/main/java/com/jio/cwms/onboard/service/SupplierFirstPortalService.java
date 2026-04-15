package com.jio.cwms.onboard.service;

import org.apache.commons.lang3.BooleanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.jio.cwms.onboard.dto.request.SupplierFirstRequest;
import com.jio.cwms.onboard.dto.response.ClaimResponse;
import com.jio.cwms.onboard.dto.response.CreateClaimResponse;
import com.jio.cwms.onboard.dto.response.OnboardResponse;
import com.jio.cwms.onboard.exception.ServiceFailedException;
import com.jio.cwms.onboard.service.apis.SupplierFirstApis;




@Service
public class SupplierFirstPortalService {

	@Autowired
	private SupplierFirstApis SupplierFirstApis;
	

	
	public OnboardResponse CreateClaimService(SupplierFirstRequest request, HttpHeaders header) throws JsonMappingException, JsonProcessingException
	{
		CreateClaimResponse claimResponse = null;	
		
		if ((!request.getSegmentCodes().isEmpty() && request.getSiteCodes().isEmpty() && request.getWorkerCodes().isEmpty()) ||
			    (request.getSegmentCodes().isEmpty() && !request.getSiteCodes().isEmpty() && request.getWorkerCodes().isEmpty()) ||
			    (request.getSegmentCodes().isEmpty() && request.getSiteCodes().isEmpty() && !request.getWorkerCodes().isEmpty())) {

		 claimResponse =  SupplierFirstApis.callCreateClaimApi(request, header);}
		else {
			throw new ServiceFailedException("111111", "Expected only one field value. Preference: Segment Codes, Site Codes, Worker Codes", null);
		}
		
		OnboardResponse response = null;
		if(claimResponse.success)
		{	
			ClaimResponse result =	ClaimResponse.builder()
					.errors(claimResponse.getErrors())
					.code(claimResponse.getCode())
					.description(claimResponse.getDescription())
					.message(claimResponse.getMessage())
					.ackId(claimResponse.getAckId()).build();
			
			 response =	 OnboardResponse.builder().clientTxnId("11111").status(1)
			.success(BooleanUtils.TRUE).errors("").resource(result).build();

	}
		return response;
}
	


}
