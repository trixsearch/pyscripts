package com.jio.cwms.onboard.service;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import com.jio.cwms.onboard.dto.request.EPVendorFetchRequest;
import com.jio.cwms.onboard.wrapper.LogWrapper;

@Service
public class VendorRequestValidationservice {
	
	public boolean requestValidation(EPVendorFetchRequest requestBody, HttpHeaders headers) {
		LogWrapper.info(getClass(), "requestValidation method started for : " + requestBody.getWorkerCode());
		String authToken = headers.getFirst("AuthToken");
		if(!StringUtils.isEmpty(requestBody.getWorkerCode()) && !StringUtils.isEmpty(authToken) && requestBody.getWorkerCode().length() == 12) {	
			return true;
		}
		return false;		
	}

}