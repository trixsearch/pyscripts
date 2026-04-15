package com.jio.cwms.onboard.service.apis;

import java.util.UUID;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.config.OnboardErrorHandler;
import com.jio.cwms.onboard.dto.request.CandidateOnboardRequest;
import com.jio.cwms.onboard.dto.request.CandidateStatusRequest;
import com.jio.cwms.onboard.dto.response.CandidateOnboardResponse;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.utils.CDATAcreation;
import com.jio.cwms.onboard.wrapper.LogWrapper;
import com.jio.cwms_soap.pojo.ProcessCandidate;



@Service
public class HOTApis {
	
	@Autowired
    RestTemplate restTemplate;
	
	@Autowired
	CDATAcreation cdataCreation;

	public String getEmployeeDetailsApi(ProcessCandidate request) {
		
		String candidateID =request.getCanDetails().getCandiateID();
		String xml = ApplicationConfig.getUpstreamMasterCandidate().getRequestBody();
		String url = ApplicationConfig.getUpstreamMasterCandidate().getPublisherURL();
		
		  String EmpCode = request.getCanDetails().getCandiateID();

          String modifiedXml = xml.replace("<fet:EmployeeCode>10071048</fet:EmployeeCode>", "<fet:EmployeeCode>" + EmpCode + "</fet:EmployeeCode>");

	

		LogWrapper.info(HOTApis.class, "Calling GetEmployeeDetailsApis API | candidate ID:: " + candidateID + 
				" | API URL:: " + url+
				" | Request Body:: " + modifiedXml);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "text/xml");

