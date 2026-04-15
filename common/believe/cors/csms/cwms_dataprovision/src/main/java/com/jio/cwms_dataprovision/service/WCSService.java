package com.jio.cwms_dataprovision.service;

import java.io.StringReader;
import java.time.LocalDateTime;

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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.jio.commons.messages.CommonsMessage;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.constants.AppConstant;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.System;
import com.jio.cwms_dataprovision.dto.wcs.Item;
import com.jio.cwms_dataprovision.entity.ApplicationMasterEntity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.utils.CommonUtlis;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class WCSService implements GeneralService{
	
	@Autowired
	RestTemplate restTemplate;
	
	@Autowired
	CommonUtlis commonUtlis;
	
	@Autowired
	ApplicationConfig appConfig;
	
	@Autowired
	EmployeeLogRepository employeeLogRepo;
	

	@Override
	public System executeService(GeneralRequest request) throws JsonProcessingException, Exception {
		
		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName(ServiceDataEnum.WCS.name());
		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());	
		employeeLog.setTransId(request.getClientTxnId());
		employeeLog.setTransMode(request.getResource_Details().getTransMode());
		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());
		
		System response = new System();
		response.setSystemName(ServiceDataEnum.WCS.name());
		response.setSystemStatus(AppConstant.sysStatusF);
		
		if (!appConfig.getWcsFields().isDamStatus()) {
			String cmnMessage = CommonsMessage.getErrorJsonResponseMessage("CWMS_Dataprovison_ERR","027");
			ObjectMapper objectMapper = new ObjectMapper();

			JsonNode jsonNode = objectMapper.readTree(cmnMessage);
			String message = jsonNode.get("msg").asText();
			String modifiedMessage = message.trim();
			((ObjectNode) jsonNode).put("message", modifiedMessage);
			
            response.setSystemMsg(modifiedMessage);
            response.setSystemStatus(CwmsConstants.sysStatusF);
            return response;
        }
		

		
		String wcsRequestBody = appConfig.getWcsFields().getDam_requestHeader();

		Item wcsRequestObject = new Item();
		wcsRequestObject.fromGeneralRequest(request);

		XmlMapper xmlMapper = new XmlMapper();
		String wcsRequest = xmlMapper.writeValueAsString(wcsRequestObject);
		String className = wcsRequestObject.getClass().getName();
		className = className.substring(className.lastIndexOf('.') + 1);
		wcsRequest = wcsRequest.replaceAll("<" + className + ">", "").replaceAll("</" + className + ">", "");


		wcsRequest = wcsRequest.replaceAll("<", "<sch:").replaceAll("sch:/", "/sch:");
		wcsRequest = wcsRequestBody.replaceAll("@RequestBody", wcsRequest);

		HttpHeaders headers = commonUtlis.headers(commonUtlis.jsonNodeResponse(appConfig.getWcsFields().getDamHeaders()));
		
		String url = appConfig.getWcsFields().getDamProtocol()+CwmsConstants.protocolSeperator+appConfig.getWcsFields().getDamserverIpUrl()
        +CwmsConstants.portSeperator+appConfig.getWcsFields().getDamPort() +appConfig.getWcsFields().getDamEndpoint();
		
		employeeLog.setRequest(wcsRequest);
		employeeLog.setRequestTime(LocalDateTime.now());
		
		String wcsResponse = "";
		try {
			LogWrapper.info(getClass(), wcsRequest);
			wcsResponse = restTemplate.exchange(
					url,
					HttpMethod.POST, new HttpEntity<String>(wcsRequest, headers), String.class).getBody();
			LogWrapper.info(getClass(), wcsResponse);
			
			DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
			InputSource src = new InputSource();
			src.setCharacterStream(new StringReader(wcsResponse));

			Document doc = builder.parse(src);
			
			if (doc.getElementsByTagName("ns0:status").item(0).getTextContent().equalsIgnoreCase("S")) {
				response.setSystemStatus(AppConstant.sysStatusS);
			}else {
				response.setSystemStatus(AppConstant.sysStatusF);
				response.setSystemMsg(doc.getElementsByTagName("ns0:message").item(0).getTextContent());
			}
			
		} catch (Exception e) {
			response.setSystemStatus(AppConstant.sysStatusF);
			LogWrapper.error(getClass(), e.getMessage());
		}
		finally {
			try {
				employeeLog.setResponse(wcsResponse);
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getSystemStatus());
				
				employeeLogRepo.save(employeeLog);
			}
			catch (Exception e) {
				LogWrapper.error(getClass(), e.getLocalizedMessage());
			}
		}
		
		
		return response;
	}	

}
