package com.jio.cwms.onboard.service;

import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.dto.request.EPVendorFetchRequest;
import com.jio.cwms.onboard.dto.response.EPVendorFetchResponse;
import com.jio.cwms.onboard.exception.DownStreamResponseError;
import com.jio.cwms.onboard.exception.RestExceptionHandler;
import com.jio.cwms.onboard.model.UpstreamApplicationMaster;
import com.jio.cwms.onboard.model.UpstreamMaster;

@Service
public class EPVendorFetchService {
	
	@Autowired
	RestTemplate restTemplate;

	public EPVendorFetchResponse fetchEP(EPVendorFetchRequest requestBody, HttpHeaders headers) {
		
		restTemplate.setErrorHandler(new RestExceptionHandler());
		
		HttpEntity<EPVendorFetchRequest> entity = new HttpEntity<EPVendorFetchRequest>(requestBody, headers);
		
		UpstreamMaster fetchDataMaster = ApplicationConfig.getEpFetchData();
		
		String url = fetchDataMaster.getServerURL()+":"+fetchDataMaster.getPort()+fetchDataMaster.getEndpoint();
		
		//String url ="http://localhost:9092/access/dataFetch/epVendorFetch";
		ResponseEntity<String> responseEntity =restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
			
		EPVendorFetchResponse employeeResponse = new EPVendorFetchResponse();
		JSONObject object =null;
		
		if(!StringUtils.isEmpty(responseEntity.getBody())) {
			
			 object = new JSONObject(responseEntity.getBody());
		//	 object =  object.getJSONObject("vendorResponse");
			 if (responseEntity.getStatusCode() == HttpStatus.OK) {
			 employeeResponse= EPVendorFetchResponse.builder()
					 .entryPermitNumber(object.getString("entryPermitNumber"))
					 .contractorCode(object.getString("contractorCode"))
					 .contractorLabourName(object.getString("contractorLabourName"))
					 .contractorLabourMobileNumber(object.getString("contractorLabourMobileNumber"))
					 .contractorName(object.getString("contractorName"))
					 .siteName(object.getString("siteName"))
					 .eicName(object.getString("eicName"))
					 .nonTerminatedEpCount(object.getInt("nonTerminatedEpCount"))
					 .build();
			 }else if (responseEntity.getStatusCode().is4xxClientError()){
				 
				throw new DownStreamResponseError(responseEntity.getStatusCode().value(),object.getString("clientTxnId"),object.getInt("status"),object.getString("errors"), null);
			 }
		}
		
		return employeeResponse;
		
		
	}
}
