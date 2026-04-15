//package com.jio.cwms_dataprovision.service;
//
//import java.security.KeyManagementException;
//import java.security.KeyStoreException;
//import java.security.NoSuchAlgorithmException;
//import java.time.LocalDateTime;
//import java.util.List;
//
//import org.apache.commons.lang3.StringUtils;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.HttpEntity;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.HttpMethod;
//import org.springframework.http.ResponseEntity;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//
//import com.fasterxml.jackson.core.JsonProcessingException;
//import com.fasterxml.jackson.databind.JsonNode;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.jio.cwms_dataprovision.config.ApplicationConfig;
//import com.jio.cwms_dataprovision.constants.AppConstant;
//import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
//import com.jio.cwms_dataprovision.dto.GeneralRequest;
//import com.jio.cwms_dataprovision.dto.System;
//import com.jio.cwms_dataprovision.dto.grc.CookieRequestDto;
//import com.jio.cwms_dataprovision.dto.grc.UserTerminationRequest;
//import com.jio.cwms_dataprovision.dto.grc.UserTerminationResponse;
//import com.jio.cwms_dataprovision.entity.EmployeeLog;
//import com.jio.cwms_dataprovision.entity.GrcLog;
//import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
//import com.jio.cwms_dataprovision.repository.GrcLogRepository;
//import com.jio.cwms_dataprovision.wrapper.LogWrapper;
//import org.apache.hc.core5.ssl.TrustStrategy;
//import org.apache.hc.core5.ssl.SSLContexts;
//import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
//import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
//import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
//import org.apache.hc.client5.http.io.HttpClientConnectionManager;
//import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
//import org.apache.hc.client5.http.impl.classic.HttpClients;
//import javax.net.ssl.SSLContext;
//import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
//
//@Service
//public class GrcTerminationService implements GeneralService{
//	
//	@Autowired
//	EmployeeLogRepository employeeLogRepo;
//	
//	@Autowired
//	GrcLogRepository grcLogRepository;
//	
//	@Autowired
//	ObjectMapper objectMapper;
//
//	RestTemplate restTemplate;
//	
//	@Autowired
//	ApplicationConfig appConfig;
//
//	public GrcTerminationService() throws KeyManagementException, NoSuchAlgorithmException, KeyStoreException {
//
//		TrustStrategy acceptingTrustStrategy = (x509Certificates, s) -> true;
//	    SSLContext sslContext = SSLContexts.custom().loadTrustMaterial(null, acceptingTrustStrategy).build();
//	    SSLConnectionSocketFactory csf = new SSLConnectionSocketFactory(sslContext, new NoopHostnameVerifier());
//	    HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
//	    HttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create().setSSLSocketFactory(csf).build();
//	    CloseableHttpClient httpClient = HttpClients.custom().setConnectionManager(connectionManager).build();
//	    requestFactory.setHttpClient(httpClient);
//	    restTemplate = new RestTemplate(requestFactory);
//
//	}
//	
//	@Override
//	public System executeService(GeneralRequest request) throws JsonProcessingException, Exception {
//		String cookieHeader = null;
//		
//		HttpHeaders headers = new HttpHeaders();
//		headers.add("Content-Type", "application/json");
//		
//		ObjectMapper objectMapper = new ObjectMapper();
//		JsonNode jsonNode = objectMapper.readTree(appConfig.getGrcField().getDamserverIpUrl());
//		String url = jsonNode.get("cookieUrl").asText();
//		String cookieUrl = url;
//		
//		CookieRequestDto requestBody = new CookieRequestDto();
//		
//		requestBody.setUsername(appConfig.getGrcField().getDamUsername());
//		requestBody.setPassword(appConfig.getGrcField().getDamPassword());
//		
//		EmployeeLog employeeLog = new EmployeeLog();
//		employeeLog.setSystemName(ServiceDataEnum.GRC.name());
//		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());	
//		employeeLog.setTransId(request.getClientTxnId());
//		employeeLog.setTransMode(request.getResource_Details().getTransMode());
//		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());
//		
//		LogWrapper.info(getClass(), "Get Cookie API call Started");
//		try {
//			
//			ResponseEntity<String> response = restTemplate.exchange(cookieUrl,HttpMethod.POST,new HttpEntity<CookieRequestDto>(requestBody, headers), String.class);
//			List<String> responseHeaderList = response.getHeaders().get("Set-Cookie");
//			 if (responseHeaderList.size()==0) {
//				 LogWrapper.info(getClass(), "Set-Cookie list Empty");
//			 }
//			for(int i = 0; i < responseHeaderList.size(); i++){
//				String subString = responseHeaderList.get(i);
//				 
//				if(StringUtils.containsAny("MYSSO", subString.split(";")[0]) ) {
//					cookieHeader=subString.split(";")[0];
//					break;
//				}
//			}
//		} catch (Exception e) {
//			LogWrapper.error(getClass(), e.getMessage());
//		}
//		LogWrapper.info(getClass(), "Get Cookie API call Ended");
//		
//		//userTermination API call
//		LogWrapper.info(getClass(), "User Termination API call started for :: " + request.getResource_Details().getWorkerCode());
//		System response = new System();
//		headers.add("Cookie", cookieHeader);
//		LogWrapper.info(getClass(), "Cookie header set for User Termination API");
//		
//		UserTerminationRequest userTerminationRequest= new UserTerminationRequest();
//		 userTerminationRequest.setUserId(request.getResource_Details().getWorkerCode());
//		 
//		 employeeLog.setRequest(userTerminationRequest.toString());
//		 employeeLog.setRequestTime(LocalDateTime.now());
//
//		 String userTerminationURL = jsonNode.get("userTerminationURL").asText();
//		 
//		UserTerminationResponse terResponse = new UserTerminationResponse();
//		try {
//			terResponse = restTemplate.exchange(userTerminationURL, HttpMethod.POST, new HttpEntity<UserTerminationRequest>(userTerminationRequest,headers),UserTerminationResponse.class ).getBody();
//			grcLog(terResponse,request);
//			
//			response.setSystemName("GRC Termination");
//			response.setSystemMsg(terResponse.getData().getResult().getEtRetrun().get(0).getMessage());
//			response.setSystemStatus(AppConstant.sysStatusS);
//		} catch (Exception e) {
//			LogWrapper.error(getClass(), e.getMessage());
//			response.setSystemName("GRC Termination");
//			response.setSystemStatus(AppConstant.sysStatusF);
//		}finally {
//			try {
//				employeeLog.setResponse(objectMapper.writeValueAsString(terResponse));
//				employeeLog.setResponseTime(LocalDateTime.now());
//				employeeLog.setStatus(response.getSystemStatus());
//				
//				employeeLogRepo.save(employeeLog);
//			}
//			catch (Exception e) {
//				LogWrapper.error(getClass(), e.getLocalizedMessage());
//			}
//		}
//		
//		return response;
//	}
//	
//	private void grcLog(UserTerminationResponse terResponse,GeneralRequest request) {
//		try{
//			GrcLog grclog = new GrcLog();
//			grclog.setScrumId(request.getResource_Details().getWorkerCode());
//			grclog.setEPName(request.getResource_Details().getName_as_per_Aadhar());
//			grclog.setTerminationDate(request.getResource_Details().getTermination_Date());
//			grclog.setProcessedon(LocalDateTime.now());
//			grclog.setTransRefCode(terResponse.getData().getResult().getEvReqNo());
//			grclog.setResponseMessage(terResponse.getData().getResult().getEtRetrun().get(0).getMessage());
//			
//			grcLogRepository.save(grclog);
//			LogWrapper.info(getClass(), "Logged entry into grcterminaiton_log || ID : " + grclog.getScrumId() + "Message : " + grclog.getResponseMessage());
//		}catch(Exception e) {
//			LogWrapper.error(getClass(), "Failed to insert into grcterminaitonlogs "+ e.getMessage());
//		}
//	}
//}
