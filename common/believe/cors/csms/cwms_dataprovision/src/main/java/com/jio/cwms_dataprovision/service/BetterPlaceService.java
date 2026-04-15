package com.jio.cwms_dataprovision.service;

import java.util.Iterator;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.dto.BPResponse;
import com.jio.cwms_dataprovision.dto.Response;
import com.jio.cwms_dataprovision.utils.CommonUtlis;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class BetterPlaceService {

	@Autowired
	RestTemplate restTemplate;
	
	@Autowired
	CommonUtlis commonUtlis;
	
	@Autowired
	ApplicationConfig appConfig;
	
	public BPResponse updateSystemResponseToBP(Response sysResponse, String clientTxnId) throws JsonMappingException, JsonProcessingException {

		//JSONObject headerValue = jsonNodeResponse(ApplicationConfig.getBetterPlace().getDamHeaders()).getJSONObject("");
		HttpHeaders headers = commonUtlis.headers(commonUtlis.jsonNodeResponse(appConfig.getBetterPlace().getDamHeaders()));
					headers.add("clientTxnId", clientTxnId);		 
		
		String betterPlace = appConfig.getBetterPlace().getDamProtocol() + CwmsConstants.protocolSeperator + appConfig.getBetterPlace().getDamserverIpUrl()
				+CwmsConstants.portSeperator+appConfig.getBetterPlace().getDamPort()+ appConfig.getBetterPlace().getDamEndpoint();
		//String betterPlace = "http://10.173.173.13:32103/ril-integration-callbacks/v1/emp_onboard_response";
		BPResponse response = restTemplate.exchange(
				betterPlace, HttpMethod.POST,
				new HttpEntity<Response>(sysResponse, headers),
				BPResponse.class).getBody();
		
		LogWrapper.info(getClass(), "BP Response : " + response.toString());
		
		return response;

	}

}
