package com.jio.cwms.onboard.controller;


import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.springframework.ws.soap.SoapHeaderElement;
import org.springframework.ws.soap.server.endpoint.annotation.SoapHeader;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms.onboard.dto.response.TokenResponse;
import com.jio.cwms.onboard.exception.SoapUnauthorizedException;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.service.HOTServiceImpl;
import com.jio.cwms.onboard.service.TokenDecryptionService;
import com.jio.cwms.onboard.service.TokenGenerationService;
import com.jio.cwms.onboard.service.apis.ValidateXmlHeader;
import com.jio.cwms.onboard.utils.CDATAcreation;
import com.jio.cwms.onboard.utils.HttpRequestUtils;
import com.jio.cwms.onboard.wrapper.LogWrapper;
import com.jio.cwms_soap.pojo.GetCandidateStatus;
import com.jio.cwms_soap.pojo.GetCandidateStatusResponse;
import com.jio.cwms_soap.pojo.GetDetails;
import com.jio.cwms_soap.pojo.GetDetailsResponse;
import com.jio.cwms_soap.pojo.GetPositionCount;
import com.jio.cwms_soap.pojo.GetPositionCountResponse;
import com.jio.cwms_soap.pojo.GetScrumDetails;
import com.jio.cwms_soap.pojo.GetToken;
import com.jio.cwms_soap.pojo.GetTokenResponse;
import com.jio.cwms_soap.pojo.ProcessCandidate;
import com.jio.cwms_soap.pojo.ProcessCandidateResult;
import com.jio.cwms_soap.pojo.UpdateDOJ;
import com.jio.cwms_soap.pojo.UpdateDOJResponse;
import com.jio.cwms_soap.pojo.UpdatePhoto;
import com.jio.cwms_soap.pojo.UpdatePhotoResponse;

import jakarta.servlet.http.HttpServletRequest;


@Endpoint
public class HOTController {
	
	@Autowired
	HOTServiceImpl hotService;
	
	@Autowired
	CDATAcreation cdataCreation;
	
	@Autowired
	TokenGenerationService tokenGenerationService;
	
	@Autowired
	ValidateXmlHeader validateXmlHeader;
	
	@Autowired
	TokenDecryptionService tokenDecryptionService;
	
	private static final String NAMESPACE_URL = "http://tempuri.org/";