        String wcsResponse= null;
        try {
       wcsResponse = restTemplate.exchange(
                url,
                HttpMethod.POST, new HttpEntity<String>(modifiedXml, headers), String.class).getBody();
  
        } catch (ResourceAccessException e) {
			LogWrapper.error(HOTApis.class, 
					"Connection timeout/error occurred while calling getEmployeeDetailsApi | Exception:: " + e.getClass().getCanonicalName()+
					" | Message:: " + e.getMessage()+
					" | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			throw new SoapValidationException("Upstream service not reachable. Please try again later");
		} catch (HttpClientErrorException e) {
			LogWrapper.error(HOTApis.class, 
					"HTTP Client Error occurred while calling getEmployeeDetailsApi | Status Code:: " + e.getStatusCode() +
					" | Response Body:: " + e.getResponseBodyAsString());
			// For XML response, return the error response body or null
			return e.getResponseBodyAsString();
		} catch (final Exception e) {        	
			LogWrapper.error(HOTApis.class, 
					"Exception occurred while calling cwms publisher API | Exception:: " + e.getClass().getCanonicalName()+
					" | Message:: " + e.getMessage()+
					" | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			return wcsResponse;
		}
    	
        LogWrapper.info(HOTApis.class,"Call to cwms access completed | candidate ID:: " + candidateID + 
				" | Response:: " + wcsResponse);
		
	return wcsResponse;	
	
		
		
	}
	
	

	public CandidateOnboardResponse callCandidateOnboardApi( final CandidateOnboardRequest requestBody) throws JsonMappingException, JsonProcessingException {
		String candidateID =requestBody.getCandidateDetails().getCandidateId();
			
		LogWrapper.info(HOTApis.class, "Calling GetEmployeeDetailsApis API | candidate ID:: " + candidateID + 
				" | API URL:: " +  ApplicationConfig.getUpstreamMasterCandidateOnbrd().getPublisherURL()+
				" | Request Body:: " + requestBody);

		UUID uuid = UUID.randomUUID();
	    String uuidAsString = uuid.toString();
		HttpHeaders headers = new HttpHeaders();
		headers.add("Content-Type", "application/json");
		headers.add("clientTxnId", uuidAsString);
	
		

		final var requestEntity = new HttpEntity<CandidateOnboardRequest>(requestBody, headers);		
		CandidateOnboardResponse response =new CandidateOnboardResponse();
		ObjectMapper objectMapper = new ObjectMapper();
		try {
			
			restTemplate.setErrorHandler(new OnboardErrorHandler());
			final ResponseEntity<CandidateOnboardResponse> responseEntity = restTemplate.postForEntity(
					ApplicationConfig.getUpstreamMasterCandidateOnbrd().getPublisherURL(),
					requestEntity,
					CandidateOnboardResponse.class);
			if (responseEntity.getBody() == null) {
				return new CandidateOnboardResponse();
			}
			response = responseEntity.getBody();
		} catch (ResourceAccessException e) {
			LogWrapper.error(HOTApis.class, 
					"Connection timeout/error occurred while calling callCandidateOnboardApi | Exception:: " + e.getClass().getCanonicalName()+
					" | Message:: " + e.getMessage()+
					" | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			throw new SoapValidationException("Upstream service not reachable. Please try again later");
		} catch (HttpClientErrorException e) {
			LogWrapper.error(HOTApis.class, 
					"HTTP Client Error occurred while calling callCandidateOnboardApi | Status Code:: " + e.getStatusCode() +
					" | Response Body:: " + e.getResponseBodyAsString());
			
			try {
				// Parse the error response body to extract error details
				CandidateOnboardResponse errorResponse = objectMapper.readValue(e.getResponseBodyAsString(), CandidateOnboardResponse.class);
				LogWrapper.error(HOTApis.class, 
						"Parsed error response from callCandidateOnboardApi | Status:: " + errorResponse.getStatus() +
						" | Errors:: " + errorResponse.getErrors() +
						" | ClientTxnId:: " + errorResponse.getClientTxnId());
				return errorResponse;
			} catch (JsonProcessingException | IllegalArgumentException jsonEx) {
				LogWrapper.error(HOTApis.class, 
						"Failed to parse error response JSON | Exception:: " + jsonEx.getMessage());
				// If parsing fails, create a response with error message
				CandidateOnboardResponse errorResponse = new CandidateOnboardResponse();
				errorResponse.setStatus(0);
				errorResponse.setSuccess("false");
				errorResponse.setErrors("Received error from API: " + e.getResponseBodyAsString());
				return errorResponse;
			}
		} catch (final Exception e) {

	
			LogWrapper.error(HOTApis.class, 
					"Exception occurred while calling cwms publisher API | Exception:: " + e.getClass().getCanonicalName()+
					" | Message:: " + e.getMessage()+
					" | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			
			return new CandidateOnboardResponse();
		}
      LogWrapper.info(HOTApis.class,"Call to cwms access completed | candidate ID:: " + candidateID + 
				" | Response:: " + response);
		return response;
		
	}
	
	

	public CandidateOnboardResponse getCandidateDetailsApi( final CandidateStatusRequest requestBody) throws JsonMappingException, JsonProcessingException {
		String candidateID =requestBody.getCandidateId();
			
		LogWrapper.info(HOTApis.class, "Calling getCandidateDetails API | candidate ID:: " + candidateID + 
				" | API URL:: " +  ApplicationConfig.getUpstreamMasterCandidateStatus().getPublisherURL() +
				" | Request Body:: " + requestBody);

		UUID uuid = UUID.randomUUID();
	    String uuidAsString = uuid.toString();
		HttpHeaders headers = new HttpHeaders();
		headers.add("Content-Type", "application/json");
		headers.add("clientTxnId", uuidAsString);

		final var requestEntity = new HttpEntity<CandidateStatusRequest>(requestBody, headers);		
		
		CandidateOnboardResponse response =new CandidateOnboardResponse();
		ObjectMapper objectMapper = new ObjectMapper();
		try {
			
			
			final ResponseEntity<CandidateOnboardResponse> responseEntity = restTemplate.postForEntity(
					ApplicationConfig.getUpstreamMasterCandidateStatus().getPublisherURL(),
					requestEntity,
					CandidateOnboardResponse.class);
			if (responseEntity.getBody() == null) {
				return new CandidateOnboardResponse();
			}
			response = responseEntity.getBody();
		} catch (ResourceAccessException e) {
			LogWrapper.error(HOTApis.class, 
					"Connection timeout/error occurred while calling getCandidateDetails API | Exception:: " + e.getClass().getCanonicalName()+
					" | Message:: " + e.getMessage()+
					" | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			throw new SoapValidationException("Upstream service not reachable. Please try again later");
		} catch (HttpClientErrorException e) {
			LogWrapper.error(HOTApis.class, 
					"HTTP Client Error occurred while calling getCandidateDetails API | Status Code:: " + e.getStatusCode() +
					" | Response Body:: " + e.getResponseBodyAsString());
			
			try {
				// Parse the error response body to extract error details
				CandidateOnboardResponse errorResponse = objectMapper.readValue(e.getResponseBodyAsString(), CandidateOnboardResponse.class);
				LogWrapper.error(HOTApis.class, 
						"Parsed error response from getCandidateDetails API | Status:: " + errorResponse.getStatus() +
						" | Errors:: " + errorResponse.getErrors() +
						" | ClientTxnId:: " + errorResponse.getClientTxnId());
				return errorResponse;
			} catch (JsonProcessingException | IllegalArgumentException jsonEx) {
				LogWrapper.error(HOTApis.class, 
						"Failed to parse error response JSON | Exception:: " + jsonEx.getMessage());
				// If parsing fails, create a response with error message
				CandidateOnboardResponse errorResponse = new CandidateOnboardResponse();
				errorResponse.setStatus(0);
				errorResponse.setSuccess("false");
				errorResponse.setErrors("Received error from API: " + e.getResponseBodyAsString());
				return errorResponse;
			}
		} catch (final Exception e) {

	
			LogWrapper.error(HOTApis.class, 
					"Exception occurred while calling getCandidateDetails API | Exception:: " + e.getClass().getCanonicalName()+
					" | Message:: " + e.getMessage()+
					" | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			
			return new CandidateOnboardResponse();
		}
      LogWrapper.info(HOTApis.class,"Call to getCandidateDetails completed | candidate ID:: " + candidateID + 
				" | Response:: " + response);
		return response;
		
	}
	
	
	

	
}
