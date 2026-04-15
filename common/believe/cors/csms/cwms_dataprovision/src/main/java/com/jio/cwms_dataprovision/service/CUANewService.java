package com.jio.cwms_dataprovision.service;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Random;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.constants.AppConstant;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.System;
import com.jio.cwms_dataprovision.dto.cua_new.EmpAuthData;
import com.jio.cwms_dataprovision.dto.cua_new.EmpData;
import com.jio.cwms_dataprovision.dto.cua_new.ResEmpAuthData;
import com.jio.cwms_dataprovision.dto.cua_new.ResEmpData;
import com.jio.cwms_dataprovision.dto.cua_new.ResponseDataObj;
import com.jio.cwms_dataprovision.dto.cua_new.TData;
import com.jio.cwms_dataprovision.entity.AccessRequestLogEntity;
import com.jio.cwms_dataprovision.entity.ApplicationMasterEntity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.AcessRequestLogAsyncRepository;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
public class CUANewService implements GeneralService {

	@Autowired
	RestTemplate restTemplate;

	@Autowired
	ApplicationConfig appConfig;

	@Autowired
	EmployeeLogRepository employeeLogRepo;

	@Autowired
	ObjectMapper objectMapper;
	
	@Autowired
	AccessRequestLogAsyncService accessRequestLogAsyncService;
	
	@Autowired
	AcessRequestLogAsyncRepository acessRequestLogAsyncRepository;
	
	private List<String> mandiList = List.of("PPRR00427661", "PPRR00430327", "PPRR00053594", "PPRR00558025",
			"PPRR00400730", "PPRR00008751", "PPRR00009327", "PPRR00427661", "PPRR00367764", "PPRR00585325");

