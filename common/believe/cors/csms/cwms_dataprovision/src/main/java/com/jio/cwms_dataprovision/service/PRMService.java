package com.jio.cwms_dataprovision.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Objects;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
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
import com.jio.cwms_dataprovision.dto.prm.CharacteristicsRequest;
import com.jio.cwms_dataprovision.dto.prm.DealerProfile;
import com.jio.cwms_dataprovision.dto.prm.PRMRequestResponse;
import com.jio.cwms_dataprovision.dto.prm.characteristicsdto.CharacteristicDto;
import com.jio.cwms_dataprovision.dto.prm.characteristicsdto.ResponseDto;
import com.jio.cwms_dataprovision.entity.ApplicationMasterEntity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.ApplicationMasterRepositiry;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.utils.CommonUtlis;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

import jakarta.annotation.PostConstruct;

@Service("prmService")
public class PRMService implements GeneralService {

	@Autowired
	RestTemplate restTemplate;

	@Autowired
	RarsService rarsService;

	@Autowired
	ApplicationMasterRepositiry appRepo;
	
	@Autowired
	CommonUtlis commonUtlis;
	
	@Autowired
	ApplicationConfig appConfig;
	
	@Autowired
	EmployeeLogRepository employeeLogRepo;
	
	@Autowired
	ObjectMapper objectMapper;
	

