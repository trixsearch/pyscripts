package com.jio.cwms.onboard.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.commons.lang3.BooleanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
//import com.fasterxml.jackson.core.JsonProcessingException;
import com.jio.commons.messages.CommonsMessage;
import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.dto.request.Auth;
import com.jio.cwms.onboard.dto.request.EPVendorFetchRequest;
import com.jio.cwms.onboard.dto.request.OnboardRequest;
import com.jio.cwms.onboard.dto.response.EPVendorFetchResponse;
import com.jio.cwms.onboard.dto.response.OnboardResponse;
import com.jio.cwms.onboard.dto.response.OnboardResponseResource;
import com.jio.cwms.onboard.dto.response.VendorResponse;
import com.jio.cwms.onboard.exception.RequestBodyException;
import com.jio.cwms.onboard.model.OnboardLogging;
import com.jio.cwms.onboard.repository.OnboardLoggingRepository;
import com.jio.cwms.onboard.service.EPVendorFetchService;
import com.jio.cwms.onboard.service.OnboardAccessService;
import com.jio.cwms.onboard.service.OnboardService;
import com.jio.cwms.onboard.service.RequestHeadersValidationService;
import com.jio.cwms.onboard.service.RequestHeadersValidationService.RequestHeaders;
import com.jio.cwms.onboard.service.VendorRequestValidationservice;
import com.jio.cwms.onboard.utils.HttpRequestUtils;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.annotations.servers.ServerVariable;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.log4j.Log4j2;

@OpenAPIDefinition( servers = {
		@Server(
				url = "http://localhost:8081/{contextPath}",
				description = "Local Environment",
				variables = {
						@ServerVariable(name = "contextPath", defaultValue = "onboard")
				}
				),
		@Server(
				url = "http://10.173.173.10:31001/{contextPath}",
				description = "SIT Environment",
				variables = {
						@ServerVariable(name = "contextPath", defaultValue = "onboard")
				}
				)
},
info = @Info(
		title = "CWMS Onboard",
		description = "CWMS onboard allows client application to onboard user data to platform", version = "1.1.0"
		)
		)
@Log4j2
@RestController
@RequestMapping("/v1.0")
public class OnboardController {

	@Autowired
	private RequestHeadersValidationService headerValidationService;

	@Autowired
	private OnboardService onboardService;

	@Autowired
	private OnboardAccessService onboardAccessService ;

	@Autowired
	private ApplicationConfig config ;

	@Autowired
	private EPVendorFetchService epVendorFetchService;
	
	@Autowired
	private VendorRequestValidationservice vendorRequestValidationservice;
	
	@Autowired
	ObjectMapper objectMapper;
	
	@Autowired 
	private OnboardLoggingRepository onboardLoggingRepo;
	
