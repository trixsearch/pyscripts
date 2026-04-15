package com.jio.cwms_dataprovision.service;

import java.io.StringReader;
import java.time.LocalDateTime;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.commons.lang3.StringUtils;
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
import com.jio.cwms_dataprovision.dto.cua.NJDetails;
import com.jio.cwms_dataprovision.dto.cua.OfficialData;
import com.jio.cwms_dataprovision.dto.cua.PTDetails;
import com.jio.cwms_dataprovision.dto.cua.PersonalData;
import com.jio.cwms_dataprovision.dto.cua.PersonalDataTerRequest;
import com.jio.cwms_dataprovision.entity.ApplicationMasterEntity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.utils.CommonUtlis;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class CUAService implements GeneralService {

	@Autowired
	RestTemplate restTemplate;

	@Autowired
	CommonUtlis commonUtlis;

	@Autowired
	ApplicationConfig appConfig;

	@Autowired
	EmployeeLogRepository employeeLogRepo;

	private List<String> mandiList = List.of("PPRR00427661", "PPRR00430327", "PPRR00053594", "PPRR00558025",
			"PPRR00400730", "PPRR00008751", "PPRR00009327", "PPRR00427661", "PPRR00367764", "PPRR00585325");

	@Override
	public System executeService(GeneralRequest request) throws JsonProcessingException, Exception {

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName(ServiceDataEnum.CUA.name());
		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());
		employeeLog.setTransId(request.getClientTxnId());
		employeeLog.setTransMode(request.getResource_Details().getTransMode());
		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());

		System response = new System();
		response.setSystemName(ServiceDataEnum.CUA.name());
		response.setSystemStatus(AppConstant.sysStatusF);

		if (mandiList.contains(request.getResource_Details().getWorkerCode())) {
			response.setSystemMsg("mandi Emp");
			employeeLog.setResponse("mandi Emp");

			try {
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getSystemStatus());

				LogWrapper.info(getClass(), employeeLog.toString());
				employeeLogRepo.save(employeeLog);
			} catch (Exception e) {
				LogWrapper.error(getClass(), e.getLocalizedMessage());
			}

			return response;
		}

		if (!appConfig.getCuaField().isDamStatus()) {
			String cmnMessage = CommonsMessage.getErrorJsonResponseMessage("CWMS_Dataprovison_ERR", "027");
			ObjectMapper objectMapper = new ObjectMapper();

			JsonNode jsonNode = objectMapper.readTree(cmnMessage);
			String message = jsonNode.get("msg").asText();
			String modifiedMessage = message.trim();
			((ObjectNode) jsonNode).put("message", modifiedMessage);
			response.setSystemMsg(modifiedMessage);
			response.setSystemStatus(CwmsConstants.sysStatusF);
			return response;
		}
		
		String username = "";
		
		if (!StringUtils.isEmpty(request.getResource_Details().getZ5Code()) && appConfig.getCuaField().getDamSiteService().contains(request.getResource_Details().getZ5Code())) {
			username = (StringUtils.isEmpty(request.getResource_Details().getPrmID()) || request.getResource_Details().getPrmID().equals("0")) ? request.getResource_Details().getWorkerCode() : ( "T" + request.getResource_Details().getPrmID());
		}
		else {
			username = request.getResource_Details().getWorkerCode();
		}
		
		String cuaRequestBody = "";
		if (request.getResource_Details().getTransMode().equals("TER")) {
			cuaRequestBody = commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDam_requestHeader())
					.get("terminationRequest").asText();
		} else {
			cuaRequestBody = commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDam_requestHeader())
					.get("executeService").asText();

		}

		String personalData = "";
		String cuaRequest = "";

		if (request.getResource_Details().getTransMode().equals("TER")) {
			PersonalDataTerRequest personalDataObj = new PersonalDataTerRequest();
			personalDataObj.fromGeneralRequest(request, username);
			XmlMapper xmlMapper = new XmlMapper();
			personalData = xmlMapper.writeValueAsString(personalDataObj);
			String className = personalDataObj.getClass().getName();
			className = className.substring(className.lastIndexOf('.') + 1);
			personalData = personalData.replaceAll("<" + className + ">", "").replaceAll("</" + className + ">", "");
			cuaRequest = cuaRequestBody.replace("@terminationData", personalData);

		} else {

			PersonalData personalDataObject = new PersonalData();
			personalDataObject.fromGeneralRequest(request, username);
			XmlMapper xmlMapper = new XmlMapper();
			personalData = xmlMapper.writeValueAsString(personalDataObject);
			String className = personalDataObject.getClass().getName();
			className = className.substring(className.lastIndexOf('.') + 1);
			personalData = personalData.replaceAll("<" + className + ">", "").replaceAll("</" + className + ">", "");

//		if (request.getResource_Details().getTransMode().equals("TER")) {
//			
//			personalData = personalData.replace("</sch:PERNR>",
//					"</sch:PERNR> \r\n <sch:GLTGV>?</sch:GLTGV>\r\n" + "               <sch:GLTGB>"
//							+ request.getResource_Details().getTermination_Date().replaceAll("-", "") + "</sch:GLTGB>\r\n");
//		}

			OfficialData officialDataObject = new OfficialData();
			officialDataObject.fromGeneralRequest(request, username);
			String officialData = xmlMapper.writeValueAsString(officialDataObject);
			className = officialDataObject.getClass().getName();
			className = className.substring(className.lastIndexOf('.') + 1);
			officialData = officialData.replaceAll("<" + className + ">", "").replaceAll("</" + className + ">", "");

			cuaRequest = cuaRequestBody.replace("@PersonalData", personalData).replace("@OfficialData", officialData);
		}

		employeeLog.setRequest(cuaRequest);
		employeeLog.setRequestTime(LocalDateTime.now());

		// HttpHeaders headers =
		// headers(jsonNodeResponse(ApplicationConfig.getCuaField().getDam_requestHeader()).get("CUA"));
		String cuaResponse = "";

		try {

			HttpHeaders headers = commonUtlis
					.headers(commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDamHeaders()).get("cua"));

			LogWrapper.info(getClass(), cuaRequest);

			String url = appConfig.getCuaField().getDamProtocol() + CwmsConstants.protocolSeperator
					+ appConfig.getCuaField().getDamserverIpUrl() + CwmsConstants.portSeperator
					+ commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDamPort()).get("executeService").asText()
					+ appConfig.getCuaField().getDamEndpoint() + "GET_EMP_DETAILS";
			cuaResponse = restTemplate
					.exchange(url, HttpMethod.POST, new HttpEntity<String>(cuaRequest, headers), String.class)
					.getBody();

			LogWrapper.info(getClass(), cuaResponse);

			DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
			InputSource src = new InputSource();
			src.setCharacterStream(new StringReader(cuaResponse));

			Document doc = builder.parse(src);

			if (doc.getElementsByTagName("ns0:Type").item(0).getTextContent().equalsIgnoreCase("S")) {
				response.setSystemStatus(AppConstant.sysStatusS);
				if (request.getResource_Details().getTransMode().equalsIgnoreCase("ADD")) {
					response = njCall(request, response, username);
				} else if (request.getResource_Details().getTransMode().equalsIgnoreCase("MOD")) {
					response = ptCall(request, response, username);
				}
			} else {
				response.setSystemStatus(AppConstant.sysStatusF);
				response.setSystemMsg(doc.getElementsByTagName("ns0:Message").item(0).getTextContent());
			}

		} catch (Exception e) {
			LogWrapper.error(getClass(), e.getMessage());
			response.setSystemStatus(AppConstant.sysStatusF);
		} finally {
			try {
				employeeLog.setResponse(cuaResponse);
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getSystemStatus());

				LogWrapper.info(getClass(), employeeLog.toString());
				employeeLogRepo.save(employeeLog);
			} catch (Exception e) {
				LogWrapper.error(getClass(), e.getLocalizedMessage());
			}
		}

		return response;
	}

	private System njCall(GeneralRequest request, System response,String username) throws Exception {

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("CUA_NJ");
		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());
		employeeLog.setTransId(request.getClientTxnId());
		employeeLog.setTransMode(request.getResource_Details().getTransMode());
		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());

		String njRequestBody = commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDam_requestHeader())
				.get("njCall").asText();
		NJDetails njDetails = new NJDetails();
		njDetails.fromGeneralRequst(request, username);

		XmlMapper xmlMapper = new XmlMapper();
		String njRequest = xmlMapper.writeValueAsString(njDetails);
		String className = njDetails.getClass().getName();
		className = className.substring(className.lastIndexOf('.') + 1);
		njRequest = njRequest.replaceAll("<" + className + ">", "").replaceAll("</" + className + ">", "");

		njRequest = njRequestBody.replace("@NJData", njRequest);

		// JsonNode headersValue =
		// jsonNodeResponse(ApplicationConfig.getCuaField().getDamHeaders()).get("njCall");

		HttpHeaders headers = commonUtlis
				.headers(commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDamHeaders()).get("njCall"));

		employeeLog.setRequest(njRequest);
		employeeLog.setRequestTime(LocalDateTime.now());
		LogWrapper.info(getClass(), njRequest);

		String url = appConfig.getCuaField().getDamProtocol() + CwmsConstants.protocolSeperator
				+ appConfig.getCuaField().getDamserverIpUrl() + CwmsConstants.portSeperator
				+ commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDamPort()).get("njcall").asText()
				+ appConfig.getCuaField().getDamEndpoint() + "Service.serviceagent/AuthDataEndpoint1";
		String njResponse = restTemplate
				.exchange(url, HttpMethod.POST, new HttpEntity<String>(njRequest, headers), String.class).getBody();
		LogWrapper.info(getClass(), njResponse);

		DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
		InputSource src = new InputSource();
		src.setCharacterStream(new StringReader(njResponse));

		Document doc = builder.parse(src);

		if (!doc.getElementsByTagName("ns0:TYPE").item(0).getTextContent().equalsIgnoreCase("S")) {
			response.setSystemStatus(AppConstant.sysStatusF);
			response.setSystemMsg("njCall :  " + doc.getElementsByTagName("ns0:MESSAGE").item(0).getTextContent());
		}

		try {
			employeeLog.setResponse(njResponse);
			employeeLog.setResponseTime(LocalDateTime.now());
			employeeLog.setStatus(response.getSystemStatus());

			employeeLogRepo.save(employeeLog);
		} catch (Exception e) {
			LogWrapper.error(getClass(), e.getLocalizedMessage());
		}

		return response;

	}

	private System ptCall(GeneralRequest request, System response, String username) throws Exception {

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("CUA_PT");
		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());
		employeeLog.setTransId(request.getClientTxnId());
		employeeLog.setTransMode(request.getResource_Details().getTransMode());
		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());

		String ptRequestBody = commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDam_requestHeader())
				.get("ptCall").asText();

		PTDetails ptDetails = new PTDetails();
		ptDetails.fromGeneralRequest(request, username);

		XmlMapper xmlMapper = new XmlMapper();
		String ptRequest = xmlMapper.writeValueAsString(ptDetails);
		String className = ptDetails.getClass().getName();
		className = className.substring(className.lastIndexOf('.') + 1);
		ptRequest = ptRequest.replaceAll("<" + className + ">", "").replaceAll("</" + className + ">", "");

		ptRequest = ptRequestBody.replace("@PTData", ptRequest);

		HttpHeaders headers = commonUtlis
				.headers(commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDamHeaders()).get("ptCall"));

		employeeLog.setRequest(ptRequest);
		employeeLog.setRequestTime(LocalDateTime.now());
