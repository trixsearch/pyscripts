package com.jio.cwms_dataprovision.service;

import java.io.StringReader;
import java.time.LocalDateTime;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.jio.commons.messages.CommonsMessage;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.constants.AppConstant;
import com.jio.cwms_dataprovision.constants.AppStatus;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.constants.OIMActionEnum;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.System;
import com.jio.cwms_dataprovision.dto.oim.Identity;
import com.jio.cwms_dataprovision.entity.AccessRequestLogEntity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.AcessRequestLogAsyncRepository;
import com.jio.cwms_dataprovision.repository.ApplicationMasterRepositiry;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.utils.CommonUtlis;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service("oimService")
public class OIMService implements GeneralService {

	@Autowired
	ApplicationMasterRepositiry appRepo;

	@Autowired
	RestTemplate restTemplate;

	@Autowired
	CommonUtlis commonUtlis;

	@Autowired
	ApplicationConfig appConfig;
	
	@Autowired
	EmployeeLogRepository employeeLogRepo;
	
//	@Autowired
//	AccessRequestLogService accessRequestLogService;
	
	@Autowired
	AccessRequestLogAsyncService accessRequestLogAsyncService;
	
	@Autowired
	AcessRequestLogAsyncRepository acessRequestLogAsyncRepository;

	@Override
	public System executeService(GeneralRequest request) throws Exception {

		System response = new System();
		response.setSystemName("OIM");
		response.setSystemStatus(AppConstant.sysStatusF);
		
//		String cmnMessage = "";
//		try {
//			cmnMessage = CommonsMessage.getErrorJsonResponseMessage("CWMS_Dataprovison_ERR", "027");
//			ObjectMapper objectMapper = new ObjectMapper();
//			JsonNode jsonNode = objectMapper.readTree(cmnMessage);
//			String message = jsonNode.get("msg").asText();
//			String modifiedMessage = message.trim();
//			((ObjectNode) jsonNode).put("message", modifiedMessage);
//			response.setSystemMsg(modifiedMessage);
//		}
//		catch (Exception e) {
//			LogWrapper.error(getClass(), e.getMessage());
//		}
		
		if (!appConfig.getOimApiField().isDamStatus()) {
			response.setSystemMsg("ServiceDisabled from Downstream");
			response.setSystemStatus(CwmsConstants.sysStatusF);
			return response;
		}
		
		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName(ServiceDataEnum.OIM.name());
		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());	
		employeeLog.setTransId(request.getClientTxnId());
		employeeLog.setTransMode(request.getResource_Details().getTransMode());
		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());
		String oimResponse = "";
		Identity identityObject = new Identity();
	    boolean isNotPresentError = false;
		
		try {
			if (request.getResource_Details().getTransMode().equals(AppStatus.TER.name())
					|| request.getResource_Details().getTransMode().equals(AppStatus.VENTER.name())) {
				identityObject.setUserLogin(request.getResource_Details().getWorkerCode());
			} else {
				if (request.getResource_Details().getTransMode().contains("VEN")) {
					identityObject.fromVENRequest(request);
				} else if (request.getResource_Details().getTransMode().equalsIgnoreCase("HIB")
				        && request.getResource_Details().getOrganization().equalsIgnoreCase("RR")){
			        identityObject.fromGeneralrequest(request);
			        String payloadXml = buildOimPayload(identityObject, request);
			        boolean isHibernationLogged =
			                accessRequestLogAsyncService.isRequestLogged(
			                        request, payloadXml, ServiceDataEnum.OIM.name());

			        if (isHibernationLogged) {
			            response.setSystemStatus(AppConstant.sysStatusS);
			            response.setSystemMsg("Hibernation request logged successfully");
			        } else {
			            response.setSystemStatus(AppConstant.sysStatusF);
			            response.setSystemMsg("Failed to log hibernation request");
			        }
			        return response;
			    }
				else if (request.getResource_Details().getTransMode().equalsIgnoreCase("DEHIB")
				        && request.getResource_Details().getOrganization().equalsIgnoreCase("RR")) {

				    LogWrapper.info(getClass(),
				            "[OIM-DEHIB] DEHIB request received for RR | EmpId={}"+
				            request.getResource_Details().getWorkerCode());

				    // 1. Check if any pending HIB request exists
				    List<AccessRequestLogEntity> hibRequests =
				            acessRequestLogAsyncRepository
				                    .findBySystemNameAndEmpIdAndSiteIDAndOrgIdAndTransModeAndStatus(
				                            ServiceDataEnum.OIM.name(),
				                            request.getResource_Details().getWorkerCode(),
				                            request.getResource_Details().getOrganization(),
				                            request.getResource_Details().getSiteID(),
				                            "HIB",
				                            AppConstant.sysStatusP
				                    );

				    // 2. Delete existing HIB request(s)
				    if (hibRequests != null && !hibRequests.isEmpty()) {
				        acessRequestLogAsyncRepository.deleteAll(hibRequests);

				        LogWrapper.info(getClass(),
				                "[OIM-DEHIB] Deleted {}"+hibRequests.size()+" pending HIB request(s) for EmpId={}"+
				                request.getResource_Details().getWorkerCode());
				    } else {
				        LogWrapper.info(getClass(),
				                "[OIM-DEHIB] No pending HIB request found for EmpId={}"+
				                request.getResource_Details().getWorkerCode());
				    }

				    // 3. Continue sync DEHIB flow
				    identityObject.fromGeneralrequest(request);
				}

				else {
					identityObject.fromRequest(request);
				}
			}
			employeeLog = callOIAM(identityObject, request, employeeLog, isNotPresentError);
			oimResponse = employeeLog.getResponse();

			DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
			InputSource src = new InputSource();
			src.setCharacterStream(new StringReader(oimResponse));

			Document doc = builder.parse(src);
			if (doc.getElementsByTagName("errorCode").item(0).getTextContent().equals("122")) {
				isNotPresentError = true;
				employeeLog = callOIAM(identityObject, request, employeeLog, isNotPresentError);
				oimResponse = employeeLog.getResponse();
				InputSource src3 = new InputSource();
				src3.setCharacterStream(new StringReader(oimResponse));
				doc = builder.parse(src3);
			}

			if (doc.getElementsByTagName("errorCode").item(0).getTextContent().equals("114")
					|| doc.getElementsByTagName("errorCode").item(0).getTextContent().equals("128")) {
				
				identityObject.setDistributionCenter("");
				employeeLog = callOIAM(identityObject, request, employeeLog, isNotPresentError);
				oimResponse = employeeLog.getResponse();
				InputSource src2 = new InputSource();
				src2.setCharacterStream(new StringReader(oimResponse));
				doc = builder.parse(src2);
			}

			response.setRefNo(doc.getElementsByTagName("requestID").item(0) == null
					? doc.getElementsByTagName("errorMsg").item(0).getTextContent()
					: doc.getElementsByTagName("requestID").item(0).getTextContent());

			response.setSystemStatus(doc.getElementsByTagName("operationStatus").item(0).getTextContent());

			LogWrapper.info(getClass(), "OIM Response Status " + response.getSystemStatus());
			LogWrapper.info(getClass(), "OIM Response " + oimResponse);

			if (doc.getElementsByTagName("requestID").item(0) != null) {
				response.setSystemStatus(AppConstant.sysStatusS);
			}

		} catch (Exception e) {
			LogWrapper.error(getClass(), e.getMessage());
			response.setSystemStatus(AppConstant.sysStatusF);
			
			request.setSingleService(ServiceDataEnum.OIM);
		}
		finally {
			try {
				if (request.getResource_Details().getTransMode().equalsIgnoreCase("HIB")
				        && request.getResource_Details().getOrganization().equalsIgnoreCase("RR")) {
		            LogWrapper.info(getClass(),
		                    "HIB (RR) flow completed. Skipping EmployeeLog persistence. "
		                    + "EmpCode=" + request.getResource_Details().getWorkerCode()
		                    + ", TxnId=" + request.getClientTxnId());
		           
		        }else {
				employeeLog.setResponse(oimResponse);
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getSystemStatus());
				
				request.setSingleService(ServiceDataEnum.OIM);
				employeeLogRepo.save(employeeLog);
				
//				if (AppConstant.sysStatusF.equalsIgnoreCase(response.getSystemStatus())) {
//		            request.setSingleService(ServiceDataEnum.OIM);
//		        }
			}
			}
			catch (Exception e) {
				LogWrapper.error(getClass(), e.getLocalizedMessage());
			}
		}
		return response;

	}
	
	private EmployeeLog callOIAM (Identity identityObject, GeneralRequest request, EmployeeLog employeeLog, boolean isNotPresentError) throws Exception {
		HttpHeaders headers = commonUtlis
				.headers(commonUtlis.jsonNodeResponse(appConfig.getOimApiField().getDamHeaders()));
		
		String payloadXml = buildOimPayload(identityObject, request);
		
		if (isNotPresentError && (request.getResource_Details().getTransMode().equalsIgnoreCase("MOD") || request.getResource_Details().getTransMode().equalsIgnoreCase("VENMOD"))) {
			payloadXml = payloadXml.replaceAll(OIMActionEnum.valueOf(request.getResource_Details().getTransMode()).getValue(),
					OIMActionEnum.ADD.getValue());
			payloadXml = payloadXml.replaceAll("</arg0>", "<userType>Contractor</userType></arg0>");
			payloadXml = payloadXml.replaceAll("<r4gState>", "<organization>RJIL</organization><r4gState>");
			payloadXml = payloadXml.replaceAll("</r4gState>", "</r4gState><sourceSystem>SCRUM</sourceSystem>");
		}
		employeeLog.setRequest(payloadXml);
		employeeLog.setRequestTime(LocalDateTime.now());
		
		LogWrapper.info(getClass(), "OIM Request  " + payloadXml);
		String oimResponse = restTemplate.exchange(
				appConfig.getOimApiField().getDamProtocol() + CwmsConstants.protocolSeperator
						+ appConfig.getOimApiField().getDamserverIpUrl() + CwmsConstants.urlSeperator
						+ appConfig.getOimApiField().getDamEndpoint(),
				HttpMethod.valueOf(appConfig.getOimApiField().getDamRequestType()),
				new HttpEntity<String>(payloadXml, headers), String.class).getBody();
		
		employeeLog.setResponse(oimResponse);
		return employeeLog;
	}
	private String buildOimPayload(Identity identityObject, GeneralRequest request) throws Exception {

	    XmlMapper xmlMapper = new XmlMapper();
	    String oimRequest = xmlMapper.writeValueAsString(identityObject);

	    String className = identityObject.getClass().getSimpleName();
	    oimRequest = oimRequest.replace("<" + className + ">", "")
	                           .replace("</" + className + ">", "");

	    return appConfig.getOimApiField().getDam_requestHeader()
	            .replace("@username", appConfig.getOimApiField().getDamUsername())
	            .replace("@password", appConfig.getOimApiField().getDamPassword())
	            .replace("@request", oimRequest)
	            .replace("@transmode",
	                    OIMActionEnum.valueOf(
	                            request.getResource_Details().getTransMode()).getValue());
	}


}
