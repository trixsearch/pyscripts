package com.jio.cwms_dataprovision.controller;


import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms_dataprovision.Scheduler.DynamicScheduler;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.dto.Auth;
import com.jio.cwms_dataprovision.dto.BPResponse;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;
import com.jio.cwms_dataprovision.dto.Response;
import com.jio.cwms_dataprovision.dto.SchedulerConfigRequest;
import com.jio.cwms_dataprovision.dto.bp_fields.Root;
import com.jio.cwms_dataprovision.entity.SchedularConfig;
import com.jio.cwms_dataprovision.repository.SchedulerConfigRepository;
import com.jio.cwms_dataprovision.service.BetterPlaceService;
import com.jio.cwms_dataprovision.service.ConditionCheckService;
import com.jio.cwms_dataprovision.service.O2CFieldsMappingService;
import com.jio.cwms_dataprovision.service.RedisService;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@RestController
@RequestMapping("/services")
public class cwmsController {

	@Autowired
	ConditionCheckService service;

	@Autowired
	BetterPlaceService bpService;

	@Autowired
	RedisService redisService;
	
	@Autowired 
	ApplicationConfig config;
	
	@Autowired
	O2CFieldsMappingService o2cFieldsMappingService;
	
	@Autowired
	ObjectMapper objectMapper;
	
	@Autowired
	SchedulerConfigRepository schedulerConfigRepository;
	
	@Autowired
	DynamicScheduler dynamicScheduler;

	@KafkaListener(topics = "#{'${app.config.kafka.producer.topic-name}'}", groupId = CwmsConstants.kafkaGroupId)
	public void listenGroupFoo(String message) throws Exception {

		ObjectMapper mapper = new ObjectMapper();
		GeneralRequest request = mapper.readValue(message, GeneralRequest.class);
		ResourceDetails resourceDetails = service.changeStringtoDecimal(request.getResource_Details());
		request.setResource_Details(resourceDetails);
		
		Response response = service.conditionCheckForServices(request);
		
		redisService.redisPush(request , response);
		

		LogWrapper.info(getClass(), response.toString());

		try {
			BPResponse bpResponse = bpService.updateSystemResponseToBP(response, request.getClientTxnId());
			LogWrapper.info(getClass(), bpResponse.toString());
		} catch (Exception e) {
			LogWrapper.error(getClass(), e.getMessage());
		}

	}

	@PostMapping("/execute")
	public ResponseEntity<Response> fetServices(@RequestBody GeneralRequest request) throws Exception {
		
		ResourceDetails resourceDetails = service.changeStringtoDecimal(request.getResource_Details());
		request.setResource_Details(resourceDetails);
		Response response = service.conditionCheckForServices(request);
		
		redisService.redisPush(request, response);
		
		try {
            BPResponse bpResponse = bpService.updateSystemResponseToBP(response, request.getClientTxnId());
            LogWrapper.info(getClass(), bpResponse.toString());
        } catch (Exception e) {
            LogWrapper.error(getClass(), e.getMessage());
        }
		
		return new ResponseEntity<Response>(response, HttpStatus.OK);

	}
	@PostMapping(value = "/refreshProperties")
	public String refreshProperties(@RequestBody final Auth auth)
	{
		return config.updateRefresh(auth);
	}
	
//	@PostMapping("/scrumMapping")
//	public void o2cFieldsMapping(@RequestBody Root root) {
//		o2cFieldsMappingService.O2CFieldsMapping(root);
//	}
	
//	@KafkaListener(topics = "#{'${app.config.kafka.consumer.o2c.approval.data.topic.name}'}", groupId = CwmsConstants.kafkaGroupId1)
	public void o2cFieldsMapping(String message) throws JsonProcessingException {
		
		ObjectMapper mapper = new ObjectMapper();
		
		//System.out.println(topicName);
	    LogWrapper.info(getClass(), message);
		try {
			Root request = mapper.readValue(message, Root.class);
			LogWrapper.info(getClass(), objectMapper.writeValueAsString(request));
			o2cFieldsMappingService.O2CFieldsMapping(request);
		} catch (JsonMappingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		
	}
	
	@PostMapping("/trigger")
	public ResponseEntity<Map<String, String>> automateTrigger(@RequestBody SchedulerConfigRequest requestBody) {
	    Optional<SchedularConfig> configOpt = schedulerConfigRepository
		        .findBySystemNameAndTransModeAndSchedulerTypeAndOrgId(
	            requestBody.getSystemName(), 
	            requestBody.getTransMode(), 
	            requestBody.getSchedulerType(),
	            requestBody.getOrgId()

	        );

	    if (configOpt.isEmpty()) {
	        return ResponseEntity
	            .status(HttpStatus.NOT_FOUND)
	            .body(Map.of("error", "Scheduler config not found for the given input"));
	    }

	    SchedularConfig configEntity = configOpt.get();
	    
	    if (!configEntity.isActive()) {
	        return ResponseEntity
	            .status(HttpStatus.BAD_REQUEST)
	            .body(Map.of("message", "Scheduler is inactive in configuration."));
	    }

	    // Populate values from DB into the request
	    requestBody.setBatchSize(configEntity.getBatchSize());
	    requestBody.setCronExpression(configEntity.getCronExpression());
	    requestBody.setOrgId(configEntity.getOrgId());
	    requestBody.setCronSite(configEntity.getCronSite());
	    requestBody.setSchedulerType(configEntity.getSchedulerType());
	    requestBody.setMaximumRetry(configEntity.getMaximumRetry());
	    requestBody.setReadtimeout(configEntity.getReadTimeout());	    
	    requestBody.setConditionCheck(configEntity.getConditionCheck());
	    requestBody.setCronExecutionSkipTime(configEntity.getCronExecutionSkipTime());
	   
	    dynamicScheduler.reschedule(requestBody);

	    return ResponseEntity.ok(Map.of("message", "Scheduler triggered successfully"));
	}


}