//		employeeLog.setRemark(mapper.writeValueAsString(ptDetails) + "         \n" + ptRequest);
		LogWrapper.info(getClass(), ptRequest);
		String ptResponse = "";
		try {
			String url = appConfig.getCuaField().getDamProtocol() + CwmsConstants.protocolSeperator
					+ appConfig.getCuaField().getDamserverIpUrl() + CwmsConstants.portSeperator
					+ commonUtlis.jsonNodeResponse(appConfig.getCuaField().getDamPort()).get("ptCall").asText()
					+ appConfig.getCuaField().getDamEndpoint() + "Service.serviceagent/AuthDataEndpoint1";

			ptResponse = restTemplate
					.exchange(url, HttpMethod.POST, new HttpEntity<String>(ptRequest, headers), String.class).getBody();
			LogWrapper.info(getClass(), ptResponse);

			DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
			InputSource src = new InputSource();
			src.setCharacterStream(new StringReader(ptResponse));

			Document doc = builder.parse(src);

			if (!doc.getElementsByTagName("ns0:TYPE").item(0).getTextContent().equalsIgnoreCase("S")) {
				response.setSystemStatus(AppConstant.sysStatusF);
				response.setSystemMsg("ptCall : " + doc.getElementsByTagName("ns0:MESSAGE").item(0).getTextContent());
			}
			

		} catch (Exception e) {
			response.setSystemStatus(AppConstant.sysStatusF);
			e.printStackTrace();
			LogWrapper.info(getClass(), e.getLocalizedMessage());
		}
		finally {
			try {
				employeeLog.setResponse(ptResponse);
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getSystemStatus());

				employeeLogRepo.save(employeeLog);
			} catch (Exception e) {
				LogWrapper.error(getClass(), e.getLocalizedMessage());
			}
		}

		return response;

	}

}