	@Operation(
			requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true),
			description = "API call to onboard employee to the platform"
			)
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "Request successfully processed", content = {
					@Content(
							mediaType = "application/json",
							schema = @Schema(example = "{\"clientTxnId\":\"jhb-45j3h-4b5-hj345h-j4jh23j\",\"success\":\"true\",\"status\":1,\"errors\":\"\",\"resource\":{\"workerCode\":\"PP5900000562\",\"msg\":\"data inserted successfully\"}}")
							)
			}
					),
			@ApiResponse(responseCode = "400", description = "Request body is missing or not as expected", content = {
					@Content(
							mediaType = "application/json",
							schema = @Schema(example = "{\"clientTxnId\":\"jhb-45j3h-4b5-hj345h-j4jh23j\",\"success\":\"false\",\"status\":0,\"errors\":\"['Invalid data found in request body']\",\"resource\":{\"workerCode\":\"PP5900000562\",\"msg\":\"data insertion failed\"}}")
							),
					@Content(
							mediaType = "application/json",
							schema = @Schema(example = "{\"success\":\"false\",\"status\":0,\"errors\":\"['Mandatory channelId request header is missing','Mandatory clientIp request header is missing','Mandatory clientTxnId request header is missing','Mandatory sourceDevice request header is missing']\",\"resource\":{\"workerCode\":\"PP5900000562\",\"msg\":\"data insertion failed\"}}\r\n"
									+ "")
							)
			}),
			@ApiResponse(responseCode = "500", description = "An internal error occurred while processing request", content = {
					@Content(
							mediaType = "application/json",
							schema = @Schema(example = "{\"clientTxnId\":\"jhb-45j3h-4b5-hj345h-j4jh23j\",\"success\":\"false\",\"status\":0,\"errors\":\"['Internal error occurred']\",\"resource\":{\"workerCode\":\"PP5900000562\",\"msg\":\"data insertion failed\"}}")
							)
			})
	})
	@PostMapping(value = "/useronboard")
	public ResponseEntity<OnboardResponse> employeeOnboarding (final HttpServletRequest request,
			@RequestBody final OnboardRequest onboardRequestData,
			@RequestHeader final HttpHeaders headers ) throws JsonProcessingException {

		OnboardLogging onboardLog = new OnboardLogging();
		onboardLog.setSystemName("ONBOARD");
		onboardLog.setEmpId(onboardRequestData.getResource_Details().getWorkerCode());
		onboardLog.setTransId(headers.getFirst(RequestHeaders.CLIENT_TXN_ID));
		onboardLog.setTransMode(onboardRequestData.getResource_Details().getTransMode());
		onboardLog.setApprovalStatus(onboardRequestData.getResource_Details().getApproval_Status());
		onboardLog.setRequest(objectMapper.writeValueAsString(onboardRequestData));
		onboardLog.setRequestTime(LocalDateTime.now());
		
		OnboardController.log.info("Received request for user onboard | Client Txn Id: {} | Worker Code: {} | Remote Address: {}",
				headers.getFirst(RequestHeaders.CLIENT_TXN_ID),
				onboardRequestData.getResource_Details().getWorkerCode(),
				HttpRequestUtils.getRemoteIPAddress(request)
				);

		final List<String> errorList = headerValidationService.validateHeaders(headers);
		if (!errorList.isEmpty()) {

			OnboardController.log.info("Header validations failed for client request | Client Txn ID: {} | Worker Code: {} | Remote Address: {}",
					headers.getFirst(RequestHeaders.CLIENT_TXN_ID),
					onboardRequestData.getResource_Details().getWorkerCode(),
					HttpRequestUtils.getRemoteIPAddress(request)
					);
			
			String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR","028");
			ObjectMapper objectMapper = new ObjectMapper();

			JsonNode jsonNode = objectMapper.readTree(str);
			String message = jsonNode.get("msg").asText();
			String modifiedMessage = message.trim();
			((ObjectNode) jsonNode).put("message", modifiedMessage);

			return ResponseEntity.badRequest()
					.cacheControl(CacheControl.noCache())
					.allow(HttpMethod.POST)
					.body(
							OnboardResponse.builder()
							.clientTxnId(headers.getFirst(RequestHeaders.CLIENT_TXN_ID))
							.status(0)
							.success(BooleanUtils.FALSE)
							.errors(OnboardResponse.generateErrorString(errorList))
							.resource(
									OnboardResponseResource.builder()
									.workerCode(onboardRequestData.getResource_Details().getWorkerCode())
									//.message("data insertion failed")
									.message(modifiedMessage)
									.build()
									)
							.build()
							);
		}

		final String clientTxnId = headers.getFirst(RequestHeaders.CLIENT_TXN_ID);

		final OnboardResponse responseBody = onboardService.onboardAsEmployee(clientTxnId, headers, onboardRequestData, onboardLog);

	
		try {
			onboardLog.setResponseTime(LocalDateTime.now());
			if(responseBody.getStatus() == 0 || !responseBody.getErrors().isEmpty()) {
				onboardLog.setStatus("FAILED");
			}
			else {
				onboardLog.setStatus("SUCCESS");
			}
			
			onboardLoggingRepo.save(onboardLog);
		}
		catch(Exception e){
			LogWrapper.error(getClass(), e.getLocalizedMessage());
		}
		
	if(responseBody.getStatus() == 0) {	
	   return ResponseEntity.badRequest()
				.cacheControl(CacheControl.noCache())
				.allow(HttpMethod.POST)
				.body(responseBody);
				
	}
		OnboardController.log.info("Generated user onboarding response | Client Txn Id: {} | Worker Code: {} | Response: {}",
				clientTxnId,
				onboardRequestData.getResource_Details().getWorkerCode(),
				responseBody
				);

		if ("Invalid data found in request body".equals(responseBody.getErrors())) {
			return ResponseEntity.badRequest()
					.cacheControl(CacheControl.noCache())
					.allow(HttpMethod.POST)
					.body(responseBody);
		}

		return ResponseEntity.ok()
				.cacheControl(CacheControl.noCache())
				.allow(HttpMethod.POST)
				.body(responseBody);
	}

	@Operation(
			requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true),
			description = "API call to onboard access employee to the platform"
			)
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "Request successfully processed", content = {
					@Content(
							mediaType = "application/json",
							schema = @Schema(example = "{\"clientTxnId\":\"jhb-45j3h-4b5-hj345h-j4jh23j\",\"success\":\"true\",\"status\":1,\"errors\":\"\",\"resource\":{\"workerCode\":\"PP5900000562\",\"activity\":\"access\",\"system\":[],\"card_No\":\"100236\",\"card_Format\":\"3\",\"card_IssueLevel\":\"2\"}}")
							)
			}
					),
			
			
			@ApiResponse(responseCode = "400", description = "Request body is missing or not as expected", content = {
					@Content(
							mediaType = "application/json",
							schema = @Schema(example = "{\"clientTxnId\":\"jhb-45j3h-4b5-hj345h-j4jh23j\",\"success\":\"false\",\"status\":0,\"errors\":\"['Invalid data found in requestbody']\"}")
							),
					
			}),
			@ApiResponse(responseCode = "500", description = "An internal error occurred while processing request", content = {
					@Content(
							mediaType = "application/json",
							schema = @Schema(example ="{\"clientTxnId\":\"jhb-45j3h-4b5-hj345h-j4jh23j\",\"success\":\"false\",\"status\":0,\"errors\":\"['Internal error occurred']\",\"resource\":{\"system\":[]}}")
							)
			})
	})

	@PostMapping(value = "/useraccess")
	public ResponseEntity<OnboardResponse> accessEmployeeOnboarding (final HttpServletRequest request,
			@RequestBody final OnboardRequest onboardRequestData,
			@RequestHeader final HttpHeaders headers ) throws JsonProcessingException, NoSuchFieldException, SecurityException {

		OnboardLogging onboardLog = new OnboardLogging();
		onboardLog.setSystemName("ACCESS");
		onboardLog.setEmpId(onboardRequestData.getResource_Details().getWorkerCode());
		onboardLog.setTransId(headers.getFirst(RequestHeaders.CLIENT_TXN_ID));
		onboardLog.setTransMode(onboardRequestData.getResource_Details().getTransMode());
		onboardLog.setApprovalStatus(onboardRequestData.getResource_Details().getApproval_Status());
		onboardLog.setRequest(objectMapper.writeValueAsString(onboardRequestData));
		onboardLog.setRequestTime(LocalDateTime.now());
		
		OnboardController.log.info("Received request for user onboard | Client Txn Id: {} | Remote Address: {} | Worker Code: {}",
				headers.getFirst(RequestHeaders.CLIENT_TXN_ID),
				HttpRequestUtils.getRemoteIPAddress(request),
				onboardRequestData.getResource_Details().getWorkerCode()
				);



		final String clientTxnId = headers.getFirst(RequestHeaders.CLIENT_TXN_ID);

		final OnboardResponse responseBody = onboardAccessService.onboardAsEmployee(clientTxnId, onboardRequestData, headers);

		try {
			onboardLog.setResponse(objectMapper.writeValueAsString(responseBody));
			onboardLog.setResponseTime(LocalDateTime.now());
			if(responseBody.getStatus()==0 || !responseBody.getErrors().isEmpty()) {
				onboardLog.setStatus("FAILED");
			}
			else {
				onboardLog.setStatus("SUCCESS");
			}
			
			onboardLoggingRepo.save(onboardLog);
		}
		catch(Exception e) {
			LogWrapper.error(getClass(), e.getLocalizedMessage());
		}
		
		OnboardController.log.info("Generated user onboarding response | Client Txn Id: {} | Worker Code: {} | Response: {}",
				clientTxnId,
				onboardRequestData.getResource_Details().getWorkerCode(),
				responseBody
				);

		return ResponseEntity.ok().body(responseBody);
	}
	
	@PostMapping(value= "/fetchEPVendorDetails")
	public ResponseEntity<OnboardResponse> employeeVendorFetch(@RequestBody final EPVendorFetchRequest requestBody,
			@RequestHeader final HttpHeaders headers, final HttpServletRequest request){
		
		OnboardController.log.info("Received request for employeeVendorFetch | Client Txn Id: {} | Remote Address: {} | Worker Code: {}",
				headers.getFirst(RequestHeaders.CLIENT_TXN_ID),
				HttpRequestUtils.getRemoteIPAddress(request),
				requestBody.getWorkerCode()
				);
		OnboardResponse object = new OnboardResponse();
		boolean validationStatus = vendorRequestValidationservice.requestValidation(requestBody,headers);
		LogWrapper.info(getClass(), "requestValidation method returns : " + validationStatus );
		if (validationStatus) {
		LogWrapper.info(getClass(), "Valid Request");
		EPVendorFetchResponse employeeData = epVendorFetchService.fetchEP(requestBody,headers);
		VendorResponse vendorResponse  = new VendorResponse();
				       vendorResponse.setVendorResponse(employeeData);
				object = OnboardResponse.builder()
				.clientTxnId(headers.getFirst("clientTxnId"))
				.success("true")
				.status(100)
				.errors(null)
				.resource(vendorResponse)
				.build();
		}else {
			LogWrapper.error(getClass(), "Bad request or Header for employeeVendorFetch");
			throw new RequestBodyException(headers.getFirst("clientTxnId"),101, "false", null, object);
		}
		 	return new ResponseEntity<OnboardResponse>(object, HttpStatus.OK);
	}	
	
	
	@PostMapping(value = "/refreshProperties")
	public String refreshProperties(@RequestBody final Auth auth)
	{

	return config.updateRefresh(auth);
	}
}
