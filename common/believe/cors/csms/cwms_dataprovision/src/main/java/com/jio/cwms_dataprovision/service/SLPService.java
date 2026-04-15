package com.jio.cwms_dataprovision.service;

import java.time.LocalDateTime;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jio.commons.messages.CommonsMessage;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.constants.AppConstant;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.System;
import com.jio.cwms_dataprovision.dto.slp.SLPOnboardRequest;
import com.jio.cwms_dataprovision.entity.ApplicationMasterEntity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.ApplicationMasterRepositiry;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Optional;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.apache.commons.lang3.StringUtils;

import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import javax.net.ssl.SSLContext;
 
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.ssl.SSLContexts;
import org.apache.hc.core5.ssl.TrustStrategy;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class SLPService implements GeneralService{
	
	@Autowired
	private ApplicationConfig appConfig;
	@Autowired
	private EmployeeLogRepository employeeLogRepo;
	@Autowired
	private ApplicationMasterRepositiry applicationMasterRepository;
	@Autowired
	private ObjectMapper objectMapper;
	
	private RestTemplate restTemplateBypass;

	public SLPService() throws KeyManagementException, NoSuchAlgorithmException, KeyStoreException {

		TrustStrategy acceptingTrustStrategy = (x509Certificates, s) -> true;
	    SSLContext sslContext = SSLContexts.custom().loadTrustMaterial(null, acceptingTrustStrategy).build();
	    SSLConnectionSocketFactory csf = new SSLConnectionSocketFactory(sslContext, new NoopHostnameVerifier());
	    HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
	    HttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create().setSSLSocketFactory(csf).build();
	    CloseableHttpClient httpClient = HttpClients.custom().setConnectionManager(connectionManager).build();
	    requestFactory.setHttpClient(httpClient);
	    restTemplateBypass = new RestTemplate(requestFactory);

	}

	private String authToken = "";
	private Map<String,Integer> retryMap = new HashMap<>();

	private String remarks = "";
	@Override
	public System executeService(GeneralRequest request) throws JsonProcessingException, Exception {

		remarks = "1";
		LogWrapper.info(getClass(), "executeService() | SLP service started");

		if (request.getResource_Details() == null || StringUtils.isAnyBlank(request.getResource_Details().getWorkerCode(), request.getResource_Details().getApproval_Status(), request.getResource_Details().getTransMode())) {
			LogWrapper.error(getClass(), "executeService() | SLP service execution failed | Either Resource details | WorkerCode | ApprovalStatus | TransMode | are null or empty");
			System response = new System();
			response.setSystemName("SLP");
			response.setSystemStatus(AppConstant.sysStatusF);
			response.setSystemMsg("Either Resource details | WorkerCode | ApprovalStatus | TransMode | are null or empty");
			return response;
		}

		String logMessage = String.format("executeService() | Started SLP service execution | EmpId=%s, ApprovalStatus=%s, transMode=%s",
				request.getResource_Details().getWorkerCode(), 
				request.getResource_Details().getApproval_Status(), 
				request.getResource_Details().getTransMode());

		LogWrapper.info(getClass(), logMessage);

		System response = new System();
		response.setSystemName("SLP");
		response.setSystemStatus(AppConstant.sysStatusF);
		
		String cmnMessage = "";
		LogWrapper.info(getClass(), "executeService() | Checking if SLP service is enabled in downstreamApplications | EmpId: " + request.getResource_Details().getWorkerCode());
		if (!appConfig.getSlpFields().isDamStatus()) {
			
			LogWrapper.info(getClass(), "executeService() | SLP service is disabled in downstreamApplications | EmpId: " + request.getResource_Details().getWorkerCode());
			try {
				cmnMessage = CommonsMessage.getErrorJsonResponseMessage("CWMS_Dataprovison_ERR", "027");
				ObjectMapper objectMapper = new ObjectMapper();
				JsonNode jsonNode = objectMapper.readTree(cmnMessage);
				String message = jsonNode.get("msg").asText();
				String modifiedMessage = message.trim();
				((ObjectNode) jsonNode).put("message", modifiedMessage);
				response.setSystemMsg(modifiedMessage);
				return response;
			}
			catch (Exception e) {
				LogWrapper.error(getClass(), e.getMessage());
			}
			
			response.setSystemMsg("ServiceDisabled from Downstream");
			response.setSystemStatus(CwmsConstants.sysStatusF);
			return response;
		}
		LogWrapper.info(getClass(), "executeService() | SLP service is enabled in downstreamApplications | EmpId: " + request.getResource_Details().getWorkerCode());
		
		String responseStatus = "";
		try {
			switch (request.getResource_Details().getTransMode()) {
			case "ADD", "MOD":
				remarks += "2";
				responseStatus = insertRecord(request);
				break;
			case "TER":
				// responseStatus = terminateRecord(request);
				response.setSystemMsg("Terminate operation is not enabled for SLP");
				break;
			default:
				response.setSystemMsg("Invalid TransMode");
				LogWrapper.error(getClass(), "executeService() | Invalid TransMode: " + request.getResource_Details().getTransMode());
			}
		} catch (Exception e) {
			LogWrapper.error(getClass(), "executeService() | Error Occured while executing SLP service for EmpId: " + request.getResource_Details().getWorkerCode() + " | " + e.getMessage());
		}
		
		if (responseStatus.equalsIgnoreCase("S")) {
			response.setSystemStatus(AppConstant.sysStatusS);
		}
		else {
			response.setSystemStatus(AppConstant.sysStatusF);
		}

		LogWrapper.info(getClass(), "executeService() | SLP service execution completed for EmpId: " + request.getResource_Details().getWorkerCode() + " | ResponseStatus: " + responseStatus);
		return response;
	}
	
	private String insertRecord(GeneralRequest request) {
		remarks += "3";
		String logMessage = String.format("insertRecord() | Started SLP Bulk-Insert-Update service execution | EmpId=%s, ApprovalStatus=%s, transMode=%s",
				request.getResource_Details().getWorkerCode(), 
				request.getResource_Details().getApproval_Status(), 
				request.getResource_Details().getTransMode());

		LogWrapper.info(getClass(), logMessage);

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName(ServiceDataEnum.SLP.name());
		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());	
		employeeLog.setTransId(request.getClientTxnId());
		employeeLog.setTransMode(request.getResource_Details().getTransMode());
		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());

		String empId = request.getResource_Details().getWorkerCode();
		String responseStatus = "F";

		try {
			SLPOnboardRequest slpRequest = new SLPOnboardRequest();
			slpRequest.fromGeneralRequest(request);
			SLPOnboardRequest[] slpRequestArray = {slpRequest};
			LogWrapper.info(getClass(), "insertRecord() | Created SLP Request from GeneralRequest");

			employeeLog.setRequest(Arrays.toString(slpRequestArray));
			employeeLog.setRequestTime(LocalDateTime.now());
			
			LogWrapper.info(getClass(), "insertRecord() | Fetching auth token from database for EmpId: " + empId);
			authToken = fetchAuthTokenFromDb();
				if (StringUtils.isEmpty(authToken)) {
				remarks += "4";
				LogWrapper.info(getClass(), "insertRecord() | Auth token is empty, generating new token");
				generateAuthToken();
			} else {
				remarks += "5";
				LogWrapper.info(getClass(), "insertRecord() | Using existing auth token from database");
			}		

			HttpHeaders headers = new HttpHeaders();
			headers.set("Authorization", authToken);
			headers.set("Content-Type", "application/json");

			remarks += "6";
			LogWrapper.info(getClass(), "insertRecord() | Reading SLP Bulk-Insert-Update url from Application Configuration for EmpId: " + empId);
			JsonNode jsonNode = objectMapper.readTree(appConfig.getSlpFields().getDamserverIpUrl());
			LogWrapper.info(getClass(), "insertRecord() | Fetched SLP configuration from database for EmpId: " + empId);
			remarks += "7";
			String url = jsonNode.get("bulk-insert-update-url").asText();

			LogWrapper.info(getClass(), "insertRecord() | Making API call to SLP Bulk-Insert-Update service | URL: " + url);

			remarks += "8";
			HttpEntity<SLPOnboardRequest[]> entity = new HttpEntity<>(slpRequestArray, headers);
			ResponseEntity<String> response = restTemplateBypass.exchange(url, HttpMethod.POST, entity, String.class);
			LogWrapper.info(getClass(), "insertRecord() | API call response: " + response.getBody());
			remarks += "9";

			if (response.getStatusCode() == HttpStatus.OK) {
				responseStatus = "S";
				employeeLog.setStatus(AppConstant.sysStatusS);
				LogWrapper.info(getClass(), "insertRecord() | API call successful for EmpId: " + empId);
			}else {
				responseStatus = "F";
				employeeLog.setStatus(AppConstant.sysStatusF);
				LogWrapper.error(getClass(), "insertRecord() | API call failed with status: " + response.getStatusCode() + " for EmpId: " + empId);
			}

			employeeLog.setResponse(response.getBody());
			employeeLog.setResponseTime(LocalDateTime.now());

		}catch(HttpStatusCodeException e) {
				LogWrapper.error(getClass(), "insertRecord() | HttpStatusCodeException occurred for EmpId: " + empId);
				LogWrapper.error(getClass(), "insertRecord() | HTTP Status Code: " + e.getStatusCode());
				LogWrapper.error(getClass(), "insertRecord() | Error Response Body: " + e.getResponseBodyAsString());
				LogWrapper.error(getClass(), "insertRecord() | Error Response Headers: " + e.getResponseHeaders());
				LogWrapper.error(getClass(), "insertRecord() | Exception Message: " + e.getMessage());

			if(e.getStatusCode() == HttpStatus.UNAUTHORIZED || e.getStatusCode() == HttpStatus.FORBIDDEN) {
				retryMap.merge(empId, 1, Integer::sum);

				if(retryMap.get(empId) > 3) {
					LogWrapper.info(getClass(), "Max retry count reached || Skipping insertRecord call for WorkerCode : "+ empId);
					employeeLog.setResponse(e.getResponseBodyAsString());
					employeeLog.setResponseTime(LocalDateTime.now());
					employeeLog.setStatus(AppConstant.sysStatusF);
					employeeLog.setRemark("SKIPPED");
					return responseStatus;
				}
				else {
					LogWrapper.error(getClass(), "Falls into retry block for WorkerCode : "+ empId + " | RetryCount : " + retryMap.get(empId));

					employeeLog.setRemark("RetryCount - "+ retryMap.get(empId));
					employeeLog.setResponse(e.getResponseBodyAsString());
					employeeLog.setResponseTime(LocalDateTime.now());
					employeeLog.setStatus(AppConstant.sysStatusF);

					LogWrapper.info(getClass(), "insertRecord() | Regenerating auth token due to 401/403 error");
					generateAuthToken();
					return insertRecord(request);
				}
			}
		}
		catch (Exception e) {
			remarks += "10";
			LogWrapper.error(getClass(), "insertRecord() | Error Occured while calling SLP Bulk-Insert-Update service for WorkerCode : "+ empId + " | " + e.getMessage());
			LogWrapper.error(getClass(), "insertRecord() | Exception Type: " + e.getClass().getSimpleName());
			LogWrapper.error(getClass(), "insertRecord() | Stack Trace: " + Arrays.toString(e.getStackTrace()));
			LogWrapper.error(getClass(), "insertRecord() | Root cause: " + e.getCause());
			employeeLog.setResponseTime(LocalDateTime.now());
			employeeLog.setStatus(AppConstant.sysStatusF);
			employeeLog.setRemark(remarks);

			return "F";

		}finally {
			LogWrapper.info(getClass(), "insertRecord() | Writing EmployeeLog for EmpId: " + empId);
			retryMap.remove(empId);
			employeeLogRepo.save(employeeLog);
		}
		
		return responseStatus;
	}
	
	private synchronized void generateAuthToken() {
		
		LogWrapper.info(getClass(), "generateAuthToken() | Started SLP generateAuthToken service execution");
		
		try {
			JsonNode jsonNode = objectMapper.readTree(appConfig.getSlpFields().getDamserverIpUrl());
			String generateTokenUrl  = jsonNode.get("token-generation-url").asText();
			String username = jsonNode.get("UserID").asText();
			String password = jsonNode.get("Password").asText();
			
			Map<String, String> requestBody = new HashMap<>();
			requestBody.put("UserID", username);
			requestBody.put("Password", password);

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);

			LogWrapper.info(getClass(), "generateAuthToken() | Making token generation API call");

			ResponseEntity<String> response = restTemplateBypass.exchange(generateTokenUrl, HttpMethod.POST, new HttpEntity<>(requestBody, headers), String.class);
			
			if (response.getStatusCode() == HttpStatus.OK) {
				JsonNode responseJson = objectMapper.readTree(response.getBody());
				authToken = responseJson.get("token").asText();

				Optional<ApplicationMasterEntity> slpEntityOptional = applicationMasterRepository.findByDamTargetSystem("SLP");
				
				if (slpEntityOptional.isPresent()) {
					ApplicationMasterEntity slpEntity = slpEntityOptional.get();
					slpEntity.setDamHeaders(authToken);
					ApplicationMasterEntity savedEntity = applicationMasterRepository.save(slpEntity);
					
					if (savedEntity != null && savedEntity.getDamHeaders() != null && savedEntity.getDamHeaders().equals(authToken)) {
						LogWrapper.info(getClass(), "generateAuthToken() | Auth token successfully saved to database");
					} else {
						LogWrapper.error(getClass(), "generateAuthToken() | Failed to save auth token to database");
					}
				} else {
					LogWrapper.error(getClass(), "generateAuthToken() | SLP entity not found in database");
				}
			}else{
				LogWrapper.error(getClass(), "generateAuthToken() | Token generation failed with status: " + response.getStatusCode());
			}	
		} catch (HttpStatusCodeException e) {
			LogWrapper.error(getClass(), "generateAuthToken() | HttpStatusCodeException while generating token");
			LogWrapper.error(getClass(), "generateAuthToken() | HTTP Status Code: " + e.getStatusCode());
			LogWrapper.error(getClass(), "generateAuthToken() | Error Response Body: " + e.getResponseBodyAsString());
			LogWrapper.error(getClass(), "generateAuthToken() | Error Response Headers: " + e.getResponseHeaders());
		} catch (Exception e) {
			LogWrapper.error(getClass(), "generateAuthToken() | Error Occured while generating Auth Token: " + e.getClass().getSimpleName() + " - " + e.getMessage());
			LogWrapper.error(getClass(), "generateAuthToken() | Stack Trace: " + Arrays.toString(e.getStackTrace()));
			LogWrapper.error(getClass(), "generateAuthToken() | Root cause: " + e.getCause());
		}
	}

	private synchronized String fetchAuthTokenFromDb() {
		
		LogWrapper.info(getClass(), "fetchAuthTokenFromDb() | Started SLP fetchAuthTokenFromDb service execution");
		
		try {
			String fetchedToken = applicationMasterRepository.findByDamTargetSystem("SLP").get().getDamHeaders();
			
			if (fetchedToken == null || fetchedToken.trim().isEmpty()) {
				LogWrapper.error(getClass(), "fetchAuthTokenFromDb() | Auth token is null or empty");
				return "";
			}
			
			if (fetchedToken.trim().length() < 10) {
				LogWrapper.warn(getClass(), "fetchAuthTokenFromDb() | Token seems too short, might be invalid: " + fetchedToken);
			}
			
			LogWrapper.info(getClass(), "fetchAuthTokenFromDb() | Successfully fetched auth token from database");
			return fetchedToken;
			
		} catch (Exception e) {
			LogWrapper.error(getClass(), "fetchAuthTokenFromDb() | Error Occured while fetching auth token from database");
			LogWrapper.error(getClass(), "fetchAuthTokenFromDb() | Exception: " + e.getMessage());
			LogWrapper.error(getClass(), "fetchAuthTokenFromDb() | Stack trace: " + Arrays.toString(e.getStackTrace()));
			LogWrapper.error(getClass(), "fetchAuthTokenFromDb() | Root cause: " + e.getCause());
			return "";
		}
	}
}