	ObjectMapper loggingResponseJson = new  ObjectMapper();
	
	
	@PayloadRoot(namespace = NAMESPACE_URL, localPart = "GetToken")
	@ResponsePayload
	public GetTokenResponse getToken(@RequestPayload GetToken tokenRequest) throws Exception {
		
		LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(tokenRequest));
		GetTokenResponse getTokenResponse = tokenGenerationService.GenerateToken(tokenRequest);
		LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(getTokenResponse));
		
		return getTokenResponse;
	}
	
	
	@PayloadRoot(namespace = NAMESPACE_URL, localPart = "GetPositionCount")
	@ResponsePayload
	public GetPositionCountResponse GetPositionCount(@RequestPayload GetPositionCount request,
													 @SoapHeader("{http://tempuri.org/}clientId") SoapHeaderElement clientIdHeader) throws Exception {
		
		GetPositionCountResponse response = new GetPositionCountResponse();
		boolean validTimestamp = false;
		String clientId = validateXmlHeader.validateHeader(clientIdHeader);
		
			String clientIp = fetchClientIP();
		
		if (!StringUtils.isAllEmpty(request.getToken()) ) {
			
			TokenResponse tokenResponse = tokenDecryptionService.tokenValidation1(clientId,request.getToken(),clientIp);
			validTimestamp= tokenResponse.isTokenStatus();
			
//			validTimestamp = tokenDecryptionService.tokenValidation(request.getToken());
		}else {
			throw new SoapUnauthorizedException("Invalid Token");
		}
		
		if (validTimestamp) {	
			LogWrapper.info(getClass(), "Token Valid : GetPositionCount");
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(request));
			
			if (StringUtils.equals(request.getTypecode(), "1")) {
				LogWrapper.info(getClass(), "Processing GetPositionCount for typecode 1: Calling getPositionCount()");
				response = hotService.getPositionCount(request);
			} else if (StringUtils.equals(request.getTypecode(), "2")) {
				LogWrapper.info(getClass(), "Processing GetPositionCount for typecode 2: Calling getPositionCountFromMongo()");
				response = hotService.getPositionCountFromMongo(request);
			} else {
				LogWrapper.error(getClass(), "Invalid typecode value: " + request.getTypecode());
				throw new SoapValidationException("Invalid typecode value: " + request.getTypecode());
			}
			LogWrapper.info(getClass(), "Response Received");
		}else {
			throw new SoapUnauthorizedException("Token Expired");		
		}
	
		return response;
	}
	
	@PayloadRoot(namespace = NAMESPACE_URL, localPart = "GetCandidateStatus")
	@ResponsePayload
	public GetCandidateStatusResponse GetCandidateStatus(@RequestPayload GetCandidateStatus request,
					   @SoapHeader("{http://tempuri.org/}clientId") SoapHeaderElement clientIdHeader) throws Exception {
		
		GetCandidateStatusResponse response = new GetCandidateStatusResponse();
		boolean validTimestamp = false;
		String clientId = validateXmlHeader.validateHeader(clientIdHeader);
		
		String clientIp = fetchClientIP();
		
		if (!StringUtils.isAllEmpty(request.getToken()) ) {
			
			TokenResponse tokenResponse = tokenDecryptionService.tokenValidation1(clientId,request.getToken(),clientIp);
			validTimestamp= tokenResponse.isTokenStatus();
			
//			validTimestamp = tokenDecryptionService.tokenValidation(request.getToken());
		}else {
			throw new SoapUnauthorizedException("Invalid Token");
		}
				
		if (validTimestamp) {	
			LogWrapper.info(getClass(), "Token Valid : GetCandidateStatus");
			
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(request));
			response = hotService.CandidateStatusRequest(request);
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(response));
		}else {
			throw new SoapUnauthorizedException("Token Expired");		
		}
		
		
		return response;
	}
	
	@PayloadRoot(namespace = NAMESPACE_URL, localPart = "ProcessCandidate")
	@ResponsePayload
	public ProcessCandidateResult ProcessCandidate(@RequestPayload ProcessCandidate request,
				@SoapHeader("{http://tempuri.org/}clientId") SoapHeaderElement clientIdHeader) throws Exception {

		ProcessCandidateResult response = new ProcessCandidateResult();
		boolean validTimestamp = false;
		String clientId = validateXmlHeader.validateHeader(clientIdHeader);
		
		String clientIp = fetchClientIP();
		
		if (!StringUtils.isAllEmpty(request.getToken()) ) {
			
			TokenResponse tokenResponse = tokenDecryptionService.tokenValidation1(clientId,request.getToken(),clientIp);
			validTimestamp= tokenResponse.isTokenStatus();
			
//			validTimestamp = tokenDecryptionService.tokenValidation(request.getToken());
		}else {
			throw new SoapUnauthorizedException("Invalid Token");
		}
		
		if (validTimestamp) {
			LogWrapper.info(getClass(), "Token Valid : ProcessCandidate");
			
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(request));
			response = hotService.processCandidate(request);
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(response));
		}else {
			throw new SoapUnauthorizedException("Token Expired");		
		}
		
		
		return 	response;
	
	}
	
	@PayloadRoot(namespace = NAMESPACE_URL, localPart = "getDetails")
	@ResponsePayload
	public GetDetailsResponse getDetails(@RequestPayload GetDetails request,
			@SoapHeader("{http://tempuri.org/}clientId") SoapHeaderElement clientIdHeader) throws Exception {
		
		GetDetailsResponse response = new GetDetailsResponse();
		boolean validTimestamp = false;
		String clientId = validateXmlHeader.validateHeader(clientIdHeader);
		
		String clientIp = fetchClientIP();
		
		if (!StringUtils.isAllEmpty(request.getToken())) {
			
			TokenResponse tokenResponse = tokenDecryptionService.tokenValidation1(clientId,request.getToken(),clientIp);
			validTimestamp= tokenResponse.isTokenStatus();
			
//			validTimestamp = tokenDecryptionService.tokenValidation(request.getToken());
		} else {
			throw new SoapUnauthorizedException("Invalid Token");
		}
		
		if (validTimestamp) {
			LogWrapper.info(getClass(), "Token Valid : GetDetails");
        
//			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(request));
			response = hotService.getCandidateDetailsRequest(request);
//			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(response));
		}else {
			throw new SoapUnauthorizedException("Token Expired");		
		}
		return response;
	}
	
	@PayloadRoot(namespace = NAMESPACE_URL, localPart = "updateDOJ")
	@ResponsePayload
	public UpdateDOJResponse updateDOJ(@RequestPayload UpdateDOJ request,
			@SoapHeader("{http://tempuri.org/}clientId") SoapHeaderElement clientIdHeader) throws Exception {
		
		UpdateDOJResponse response = new UpdateDOJResponse();
		boolean validTimestamp = false;
		String clientId = validateXmlHeader.validateHeader(clientIdHeader);

		String clientIp = fetchClientIP();
		
		if (!StringUtils.isAllEmpty(request.getToken())) {
			
			TokenResponse tokenResponse = tokenDecryptionService.tokenValidation1(clientId,request.getToken(),clientIp);
			validTimestamp= tokenResponse.isTokenStatus();
			
//			validTimestamp = tokenDecryptionService.tokenValidation(request.getToken());
		} else {
			throw new SoapUnauthorizedException("Invalid Token");
		}
		
		if (validTimestamp) {
			LogWrapper.info(getClass(), "Token Valid : UpdateDOJ");
			
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(request));
			response = hotService.updateDOJResp(request);
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(response));
		
		return response;
		}else {
			throw new SoapUnauthorizedException("Token Expired");		
		}
		
	}
	
	@PayloadRoot(namespace = NAMESPACE_URL, localPart = "updatePhoto")
	@ResponsePayload
	public UpdatePhotoResponse updatePhoto(@RequestPayload UpdatePhoto request,
			@SoapHeader("{http://tempuri.org/}clientId") SoapHeaderElement clientIdHeader) throws Exception {
			
		UpdatePhotoResponse response = new UpdatePhotoResponse();
		boolean validTimestamp = false;
		String clientId = validateXmlHeader.validateHeader(clientIdHeader);

		String clientIp = fetchClientIP();
		if (!StringUtils.isAllEmpty(request.getToken())) {
			
			TokenResponse tokenResponse = tokenDecryptionService.tokenValidation1(clientId,request.getToken(),clientIp);
			validTimestamp= tokenResponse.isTokenStatus();
			
//			validTimestamp = tokenDecryptionService.tokenValidation(request.getToken());
		} else {
			throw new SoapUnauthorizedException("Invalid Token");
		}
		
		if (validTimestamp) {
			LogWrapper.info(getClass(), "Token Valid : UpdatePhoto");
			
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(request.getId()));
			response = hotService.updatePhotoResp(request);
			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(response));
		}else {
			throw new SoapUnauthorizedException("Token Expired");		
		}
		
		LogWrapper.info(getClass(),"updatePhoto api completed" +loggingResponseJson.writeValueAsString(response));
		return response;
	}
	
	////Extra Duplicate GetDetails method for Scrum without Token.
	@PayloadRoot(namespace = NAMESPACE_URL, localPart = "getScrumDetails")
	@ResponsePayload
	public GetDetailsResponse getScrumDetails(@RequestPayload GetScrumDetails request) throws Exception {
	
//			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(request));
			GetDetailsResponse	response = hotService.getScrumCandidateDetailsRequest(request);
//			LogWrapper.info(getClass(), loggingResponseJson.writeValueAsString(response));
		return response;
	}
   
	private String fetchClientIP() {	
		try {
			ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
			if (attributes == null) {
				LogWrapper.warn(getClass(), "Request attributes are null, returning empty IP address");
				return "";
			}
			HttpServletRequest servletRequest = attributes.getRequest();
			String clientIp = HttpRequestUtils.getRemoteIPAddress(servletRequest);
			LogWrapper.info(getClass(), "Client IP Address Received: " + clientIp);
			return clientIp;
		} catch (Exception e) {
			LogWrapper.error(getClass(), "Error fetching client IP address: " + e.getMessage(), e);
			return "";
		}
	}
}
