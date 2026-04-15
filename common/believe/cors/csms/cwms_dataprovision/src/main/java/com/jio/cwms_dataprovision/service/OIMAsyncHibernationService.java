package com.jio.cwms_dataprovision.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.constants.OIMActionEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.oim.Identity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.utils.CommonUtlis;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class OIMAsyncHibernationService {

	@Autowired
	CommonUtlis commonUtlis;
	
	@Autowired
	RestTemplate restTemplate;

	@Autowired
	ApplicationConfig appConfig;
	
	public EmployeeLog callAsyncOIAMHibernation (String payloadXml, EmployeeLog employeeLog,String transMode, boolean isNotPresentError) throws Exception {
		HttpHeaders headers = commonUtlis
				.headers(commonUtlis.jsonNodeResponse(appConfig.getOimApiField().getDamHeaders()));
		
		//String payloadXml = buildOimPayload(identityObject, request);
		
		if (isNotPresentError && (transMode.equalsIgnoreCase("MOD") || transMode.equalsIgnoreCase("VENMOD"))) {
			payloadXml = payloadXml.replaceAll(OIMActionEnum.valueOf(transMode).getValue(),
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
}