	@Override
	public System executeService(GeneralRequest request) throws JsonProcessingException, Exception {

		if (request.getResource_Details().getSiteID().equalsIgnoreCase("RR") && (StringUtils.isEmpty(request.getResource_Details().getWorkerCode())
				|| StringUtils.isEmpty(request.getResource_Details().getDate_of_Joining())
				|| StringUtils.isEmpty(request.getResource_Details().getSite_Code())
				|| StringUtils.isEmpty(request.getResource_Details().getJob_Code())
				|| StringUtils.isEmpty(request.getResource_Details().getBusiness_Code())
				|| StringUtils.isEmpty(request.getResource_Details().getSegment_Code())
				|| StringUtils.isEmpty(request.getResource_Details().getFamily_Code())
				|| StringUtils.isEmpty(request.getResource_Details().getClass_Code())
				|| StringUtils.isEmpty(request.getResource_Details().getFirst_Name())
				|| StringUtils.isEmpty(request.getResource_Details().getEmail_ID()))) {
			System response = new System();
			response.setSystemName("CUA_NEW");
			response.setSystemStatus("FAILED");
			response.setSystemMsg("Mandatory field missing");
			return response;
		}

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName(ServiceDataEnum.CUA_NEW.name());
		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());
		employeeLog.setTransId(request.getClientTxnId());
		employeeLog.setTransMode(request.getResource_Details().getTransMode());
		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());

		String username = "";

		if (request.getResource_Details().getSiteID().equalsIgnoreCase("RR") && StringUtils.isEmpty(request.getResource_Details().getZ5Code()) && appConfig.getCuaField().getDamSiteService().contains(request.getResource_Details().getZ5Code())) {
			username = (StringUtils.isEmpty(request.getResource_Details().getPrmID())
					|| request.getResource_Details().getPrmID().equals("0"))
							? request.getResource_Details().getWorkerCode()
							: ("T" + request.getResource_Details().getPrmID());
		} else {
			username = request.getResource_Details().getWorkerCode();
		}

		TData t_data = new TData();

		EmpData t_emp_data = new EmpData();
		EmpAuthData t_emp_auth_data = new EmpAuthData();

		System response = new System();
		response.setSystemName("CUA_NEW");

		if (mandiList.contains(request.getResource_Details().getWorkerCode())) {
			response.setSystemMsg("mandi Emp");
			employeeLog.setResponse("mandi Emp");
			employeeLog.setRemark("mandi Emp");
			response.setSystemStatus(AppConstant.sysStatusS);
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

		SimpleDateFormat sdfInput = new SimpleDateFormat("yyyy-MM-dd");
		SimpleDateFormat sdfOutput = new SimpleDateFormat("yyyyMMdd");
		Date date;

		t_emp_data.setUname(username);
		String workerCode = request.getResource_Details().getWorkerCode();
		if (workerCode != "") {
			String extractedPernr = workerCode.substring(4);
			t_emp_data.setPernr(extractedPernr);
		} else {
			t_emp_data.setPernr("");
		}
		t_emp_data.setVorna(request.getResource_Details().getFirst_Name());
		t_emp_data.setBukrs(request.getResource_Details().getContractor_Code());
		t_emp_data.setGeschtxt("");

		String dob = request.getResource_Details().getDate_of_Birth();
		date = sdfInput.parse(dob);
		String formattedDob = sdfOutput.format(date);
		t_emp_data.setGbdat(formattedDob);

		String managerECNO = StringUtils.isEmpty(request.getResource_Details().getManager_ECNO()) ? ""
				: request.getResource_Details().getManager_ECNO().replaceFirst("P", "");
		managerECNO = managerECNO.length() >= 8 ? managerECNO.substring(managerECNO.length() - 8, managerECNO.length())
				: managerECNO;
		t_emp_data.setEmailid(request.getResource_Details().getEmail_ID());
		t_emp_data.setL1_PERNR(managerECNO);
		t_emp_data.setMobileno(request.getResource_Details().getPhone_Self().replaceAll("\\+91", ""));
		t_emp_data.setZzfull_NAME(request.getResource_Details().getFull_Name());
		t_emp_data.setL1_ENAME(request.getResource_Details().getContractor_Name());
		t_emp_data.setL1_EMAIL("");

		String doj = request.getResource_Details().getDate_of_Joining();
		date = sdfInput.parse(doj);
		String formattedDoj = sdfOutput.format(date);
		t_emp_data.setDat01(formattedDoj);

		t_emp_data.setLogsys("SCRUM");

		if (request.getResource_Details().getTransMode().equalsIgnoreCase("TER")) {
			String valid_date = request.getResource_Details().getTermination_Date();
			date = sdfInput.parse(valid_date);
			String formatteValidDate = sdfOutput.format(date);
			t_emp_data.setValid_THRU(formatteValidDate);
		}
		// here i need to add the condition for the HIB and DEHIB
		// if i get Hib save the request into databasessss
		// if i get the dehib it will be in sync and directly call the DEHIB
		else if (request.getResource_Details().getTransMode().equalsIgnoreCase("HIB")) {

		      date = sdfInput.parse(LocalDate.now().toString());

		      String formatteValidDate = sdfOutput.format(date);

		      t_emp_data.setValid_THRU(formatteValidDate);

		    }else if (request.getResource_Details().getTransMode().equalsIgnoreCase("DEHIB")){

		      t_emp_data.setValid_THRU("99991231");
		    }

		t_emp_data.setNachn(request.getResource_Details().getLast_Name().replaceAll("-", ""));
		t_emp_auth_data.setUname(username);
		t_emp_auth_data.setLogsys("SCRUM");
		t_emp_auth_data.setPlans("0");
		t_emp_auth_data.setBuisness_T("");
		t_emp_auth_data.setPlstx("");
		t_emp_auth_data.setSegment_T("");
		t_emp_auth_data.setClass_T("");
		t_emp_auth_data.setFamily_T("");

		String site = request.getResource_Details().getSiteID();


		if (site.equals("RR")) {
			t_emp_auth_data.setBuisness(request.getResource_Details().getBusiness_Code());
			t_emp_auth_data.setSegment(request.getResource_Details().getSegment_Code());
			t_emp_auth_data.setClass_(request.getResource_Details().getClass_Code());
			t_emp_auth_data.setFamily(request.getResource_Details().getFamily_Code());
			t_emp_auth_data.setStell(request.getResource_Details().getJob_Code());
		} else if (site.equals("JIO")) {
			t_emp_auth_data.setBuisness(request.getResource_Details().getVertical().toUpperCase());
			t_emp_auth_data.setSegment(request.getResource_Details().getBusiness_Code());
			t_emp_auth_data.setClass_(request.getResource_Details().getBusiness_Code());
			t_emp_auth_data.setFamily(request.getResource_Details().getWork_Stream_Segment_Code());
			t_emp_auth_data.setStell(request.getResource_Details().getRole_Code_SAP());
		}

		String dateofjoining = request.getResource_Details().getDate_of_Joining();
		date = sdfInput.parse(dateofjoining);
		String formattedDofJo = sdfOutput.format(date);
		t_emp_auth_data.setStart_DATE(formattedDofJo);

		t_emp_auth_data.setStore_CODE(request.getResource_Details().getSite_Code());
		if (request.getResource_Details().getTransMode().equalsIgnoreCase("ADD")) {
			t_emp_auth_data.setHire_FLAG("NJ");
		} else if (request.getResource_Details().getTransMode().equalsIgnoreCase("MOD")) {
			t_emp_auth_data.setHire_FLAG("PT");
		} else {
			t_emp_auth_data.setHire_FLAG("");
		}

		t_emp_auth_data.setStltx("Loader");
		t_emp_auth_data.setSite_FLAG("");

		t_data.getT_EMP_DATA().add(t_emp_data);
		t_data.getT_EMP_AUTH_DATA().add(t_emp_auth_data);

		JsonMapper jsonMapper = new JsonMapper();
		String requestBody = jsonMapper.writeValueAsString(t_data);

		employeeLog.setRequest(requestBody);
		employeeLog.setRequestTime(LocalDateTime.now());
		LogWrapper.info(getClass(), requestBody);
		if (request.getResource_Details().getTransMode().equalsIgnoreCase("HIB")) {

		    LogWrapper.info(getClass(),
		        "HIB request detected — saving request for async processing. " +
		        "EmpCode: " + request.getResource_Details().getWorkerCode() +
		        " || TxnId: " + request.getClientTxnId());

		    handleHibernationProcessing(request, requestBody, employeeLog);

		    response.setSystemStatus(AppConstant.sysStatusS);
		    response.setSystemMsg("Pending");

		    LogWrapper.info(getClass(),
		        "HIB processing completed. Returning SUCCESS response for CUA_NEW. " +
		        "EmpCode: " + request.getResource_Details().getWorkerCode() + "response :"+ response);

		   // finalizeEmployeeLog(employeeLog, response);

		    return response;
		}
		if (request.getResource_Details().getTransMode().equalsIgnoreCase("DEHIB")) {

	        List<AccessRequestLogEntity> hibList =
	                acessRequestLogAsyncRepository
	                        .findBySystemNameAndEmpIdAndSiteIDAndOrgIdAndTransModeAndStatus(
	                                ServiceDataEnum.CUA_NEW.name(),
	                                request.getResource_Details().getWorkerCode(),
	                                request.getResource_Details().getSiteID(),
	                                request.getResource_Details().getOrganization(),
	                                "HIB",
	                                "PENDING"
	                        );

	        if (hibList != null && !hibList.isEmpty()) {
	            acessRequestLogAsyncRepository.deleteAll(hibList);
	            LogWrapper.info(getClass(),
	                    "Deleted existing HIB records for DEHIB | EmpId={} "+request.getResource_Details().getWorkerCode()+
	                    "| Count={} "+hibList.size());
	        }
	    }
		return cuaNewApiCall(requestBody,employeeLog,request.getClientTxnId());
	    
	}
	
	private void handleHibernationProcessing(GeneralRequest request, String requestBody, EmployeeLog employeeLog) {
		 try {
			 boolean isSaved = accessRequestLogAsyncService.isRequestLogged(request, requestBody, "CUA_NEW");
		            if(isSaved) {
		                log.info("Data saved successfully to Hibernate for CUA_NEW for empCode : {} || transaction id : {} ",
		                    request.getResource_Details().getWorkerCode(), request.getClientTxnId());
//		                employeeLog.setStatus("PENDING");
		            } else {
		                log.info("Failed to save data to Hibernate for CUA_NEW for empCode : {} || transaction id : {} ",
		                    request.getResource_Details().getWorkerCode(), request.getClientTxnId());
//		                employeeLog.setStatus("FAILED");
		            }
//		        employeeLogRepo.save(employeeLog);
		    } catch (Exception e) {
		        LogWrapper.error(getClass(), "Error in handleCommonProcessing: " + e.getLocalizedMessage());
		    }
	}

	public System cuaNewApiCall(String requestBody, EmployeeLog employeeLog, String txnId) {

	    ResponseDataObj cuaNewResponse = new ResponseDataObj();
	    System response = new System();
	    response.setSystemName("CUA_NEW");

	    try {

	        ApplicationMasterEntity appliationEntity = appConfig.getCuaNew();
	        String apiUrl = appliationEntity.getDamProtocol()
	                + CwmsConstants.protocolSeperator 
	                + appliationEntity.getDamserverIpUrl()
	                + appliationEntity.getDamEndpoint();

	        char[] chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".toCharArray();
	        Random rnd = new Random();
	        StringBuilder sb = new StringBuilder((100000 + rnd.nextInt(900000)) + "-");
	        for (int i = 0; i < 5; i++) {
	            sb.append(chars[rnd.nextInt(chars.length)]);
	        }

	        HttpHeaders httpHeader = new HttpHeaders();
	        httpHeader.add("TransactionNumber", txnId);
	        httpHeader.add("Source", "CUA");
	        httpHeader.add("Content-Type", "application/json");

	        String auth = appliationEntity.getDamUsername() + ":" + appliationEntity.getDamPassword();
	        httpHeader.add("Authorization", "Basic " 
	                + Base64.getEncoder().encodeToString(auth.getBytes()));

	        cuaNewResponse = restTemplate.exchange(
	                apiUrl,
	                HttpMethod.POST,
	                new HttpEntity<>(requestBody, httpHeader),
	                ResponseDataObj.class
	        ).getBody();

	        LogWrapper.info(getClass(), cuaNewResponse.toString());

	        if (cuaNewResponse.getT_ERRORS() != null) {
	            response.setSystemStatus(AppConstant.sysStatusF);
	            response.setSystemMsg("FAILED");
	        } else {
	            response.setSystemStatus(AppConstant.sysStatusS);
	            response.setSystemMsg("SUCCESS");
	        }
	    } catch (Exception e) {
	        LogWrapper.error(getClass(), e.getLocalizedMessage());
	        response.setSystemStatus(AppConstant.sysStatusF);
	        response.setSystemMsg("FAILED");
	    } finally {
	    	try {
		        employeeLog.setResponse(objectMapper.writeValueAsString(cuaNewResponse));
		        employeeLog.setResponseTime(LocalDateTime.now());
		        employeeLog.setStatus(response.getSystemStatus());
		        employeeLogRepo.save(employeeLog);
		    } catch (Exception e) {
		        LogWrapper.error(getClass(), 
		            "Error in handleCuaApiResponseLogging: " + e.getLocalizedMessage());
		    }
	    }

	    return response;
	}
	private void finalizeEmployeeLog(EmployeeLog employeeLog, System response) {
	    try {
	        employeeLog.setResponse(objectMapper.writeValueAsString(response));
	        employeeLog.setResponseTime(LocalDateTime.now());
	        employeeLog.setStatus(response.getSystemStatus());
	        employeeLogRepo.save(employeeLog);
	    } catch (Exception e) {
	        LogWrapper.error(getClass(),"Error in finalizeEmployeeLog: " + e.getLocalizedMessage());
	    }
	}

	}
