package com.jio.cwms_dataprovision.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.config.ScrumJdbcTempalte;
import com.jio.cwms_dataprovision.constants.AppConstant;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.mHere.AccessToken;
import com.jio.cwms_dataprovision.dto.mHere.AddProfile;
import com.jio.cwms_dataprovision.dto.mHere.MHereOnboardResponse;
import com.jio.cwms_dataprovision.entity.AccessRequestLogEntity;
import com.jio.cwms_dataprovision.entity.ApplicationMasterEntity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.ApplicationMasterRepositiry;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class MhereHibernationService {

	@Autowired
	RestTemplate restTemplate;
	
	@Autowired
	ObjectMapper objectMapper;
	
	@Autowired
	ApplicationConfig appConfig;
	
	@Autowired
	EmployeeLogRepository employeeLogRepo;
	
	@Autowired
	ApplicationMasterRepositiry applicationMasterRepositiry;
	
	@Autowired
	ScrumJdbcTempalte scrumJdbcTemplate;
	
	@Autowired
	MhereAsyncHibernationService mhereAsyncHibernationService;
	
	private final Logger logger = LogManager.getLogger(this.getClass());
	private JsonMapper jsonMapper = new JsonMapper();
	private String token;
	private Map<String,Integer> retryMap = new HashMap<>();
	
public MHereOnboardResponse insertProfile(AddProfile request, AccessRequestLogEntity req){
		
		String empId = request.getUserId();
		LogWrapper.info(getClass(), "Add Profile execution started for EmpID :"+ empId);
		
		MHereOnboardResponse onboardResponse= new MHereOnboardResponse();
	//	AddProfile mHereOnboardRequest = new AddProfile();
		
		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName(ServiceDataEnum.MHERE.name());
		employeeLog.setEmpId(request.getUserId());	
		employeeLog.setTransId(req.getTransId());
		employeeLog.setTransMode(req.getTransMode());
		employeeLog.setApprovalStatus(req.getApprovalStatus());
		
		//mHereOnboardRequest.fromGeneralRequest(request);
		
		if(!mandatoryParametersCheck(request)) {
			LogWrapper.info(getClass(), "mandatoryParametersCheck failed for EmpId - "+ empId);
			
			try {
				employeeLog.setRequest(jsonMapper.writeValueAsString(request));
				employeeLog.setRequestTime(LocalDateTime.now());
				
				onboardResponse.setStatus(String.valueOf(HttpStatus.UNPROCESSABLE_ENTITY.value()));
				String missingFields = (StringUtils.isEmpty(request.getUserId()) ?  "userId " : "") +
						   (StringUtils.isEmpty(request.getEmployeename()) ? "employeename " : "") +
						   (StringUtils.isEmpty(request.getMobile()) ? "mobile " : "") ;
				
				onboardResponse.setMessage("Missing mandatory field(s):" + missingFields);
				employeeLog.setRemark(onboardResponse.getMessage());
				
				employeeLog.setResponse(onboardResponse.getMessage() + ", Mhere API not called");
				employeeLog.setResponseTime(LocalDateTime.now());
				
			} catch (JsonProcessingException e) {
				logger.error("Exception occurred while processing Add Profile failed response | Exception: {} | Message: {} | Cause: {} ",
						e.getClass().getCanonicalName(),
						ExceptionUtils.getMessage(e),
						ExceptionUtils.getRootCauseMessage(e)
					);
				employeeLog.setStatus(AppConstant.sysStatusF);
				employeeLog.setRemark("JsonProcessing Error while saving AddProfile response");
			}
			saveEmployeeLog(onboardResponse, employeeLog);
			return onboardResponse;
		}
		
		token = fetchTokenFromDB();
		if (StringUtils.isEmpty(token)) {
            LogWrapper.info(getClass(), "Token for MHERE system not found in DB.");
            renewToken();
        } else {
            LogWrapper.info(getClass(), "Token Fetched successfully.");
        }
		
		try {
			employeeLog.setRequest(jsonMapper.writeValueAsString(request));
			employeeLog.setRequestTime(LocalDateTime.now());
			
			JsonNode jsonNode = objectMapper.readTree(appConfig.getMHereFields().getDamserverIpUrl());
			String appId = jsonNode.get("appId").asText();
			String getAddProfileURL  = jsonNode.get("addProfileURL").asText();
			
			HttpHeaders header = new HttpHeaders();
			header.add("app_id", appId);
			header.add("Authorization", "Bearer "+ token);
			header.add("Content-Type", "application/json");
			HttpEntity<AddProfile> requestEntity = new HttpEntity<>(request, header);
			
			ResponseEntity<MHereOnboardResponse> response = restTemplate.exchange(getAddProfileURL, HttpMethod.POST, requestEntity, MHereOnboardResponse.class);
			onboardResponse =response.getBody();
			
			employeeLog.setResponse(objectMapper.writeValueAsString(onboardResponse));
			employeeLog.setResponseTime(LocalDateTime.now());
			
			LogWrapper.info(getClass(), "Add Profile execution completed for EmpID :"+ empId);
			
		}catch (HttpStatusCodeException e) {
			
			if(e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
				
				retryMap.merge(empId, 1, Integer::sum);
				employeeLog.setRemark("RetryCount - "+ retryMap.get(empId));
				LogWrapper.info(getClass(), "Add Profile RetryMethod called for EmpId : "+ empId +" "+ employeeLog.getRemark());
				
				if(retryMap.get(empId) > 3) {
					LogWrapper.info(getClass(), "Max retry count reached || Skipping addProfile call for EmpId : "+ empId);
					employeeLog.setRemark("SKIPPED");
					return onboardResponse;
				}
				LogWrapper.info(getClass(), "Renewing Token");
				renewToken();
				insertProfile(request,req);
			}
			
			onboardResponse = e.getResponseBodyAs(MHereOnboardResponse.class);
			try {
				employeeLog.setResponse(objectMapper.writeValueAsString(onboardResponse));
				employeeLog.setResponseTime(LocalDateTime.now());
			} catch (JsonProcessingException e1) {
				logger.error("Exception occurred while processing Add Profile failed response | Exception: {} | Message: {} | Cause: {} ",
						e.getClass().getCanonicalName(),
						ExceptionUtils.getMessage(e),
						ExceptionUtils.getRootCauseMessage(e)
					);
				employeeLog.setRemark("JsonProcessing Error while saving AddProfile response");
			}
			
		}catch(Exception e) {
			logger.error("Exception occurred while processing Add Profile request | Exception: {} | Message: {} | Cause: {} ",
					e.getClass().getCanonicalName(),
					ExceptionUtils.getMessage(e),
					ExceptionUtils.getRootCauseMessage(e)
				);
			employeeLog.setStatus(AppConstant.sysStatusF);
			employeeLog.setRemark(ExceptionUtils.getMessage(e));

		}finally {
			retryMap.remove(empId);
			LogWrapper.info(getClass(), "Saving Employeelogs with onboardResponse: "+onboardResponse);
			if( onboardResponse.getStatus() != null && onboardResponse.getStatus().matches("^2\\d{2}$")){
				onboardResponse.setStatus(AppConstant.sysStatusS);
			}else {
				onboardResponse.setStatus(AppConstant.sysStatusF);
			}
		}
		return onboardResponse;
	}
private void saveEmployeeLog(MHereOnboardResponse onboardResponse, EmployeeLog employeeLog) {
	
	if( onboardResponse.getStatus() != null && onboardResponse.getStatus().matches("^2\\d{2}$")){
		onboardResponse.setStatus(AppConstant.sysStatusS);
	}else {
		onboardResponse.setStatus(AppConstant.sysStatusF);
	}
	employeeLog.setStatus(onboardResponse.getStatus());
	
	try {

		employeeLogRepo.save(employeeLog);
		
        logger.info("Inserted employee log record successfully for emp_id: " + employeeLog.getEmpId());
	}catch(Exception e) {
		logger.error("Exception occurred while saving EmployeeLogs | Exception: {} | Message: {} | Cause: {} ",
				e.getClass().getCanonicalName(),
				ExceptionUtils.getMessage(e),
				ExceptionUtils.getRootCauseMessage(e)
			);
	}
}
private boolean mandatoryParametersCheck(AddProfile mHereRequest) {
	
	if(StringUtils.isEmpty(mHereRequest.getUserId()) || 
	   StringUtils.isEmpty(mHereRequest.getEmployeename()) || 
	   StringUtils.isEmpty(mHereRequest.getMobile())) 
	{				
		return false;		
	}
	return true;
	
}
private synchronized void renewToken() {
	
	LogWrapper.info(getClass(), "renewToken method execution started");
	
	String newToken = getAccessToken().getToken();
	ApplicationMasterEntity mHereEntity =  applicationMasterRepositiry.findByDamTargetSystem("MHERE").get();
	mHereEntity.setDamHeaders(newToken);
	applicationMasterRepositiry.save(mHereEntity);
    token = fetchTokenFromDB();
}

private synchronized String fetchTokenFromDB() {
	
	LogWrapper.info(getClass(), "fetchTokenFromDB method execution started");
	return applicationMasterRepositiry.findByDamTargetSystem("MHERE").get().getDamHeaders();
}
private synchronized AccessToken getAccessToken() {
	LogWrapper.info(getClass(), "getAccessToken Service execution started");
	AccessToken accessToken = new AccessToken();
	
	try {
		JsonNode jsonNode = objectMapper.readTree(appConfig.getMHereFields().getDamserverIpUrl());
		String appId = jsonNode.get("appId").asText();
		String getProfileTokenUrl  = jsonNode.get("profileTokenUrl").asText();
		
		HttpHeaders header = new HttpHeaders();
		header.add("app_id", appId);

		ResponseEntity<AccessToken> response = restTemplate.exchange(getProfileTokenUrl, HttpMethod.GET, new HttpEntity<>(header),AccessToken.class);
		
		accessToken = response.getBody();
		
	} catch (Exception e) {
		LogWrapper.error(getClass(), "Token API catch : " + e.getMessage());
		accessToken.setToken("");
		return accessToken;
	}
	return accessToken;
}
}