	@Override
	public System executeService(GeneralRequest request) throws Exception {
		
		String contractorName= request.getResource_Details().getContractor_Name();
		
		if (!StringUtils.isEmpty(contractorName) && contractorName.toLowerCase().contains("quess") ) {
			request.getResource_Details().setContractor_Code_PRM("660553571");
		}else if(!StringUtils.isEmpty(contractorName) && contractorName.toLowerCase().contains("kutumbh") ){
			request.getResource_Details().setContractor_Code_PRM("660553572");
		}
		
		System systemResponse = new System();
		systemResponse.setSystemName(ServiceDataEnum.PRM.toString());
		
		List<String> listTransMode= new ArrayList<String>();
		
		if(StringUtils.isEmpty(request.getResource_Details().getPrmID()) || request.getResource_Details().getPrmID().equals("0")) {
			if(request.getResource_Details().getTransMode().equalsIgnoreCase("TER")) {
				systemResponse.setSystemMsg("PRM ID not present in the received request");
				systemResponse.setSystemStatus(AppConstant.sysStatusF);
				return systemResponse;
			}
			else {
				listTransMode.add("ADD");
			}	
		}
		else {
			if(request.getResource_Details().getTransMode().equalsIgnoreCase("MOD")) {
				listTransMode.add("MOVE");	
			}
			listTransMode.add(request.getResource_Details().getTransMode());
			
		}
			
		
//		if(request.getResource_Details().getTransMode().equalsIgnoreCase("MOD")) {
//			
//			if(StringUtils.isEmpty(request.getResource_Details().getPrmID()) || request.getResource_Details().getPrmID().equals("0")) {
//				listTransMode.add("ADD");
//			}else {
//			listTransMode.add("MOVE");	
//			listTransMode.add(request.getResource_Details().getTransMode());
//			}
//		}
//		else {
//			listTransMode.add(request.getResource_Details().getTransMode());
//		}		
//		
//		
//		if (!StringUtils.equalsIgnoreCase(request.getResource_Details().getTransMode(), "ADD")  && (StringUtils.isEmpty(request.getResource_Details().getPrmID()) || request.getResource_Details().getPrmID().equals("0"))) {
//				
//				systemResponse.setSystemMsg("PRM ID not present in the received request");
//				systemResponse.setSystemStatus(AppConstant.sysStatusF);
//				return systemResponse;
//		}
		
					
		
		
		if (!appConfig.getPrmFields().isDamStatus()) {
			
			String cmnMessage = CommonsMessage.getErrorJsonResponseMessage("CWMS_Dataprovison_ERR","027");
			ObjectMapper objectMapper = new ObjectMapper();

			JsonNode jsonNode = objectMapper.readTree(cmnMessage);
			String message = jsonNode.get("msg").asText();
			String modifiedMessage = message.trim();
			((ObjectNode) jsonNode).put("message", modifiedMessage);
			
			systemResponse.setSystemMsg(modifiedMessage);
			systemResponse.setSystemStatus(CwmsConstants.sysStatusF);
            return systemResponse;
        }
		
		//Get Characteristics of an PRM Employee API call
			
		Map<String, String> characterMap = new HashMap<>();
		
		for (String transMode : listTransMode) {
			
		if (transMode.equalsIgnoreCase("MOD") && !StringUtils.isEmpty(request.getResource_Details().getPrmID())) {
		   EmployeeLog employeeLogCharFetch = new EmployeeLog();
		   employeeLogCharFetch.setSystemName(ServiceDataEnum.PRM.name() + "-CharacterFetch");
		   employeeLogCharFetch.setEmpId(request.getResource_Details().getWorkerCode());
		   employeeLogCharFetch.setTransId(request.getClientTxnId());
		   employeeLogCharFetch.setApprovalStatus(request.getResource_Details().getApproval_Status());
		   employeeLogCharFetch.setTransMode(transMode);
		   employeeLogCharFetch.setRemark("CharacterFetch API call before actual PRM call");
		   employeeLogCharFetch.setStatus(AppConstant.sysStatusS);
           
//		   String url = "http://tibesbsit.bss.sit.jio.com:10240/dealerinquiry/queryDealerprofile";
		   CharacteristicsRequest characteristicsRequest = new CharacteristicsRequest();
		   characteristicsRequest.fromCharacteristicsRequest(request.getResource_Details().getPrmID());
           
		   employeeLogCharFetch.setRequest(objectMapper.writeValueAsString(characteristicsRequest));
		   employeeLogCharFetch.setRequest(characteristicsRequest.toString());
		   employeeLogCharFetch.setRequestTime(LocalDateTime.now());
           
		   HttpHeaders Requestheaders = new HttpHeaders();
		   Requestheaders.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
		   Requestheaders.setContentType(MediaType.APPLICATION_JSON);
		   Requestheaders.add("channel-id", "ZB");
           
		   HttpEntity<CharacteristicsRequest> RequestEntity = new HttpEntity<>(characteristicsRequest, Requestheaders);
           
		   ResponseEntity<ResponseDto> responseEntity = null;

			try {
				
				ApplicationMasterEntity appDetails = appRepo.findByDamTargetSystem("PRM_Char").get();
				
				String url = appDetails.getDamProtocol() + CwmsConstants.protocolSeperator + appDetails.getDamserverIpUrl() 
																+ CwmsConstants.portSeperator + appDetails.getDamPort()
																+ CwmsConstants.urlSeperator + appDetails.getDamEndpoint();
				
				LogWrapper.info(getClass(), "Calling Characteristic of Dealer Profile API at: " + url);

//			    responseEntity = restTemplate.exchange(url,HttpMethod.POST,RequestEntity,ResponseDto.class);
				
				responseEntity = executeWithRetry(url, HttpMethod.POST, RequestEntity, ResponseDto.class);

				
				if (responseEntity != null && StringUtils.equalsIgnoreCase(responseEntity.getBody().getResultStatus().getStatus(), "SUCCESS")  && responseEntity.getBody() != null) {
					LogWrapper.info(getClass(),"Characteristic of Dealer Profile API call successful: {}" + responseEntity.getStatusCode());
					characterMap = extractCharacteristics(responseEntity.getBody());
					employeeLogCharFetch.setResponse(objectMapper.writeValueAsString(characterMap));
				} else {
					employeeLogCharFetch.setStatus(AppConstant.sysStatusF);
					employeeLogCharFetch.setResponse(objectMapper.writeValueAsString(responseEntity.getBody()));
					employeeLogCharFetch.setRemark(responseEntity.getBody().getResultStatus().getErrorMessage());
					systemResponse.setSystemMsg(responseEntity.getBody().getResultStatus().getErrorMessage());
					systemResponse.setSystemStatus(AppConstant.sysStatusF);
					return systemResponse;
				}

			} catch (Exception ex) {
				LogWrapper.error(getClass(), "Unexpected error during Characteristic API: " + ex.getMessage());
				employeeLogCharFetch.setStatus(AppConstant.sysStatusF);
				employeeLogCharFetch.setRemark("CharacterFetch API-call Failed before actual PRM call");
				systemResponse.setSystemMsg("PRM CharacterFetch API-call Failed before actual PRM call");
				systemResponse.setSystemStatus(AppConstant.sysStatusF);
				return systemResponse;
			} finally {
				 try {
					 employeeLogCharFetch.setResponseTime(LocalDateTime.now());
					 employeeLogRepo.save(employeeLogCharFetch);
				 }catch (Exception e) {
					 LogWrapper.error(getClass(), "Error saving employeeLogCharFetch: " + e.getMessage());
				}
			}
		}
		
		
			EmployeeLog employeeLog = new EmployeeLog();
			employeeLog.setSystemName(ServiceDataEnum.PRM.name());
			employeeLog.setEmpId(request.getResource_Details().getWorkerCode());	
			employeeLog.setTransId(request.getClientTxnId());
		
			employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());
			
			employeeLog.setTransMode(transMode);
			
			systemResponse.setSystemStatus(AppConstant.sysStatusS);
			employeeLog.setStatus(AppConstant.sysStatusS);

		DealerProfile dealerProfile = new DealerProfile();
		dealerProfile.fromGeneralRequest(request, transMode, characterMap);
		
		PRMRequestResponse prmRequest = new PRMRequestResponse(dealerProfile);
		
		employeeLog.setRequest(objectMapper.writeValueAsString(prmRequest));
		employeeLog.setRequestTime(LocalDateTime.now());

		HttpHeaders headers = commonUtlis.headers(commonUtlis.jsonNodeResponse(appConfig.getPrmFields().getDamHeaders()));
		ResponseEntity<PRMRequestResponse>  apiResponse = null;
		try {

			ApplicationMasterEntity appDetails = appRepo.findByDamTargetSystem(ServiceDataEnum.PRM.toString()).get();
			LogWrapper.info(getClass(), "PRM Request" + new PRMRequestResponse(dealerProfile).toString());
			LogWrapper.info(getClass(), "PRM Request JSON " + new HttpEntity<PRMRequestResponse>(new PRMRequestResponse(dealerProfile), headers));
			
			String apiCallUrl = appDetails.getDamProtocol() + CwmsConstants.protocolSeperator + appDetails.getDamserverIpUrl() 
															+ CwmsConstants.portSeperator + appDetails.getDamPort()
													 	    + CwmsConstants.urlSeperator + appDetails.getDamEndpoint();		
			
			apiResponse = executeWithRetry(apiCallUrl, HttpMethod.valueOf(appDetails.getDamRequestType()), new HttpEntity<PRMRequestResponse>(prmRequest, headers), PRMRequestResponse.class);
			
			if (apiResponse != null && apiResponse.getBody() != null) {
				
			   ObjectMapper mapper = new ObjectMapper();
			   LogWrapper.info(getClass(), "PRM Response Status" + apiResponse.getBody().getResultStatus().getStatus());
			   LogWrapper.info(getClass(), "PRM Response" + mapper.writeValueAsString(apiResponse.getBody()));
               
			   systemResponse.setRefNo(apiResponse.getBody().getDealerProfile().getTransaction().getTransactionRefNo() == null
			   		? apiResponse.getBody().getResultStatus().getErrorMessage()
			   		: apiResponse.getBody().getDealerProfile().getTransaction().getTransactionRefNo());
			   HashMap<String, String> agentValue = (HashMap<String, String>) apiResponse.getBody().getDealerProfile().getOrganization()
			   		.getLocation().getAgent();
			   systemResponse.setPrm_id(agentValue.get("id"));
			   request.getResource_Details().setPrmID(systemResponse.getPrm_id());
               
			   if (apiResponse.getBody().getResultStatus().getStatus().equalsIgnoreCase("F")) {
			   	systemResponse.setSystemStatus(AppConstant.sysStatusF);
			   	employeeLog.setStatus(AppConstant.sysStatusF);
			   }
			}else {
			    LogWrapper.error(getClass(), "PRM API call failed after retries, no response received");
			    systemResponse.setSystemStatus(AppConstant.sysStatusF);
			    employeeLog.setStatus(AppConstant.sysStatusF);
			    employeeLog.setRemark("PRM API failed after retries");
			}
		} catch (Exception e) {
			LogWrapper.error(getClass(), e.getMessage());
			systemResponse.setSystemStatus(AppConstant.sysStatusF);
			employeeLog.setStatus(AppConstant.sysStatusF);
		}
		finally {
			try {
				employeeLog.setResponse( (apiResponse == null || apiResponse.getBody()==null) ? "" : objectMapper.writeValueAsString(apiResponse.getBody()));
				employeeLog.setResponseTime(LocalDateTime.now());
				
				employeeLogRepo.save(employeeLog);
			}
			catch (Exception e) {
				LogWrapper.error(getClass(), e.getLocalizedMessage());
			}
		}
		}

