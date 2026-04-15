package com.jio.cwms_dataprovision.service;

import java.lang.reflect.Field;

import java.time.LocalDateTime;
import java.util.List;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jio.commons.messages.CommonsMessage;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.config.ScrumJdbcTempalte;
import com.jio.cwms_dataprovision.constants.AppConstant;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;
import com.jio.cwms_dataprovision.dto.System;
import com.jio.cwms_dataprovision.dto.scrum.ScrumResponse;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;
import org.apache.commons.lang3.StringUtils;

@Service
public class ScrumService implements GeneralService {

	@Autowired
	ScrumJdbcTempalte jdbcTemplateConfig;

	@Autowired
	ApplicationConfig appConfig;
	
	@Autowired
	EmployeeLogRepository employeeLogRepo;

	@Override
	public System executeService(GeneralRequest request) throws JsonProcessingException, Exception {

		if (!StringUtils.isEmpty(request.getResource_Details().getWorkorder_No())) {
			request.getResource_Details()
					.setWorkorder_No(request.getResource_Details().getWorkorder_No().replaceAll("'", "''"));
		}

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName(ServiceDataEnum.SCRUM.name());
		employeeLog.setEmpId(request.getResource_Details().getWorkerCode());	
		employeeLog.setTransId(request.getClientTxnId());
		employeeLog.setTransMode(request.getResource_Details().getTransMode());
		employeeLog.setApprovalStatus(request.getResource_Details().getApproval_Status());
		
		System response = new System();
		response.setSystemName(ServiceDataEnum.SCRUM.name());

		if (!appConfig.getScrumApiFields().isDamStatus()) {
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

		String scrumResponse = "";
		try {
			scrumResponse = insertRecord(request, employeeLog);
			response.setSystemMsg(scrumResponse);
			response.setSystemStatus(AppConstant.sysStatusS);

		}

		catch (Exception e) {
			response.setSystemStatus(AppConstant.sysStatusF);
			LogWrapper.error(getClass(), e.getMessage());

		}

		finally {
			try {
				employeeLog.setResponse(scrumResponse);
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

	private String insertRecord(GeneralRequest request, EmployeeLog employeeLog) throws Exception {

		String scrumInsert = appConfig.getScrumApiFields().getDam_requestHeader();

		ResourceDetails insertData = request.getResource_Details();

		ObjectMapper mapper = new ObjectMapper();
		String sg = mapper.writeValueAsString(insertData);
		JSONObject json = new JSONObject(sg);
		Field[] fields = insertData.getClass().getDeclaredFields();
		StringBuilder queryString = new StringBuilder();

		for (int i = 0; i < fields.length; i++) {
			String fieldName = fields[i].getName();
			boolean isHeight = fieldName.equalsIgnoreCase("height");
			String value = String.valueOf(json.get(fieldName));
			if (isHeight) {
				value = value.replace("'", "''");
			}
			queryString.append("'").append(value).append("',");
		}

		scrumInsert = scrumInsert.replaceAll("<<queryData>>", queryString.substring(0, queryString.length() - 1))
				.replaceAll("'null'", "''");
		
		employeeLog.setRequest(scrumInsert);
		employeeLog.setRequestTime(LocalDateTime.now());

		List<ScrumResponse> scrumResponse = jdbcTemplateConfig.getScrumJdbcTemplate().query(scrumInsert,
				new BeanPropertyRowMapper<ScrumResponse>(ScrumResponse.class));
		
		String o2cString = "";
		
		if (request.getResource_Details().getOrganization().equalsIgnoreCase("O2C")) {
			List<ScrumResponse> scrumO2CResponse = jdbcTemplateConfig.getO2CJdbcTemplate().query(scrumInsert,
					new BeanPropertyRowMapper<ScrumResponse>(ScrumResponse.class));
			
			o2cString += scrumO2CResponse.get(0).getStatusCode() + "   "
					+ scrumO2CResponse.get(0).getStatusMsg();
			
		}

		LogWrapper.info(getClass(), "Resource Entry Response" + scrumResponse);

		return " SCRUM RESOURCE : " + scrumResponse.get(0).getStatusCode() + "   "

				+ scrumResponse.get(0).getStatusMsg();

	}

}