		// rarsService.executeService(request);

		return systemResponse;
	}
	
		public JsonNode jsonNodeResponse(String jsonString) throws JsonMappingException, JsonProcessingException {
		
		ObjectMapper objectMapper = new ObjectMapper();
	    JsonNode jsonNode = objectMapper.readTree(jsonString);
	    		
	    return jsonNode;
	}
		
	public static Map<String, String> extractCharacteristics(ResponseDto response) {
		if (response == null || response.getDealerProfile() == null
							 || response.getDealerProfile().getOrganizations() == null) {
			return Collections.emptyMap();
		}

		return response.getDealerProfile()
				.getOrganizations().stream()
				.filter(Objects::nonNull)
				.flatMap(org -> org.getLocation() != null ? org.getLocation().stream() : Stream.empty()) // safe flatMap for locations
				.filter(Objects::nonNull)
				.flatMap(location -> {
					if (location.getListOfAgents() == null || location.getListOfAgents().getAgent() == null) {
						return Stream.empty();
					}
					return location.getListOfAgents().getAgent().stream();
				}).filter(Objects::nonNull)
				  .flatMap(agent -> {
					if (agent.getCharacteristics() == null || agent.getCharacteristics().getCharacteristic() == null) {
						return Stream.empty();
					}
					return agent.getCharacteristics().getCharacteristic().stream();
				}).filter(Objects::nonNull)
				  .filter(c -> c.getName() != null && c.getValue() != null)
				  .collect(Collectors.toMap(CharacteristicDto::getName, 
						  					CharacteristicDto::getValue,
						  					(existing, replacement) -> replacement // last wins on duplicate names
				));
	}

	private <T> ResponseEntity<T> executeWithRetry(String url, HttpMethod method, HttpEntity<?> requestEntity, Class<T> responseType) {
		
		int maxRetries = 3;
		int attempt = 0;
		Exception lastException = null;

		while (attempt < maxRetries) {
			try {
				return restTemplate.exchange(url, method, requestEntity, responseType);
			} catch (Exception e) {
				attempt++;
				lastException = e;
				LogWrapper.error(getClass(), "API call failed on attempt " + attempt + " for URL " + url + ": " + e.getMessage());

				if (attempt >= maxRetries) {
					LogWrapper.error(getClass(), "Max retries reached for URL: " + url);
					break;
				}
				try {
	                Thread.sleep(1000); // short delay between retries
	            } catch (InterruptedException ie) {
	                Thread.currentThread().interrupt();
	            }
			}
		}
		return null; 
	}

}
