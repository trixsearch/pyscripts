package com.jio.cwms.onboard.service;

import java.io.StringReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.*;
import java.util.regex.Pattern;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import com.jio.cwms.onboard.dto.response.CandidateDetailHot;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jio.commons.messages.CommonsMessage;
import com.jio.cwms.onboard.dto.request.CandidateDetails;
import com.jio.cwms.onboard.dto.request.CandidateOnboardRequest;
import com.jio.cwms.onboard.dto.request.CandidateStatusRequest;
import com.jio.cwms.onboard.dto.request.HotMessagePublishRequest;
import com.jio.cwms.onboard.dto.request.MessagePublisherRequest;
import com.jio.cwms.onboard.dto.response.CandidateOnboardResponse;
import com.jio.cwms.onboard.dto.response.MessagePublisherResponse;
import com.jio.cwms.onboard.dto.response.OnboardResponse;
import com.jio.cwms.onboard.dto.response.PositionCountDataBP;
import com.jio.cwms.onboard.entity.EmployeeLog;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.model.CandidateDetailsModel;
import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.model.ParameterMaster;
import com.jio.cwms.onboard.repository.CandidateDetailsRepository;
import com.jio.cwms.onboard.repository.EmployeeLogRepository;
import com.jio.cwms.onboard.service.apis.CWMSPublisherApis;
import com.jio.cwms.onboard.service.apis.HOTApis;
import com.jio.cwms.onboard.utils.CDATAcreation;
import com.jio.cwms.onboard.utils.CommonUtils;
import com.jio.cwms.onboard.utils.DecryptPII;
import com.jio.cwms.onboard.wrapper.LogWrapper;
import com.jio.cwms_soap.pojo.ArrayOfString;
import com.jio.cwms_soap.pojo.GetCandidateStatus;
import com.jio.cwms_soap.pojo.GetCandidateStatusResponse;
import com.jio.cwms_soap.pojo.GetDetails;
import com.jio.cwms_soap.pojo.GetDetailsResponse;
import com.jio.cwms_soap.pojo.GetPositionCount;
import com.jio.cwms_soap.pojo.GetPositionCountResponse;
import com.jio.cwms_soap.pojo.GetScrumDetails;
import com.jio.cwms_soap.pojo.ProcessCandidate;
import com.jio.cwms_soap.pojo.ProcessCandidateResult;
import com.jio.cwms_soap.pojo.UpdateDOJ;
import com.jio.cwms_soap.pojo.UpdateDOJResponse;
import com.jio.cwms_soap.pojo.UpdatePhoto;
import com.jio.cwms_soap.pojo.UpdatePhotoResponse;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class HOTServiceImpl extends HOTApis {
	
	private static final String EMPLOYEE_CODE_PREFIX = "PPJO";
	
	private static final String PATH_DELIMETER = "/";

	private static final Pattern XML_BARE_AMPERSAND = Pattern.compile(
		"&(?!(?:amp|lt|gt|quot|apos);|#(?:[0-9]+|x[0-9A-Fa-f]+);|[A-Za-z_:][A-Za-z0-9._:-]*;)");

	@Autowired
	private AzureBlobService azureBlobService;

	@Autowired
	RestTemplate restTemplate;
	
	@Autowired
	CDATAcreation cdataCreation;
	
	@Autowired
	HOTApis api;
	
	@Autowired
	MongoPositionFetch mongoPositionFetch;
	
	
	@Autowired
	private CandidateDetailsRepository candidateDetailsRepository;

	@Autowired
	EmployeeLogRepository employeeLogRepository;
	
	private static final String RECEIVED = "received";
	
	private ObjectMapper mapper = new ObjectMapper();

	public GetPositionCountResponse getPositionCount(GetPositionCount getPositionCount) throws Exception {

		String logMessage = String.format("HOTService class | getPositionCount() method | Started");
		LogWrapper.info(getClass(), logMessage);

		CandidateStatusRequest cr =CandidateStatusRequest.builder()
				.action("POS")
				.typeCode(getPositionCount.getTypecode())
				.sapRoleCode(getPositionCount.getSAPRoleCode())
				.shortCode(getPositionCount.getShortCode())
				.build();

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("HOT");
		employeeLog.setTransMode("GetPositionCount");
		ObjectNode positionCountJson = mapper.valueToTree(getPositionCount);
		positionCountJson.remove("token");
		employeeLog.setRequest(mapper.writeValueAsString(positionCountJson));
		employeeLog.setRequestTime(LocalDateTime.now());
		
		LogWrapper.info(getClass(), "HOTService class | getPositionCount() method | Calling getCandidateDetailsApi");
		CandidateOnboardResponse getCandidateDetailsReq  = api.getCandidateDetailsApi(cr);
		LogWrapper.info(getClass(), "HOTService class | getPositionCount() method | Received response from getCandidateDetailsApi | status=" + getCandidateDetailsReq.getStatus());
		
		GetPositionCountResponse getCountResponse = new GetPositionCountResponse();
		
		if (getCandidateDetailsReq.getStatus()==1)
		{
			LogWrapper.info(getClass(), "HOTService class | getPositionCount() method | Successfully retrieved candidate details");
			LogWrapper.info(getClass(), getCandidateDetailsReq.toString());
			
		        
		        PositionCountDataBP bpResponse = PositionCountDataBP.builder()
		        	    .positionName(getCandidateDetailsReq.getResource().getPositionName())
		        	    .jioCenter(getCandidateDetailsReq.getResource().getJioCenter())
		        	    .offCount(getCandidateDetailsReq.getResource().getOffCount())
		        	    .availCount(getCandidateDetailsReq.getResource().getAvailCount())
		        	    .gapCount(getCandidateDetailsReq.getResource().getGapCount())
		        	    .recCount(getCandidateDetailsReq.getResource().getRecCount())
		        	    .build();

		//PositionCountDataBP bpResponse = mapper.convertValue(getCandidateDetailsReq.getResource(), PositionCountDataBP.class);
		
		//LogWrapper.info(getClass(), bpResponse.toString());
		
	
		getCountResponse.setGetPositionCountResult(cdataCreation.createCdata(List.of(bpResponse.toPositionDataHot())));	
		
		employeeLog.setResponse(mapper.writeValueAsString(getCountResponse));
		employeeLog.setResponseTime(LocalDateTime.now());
		employeeLog.setStatus("SUCCESS");
		try {
			employeeLogRepository.save(employeeLog);
		} catch (Exception e) {
			LogWrapper.error(getClass(), "HOTService class | getPositionCount() method | Failed to save employee log to database | error=" + e.getMessage(), e);
		}

		LogWrapper.info(getClass(), "HOTService class | getPositionCount() method | Successfully created position count response");
		return getCountResponse;
		}
		else  
		{
			LogWrapper.info(getClass(), "HOTService class | getPositionCount() method | Failed to retrieve candidate details, returning empty response");
			PositionCountDataBP bpResponse = PositionCountDataBP.builder()
					.positionName("")
					.jioCenter("")
					.recCount(0)
					.offCount(0)
					.gapCount(0)
					.build();
			
			getCountResponse.setGetPositionCountResult(cdataCreation.createCdata(List.of(bpResponse.toPositionDataHot())));
			
			employeeLog.setResponse(mapper.writeValueAsString(getCountResponse));
			employeeLog.setResponseTime(LocalDateTime.now());
			employeeLog.setStatus("FAILED");
			try {
				employeeLogRepository.save(employeeLog);
			} catch (Exception e) {
				LogWrapper.error(getClass(), "HOTService class | getPositionCount() method | Failed to save employee log to database | error=" + e.getMessage(), e);
			}

			return getCountResponse;
		}	
	}
	
	public GetPositionCountResponse getPositionCountFromMongo(GetPositionCount getPositionCount) throws Exception {
		
		String logMessage = String.format("HOTService class | getPositionCountFromMongo() method | Started");
		LogWrapper.info(getClass(), logMessage);

		 if (getPositionCount.getPaginationDetails() == null ||
					getPositionCount.getPaginationDetails().getPageNumber() == null ||
					getPositionCount.getPaginationDetails().getPageSize() == null) {
					LogWrapper.error(getClass(), "Pagination, PageNumber, and PageSize must be provided. ");
					throw new SoapValidationException("Pagination, PageNumber, and PageSize must be provided.");
				}	
		 int pageNumber = getPositionCount.getPaginationDetails().getPageNumber();
		  int pageSize = getPositionCount.getPaginationDetails().getPageSize();
		 if(!(pageNumber>0 && pageSize>0 ) )
		  {
			  LogWrapper.error(getClass(), "PageNumber and PageSize must be Positive value");
			  throw new SoapValidationException("PageNumber and PageSize must be Positive value");
		  }
		  
		// Validate filters for Type 2 (mandatory)
		validateType2DateFilters(getPositionCount);
		
		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("HOT");
		employeeLog.setTransMode("GetPositionCountFromMongo");
		ObjectNode positionCountJson = mapper.valueToTree(getPositionCount);
		positionCountJson.remove("token");
		employeeLog.setRequest(mapper.writeValueAsString(positionCountJson));
		employeeLog.setRequestTime(LocalDateTime.now());
		
		try {
			LogWrapper.info(getClass(), "HOTService class | getPositionCountFromMongo() method | Calling mongoPositionFetch.getCandidateOnboardPositionDetails");
			GetPositionCountResponse positionCountMongoData = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

			employeeLog.setResponseTime(LocalDateTime.now());
			String positionData = positionCountMongoData.getGetPositionCountResult();
			if (positionData != null && positionData.contains("<NewDataSet><Error>")) {
				employeeLog.setStatus("FAILED");
				LogWrapper.error(getClass(), "HOTService class | getPositionCountFromMongo() method | MongoDB returned error in response data");
				employeeLog.setResponse("{}");
			} else {
				employeeLog.setStatus("SUCCESS");
				// Extract all positionsName values from XML response and set as JSON list
				List<String> positionsNameList = extractPositionsNameFromXml(positionData);
				ObjectNode responseJson = mapper.createObjectNode();
				responseJson.set("positionsName", mapper.valueToTree(positionsNameList));
				employeeLog.setResponse(mapper.writeValueAsString(responseJson));
			}
			try {
				employeeLogRepository.save(employeeLog);
			} catch (Exception e) {
				LogWrapper.error(getClass(), "HOTService class | getPositionCountFromMongo() method | Failed to save employee log to database | error=" + e.getMessage(), e);
			}
			
			LogWrapper.info(getClass(), "HOTService class | getPositionCountFromMongo() method | Successfully retrieved position count from MongoDB");
			return positionCountMongoData;
		} catch (SoapValidationException e) {
			LogWrapper.error(getClass(), "HOTService class | getPositionCountFromMongo() method | MongoDB operation failed with SoapValidationException: " + e.getMessage());
			employeeLog.setResponseTime(LocalDateTime.now());
			employeeLog.setStatus("FAILED");
			employeeLog.setResponse("MongoDB operation failed: " + e.getMessage());
			try {
				employeeLogRepository.save(employeeLog);
			} catch (Exception ex) {
				LogWrapper.error(getClass(), "HOTService class | getPositionCountFromMongo() method | Failed to save employee log to database | error=" + ex.getMessage(), ex);
			}
			LogWrapper.info(getClass(), "HOTService class | getPositionCountFromMongo() method | EmployeeLog saved with FAILED status due to MongoDB failure");
			throw e;
		} catch (Exception e) {
			LogWrapper.error(getClass(), "HOTService class | getPositionCountFromMongo() method | MongoDB operation failed with Exception: " + e.getMessage(), e);
			employeeLog.setResponseTime(LocalDateTime.now());
			employeeLog.setStatus("FAILED");
			employeeLog.setResponse("MongoDB operation failed: " + e.getMessage());
			try {
				employeeLogRepository.save(employeeLog);
			} catch (Exception ex) {
				LogWrapper.error(getClass(), "HOTService class | getPositionCountFromMongo() method | Failed to save employee log to database | error=" + ex.getMessage(), ex);
			}
			LogWrapper.info(getClass(), "HOTService class | getPositionCountFromMongo() method | EmployeeLog saved with FAILED status due to MongoDB failure");
			throw e;
		}
	}
	
	private void validateType2DateFilters(GetPositionCount getPositionCount) throws SoapValidationException {
		LogWrapper.info(getClass(), "HOTService class | validateType2DateFilters() method | Started");
		
		// Check if filters element exists (mandatory for Type 2)
		if (getPositionCount.getFilters() == null) {
			LogWrapper.error(getClass(), "Filters are required for Type 2 requests.");
			throw new SoapValidationException("Filters are required for Type 2 requests.");
		}
		
		// Check if startDate is provided (mandatory)
		String startDateStr = getPositionCount.getFilters().getStartDate();
		if (startDateStr == null || startDateStr.trim().isEmpty()) {
			LogWrapper.error(getClass(), "startDate is required for Type 2 requests.");
			throw new SoapValidationException("startDate is required for Type 2 requests.");
		}
		
		// Parse startDate - format: yyyy/MM/dd HH:mm:ss (use uuuu for year with STRICT so valid dates like 2025/02/28 parse correctly; invalid e.g. 2025/02/29 still rejected)
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("uuuu/MM/dd HH:mm:ss").withResolverStyle(ResolverStyle.STRICT);
		LocalDateTime startDateTimeIST;
		
		try {
			startDateTimeIST = LocalDateTime.parse(startDateStr.trim(), formatter);
		} catch (DateTimeParseException e) {
			LogWrapper.error(getClass(), "Invalid date or format for startDate: " + startDateStr + ". Expected format: yyyy/MM/dd HH:mm:ss and a valid calendar date");
			throw new SoapValidationException("Invalid date or format. Use yyyy/MM/dd HH:mm:ss and a valid calendar date");
		}
		
		// Convert IST to UTC (IST = UTC + 5:30, so UTC = IST - 5:30)
		ZoneId istZone = ZoneId.of("Asia/Kolkata");
		ZoneId utcZone = ZoneId.of("UTC");
		ZonedDateTime startDateTimeISTZoned = startDateTimeIST.atZone(istZone);
		ZonedDateTime startDateTimeUTC = startDateTimeISTZoned.withZoneSameInstant(utcZone);
		
		// Reject future startDate
		ZonedDateTime nowIST = ZonedDateTime.now(istZone);
		if (startDateTimeISTZoned.isAfter(nowIST)) {
			LogWrapper.error(getClass(), "StartDate cannot be a future date.");
			throw new SoapValidationException("StartDate cannot be a future date.");
		}
		
		// Handle endDate (optional)
		String endDateStr = getPositionCount.getFilters().getEndDate();
		ZonedDateTime endDateTimeUTC = null;
		
		if (endDateStr == null || endDateStr.trim().isEmpty()) {
			// If endDate is not provided, range is from start of day (00:00:00 IST) to startDate
			// This is handled in MongoPositionFetch, validation just needs to ensure startDate is valid
			LocalDateTime startOfDayIST = startDateTimeIST.toLocalDate().atStartOfDay();
			
			// Validate that startDate is not before start of day (shouldn't happen, but check anyway)
			if (startDateTimeIST.isBefore(startOfDayIST)) {
				LogWrapper.error(getClass(), "StartDate cannot be before start of day");
				throw new SoapValidationException("StartDate cannot be before start of day");
			}
			
			LogWrapper.info(getClass(), "HOTService class | validateType2DateFilters() method | endDate not provided, using range from start of day (" + startOfDayIST.format(formatter) + " IST) to startDate (" + startDateTimeIST.format(formatter) + " IST)");
		} else {
			// Parse endDate
			LocalDateTime endDateTimeIST;
			try {
				endDateTimeIST = LocalDateTime.parse(endDateStr.trim(), formatter);
			} catch (DateTimeParseException e) {
				LogWrapper.error(getClass(), "Invalid date or format for endDate: " + endDateStr + ". Expected format: yyyy/MM/dd HH:mm:ss and a valid calendar date.");
				throw new SoapValidationException("Invalid date or format. Use yyyy/MM/dd HH:mm:ss and a valid calendar date.");
			}
			
			// Convert IST to UTC
			ZonedDateTime endDateTimeISTZoned = endDateTimeIST.atZone(istZone);
			endDateTimeUTC = endDateTimeISTZoned.withZoneSameInstant(utcZone);
			
			// Reject future endDate
			if (endDateTimeISTZoned.isAfter(nowIST)) {
				LogWrapper.error(getClass(), "EndDate cannot be a future date.");
				throw new SoapValidationException("EndDate cannot be a future date.");
			}
			
			// Validate startDate is not after endDate (after conversion)
			if (startDateTimeUTC.isAfter(endDateTimeUTC)) {
				LogWrapper.error(getClass(), "StartDate cannot be after EndDate");
				throw new SoapValidationException("StartDate cannot be after EndDate");
			}
			
			// Fetch maximum allowed days from database
			ParameterMaster qhDateRange = ApplicationConfig.getQhDateRange();
			int maxDays = 2; // Default fallback value
			
			if (qhDateRange != null && qhDateRange.getValue() != null && !qhDateRange.getValue().trim().isEmpty()) {
				try {
					maxDays = Integer.parseInt(qhDateRange.getValue().trim());
					LogWrapper.info(getClass(), "HOTService class | validateType2DateFilters() method | Maximum Date Range from DB"+maxDays );
					if (maxDays <= 0) {
						LogWrapper.warn(getClass(), "Invalid maxDays value from DB: " + qhDateRange.getValue() + ". Using default value: 2");
						maxDays = 2;
					}
				} catch (NumberFormatException e) {
					LogWrapper.warn(getClass(), "Failed to parse maxDays from DB value: " + qhDateRange.getValue() + ". Using default value: 2");
					maxDays = 2;
				}
			} else {
				LogWrapper.warn(getClass(), "QhDateRange not found in DB. Using default value: 2");
			}
			
			// Validate date range does not exceed maxDays (check actual duration precisely)
			// Calculate exact duration and check if it exceeds exactly maxDays (even by 1 second)
			java.time.Duration duration = java.time.Duration.between(
					startDateTimeUTC.toLocalDateTime(), 
					endDateTimeUTC.toLocalDateTime()
			);
			java.time.Duration maxDuration = java.time.Duration.ofDays(maxDays);
			
			if (duration.compareTo(maxDuration) > 0) {
				LocalDateTime maxEndDateTimeIST = startDateTimeIST.plusDays(maxDays);
				String errorMessage = String.format("Maximum %d day%s range allowed. EndDate must be %s or earlier.",
						maxDays, maxDays == 1 ? "" : "s", maxEndDateTimeIST.format(formatter));
				LogWrapper.error(getClass(), errorMessage);
				throw new SoapValidationException(errorMessage);
			}
		}
		
		// Log validation results
		if (endDateStr != null && !endDateStr.trim().isEmpty() && endDateTimeUTC != null) {
			LogWrapper.info(getClass(), String.format(
				"HOTService class | validateType2DateFilters() method | Date filters validated successfully | StartDate (IST): %s | EndDate (IST): %s | StartDate (UTC): %s | EndDate (UTC): %s",
				startDateTimeIST.format(formatter),
				LocalDateTime.parse(endDateStr.trim(), formatter).format(formatter),
				startDateTimeUTC.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
				endDateTimeUTC.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
			));
		} else {
			LogWrapper.info(getClass(), String.format(
				"HOTService class | validateType2DateFilters() method | Date filters validated successfully | StartDate (IST): %s | EndDate (IST): N/A | StartDate (UTC): %s | EndDate (UTC): N/A",
				startDateTimeIST.format(formatter),
				startDateTimeUTC.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
			));
		}
	}
	
	public OnboardResponse processCandidateRequest(ProcessCandidate request) throws Exception
	{
		if (request == null || request.getCanDetails() == null) {
			LogWrapper.error(getClass(), "HOTService class | processCandidateRequest() method | Request or candidate details is null");
			throw new SoapValidationException("Candidate details are required");
		}
		
	    String candidateID = request.getCanDetails().getCandiateID();
	    String nameAsPerAadhar = request.getCanDetails().getNameAsPerAadhar();
		String logMessage = String.format("HOTService class | processCandidateRequest() method | Started | candidateId=%s | Name on Aadhar=%s", candidateID,nameAsPerAadhar);
		LogWrapper.info(getClass(), logMessage);
		
		LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Calling getEmployeeDetailsApi");
//		String response=api.getEmployeeDetailsApi(request);
		LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Received response from getEmployeeDetailsApi");
		
		String xml ="<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\"><SOAP-ENV:Header/><SOAP-ENV:Body><ns2:fetchEmployeeDetailsResponse xmlns:ns2=\"http://www.ril.com/MODEL/STAR/XSD/HCM/QueryEmployeeDetails/Synchronous/fetchEmployeeDetailsRequest.xsd\"><ns2:EmployeeDetailsResponse><ns2:clientid>430</ns2:clientid><ns2:employeecode>10071048</ns2:employeecode><ns2:title>Mr.</ns2:title><ns2:firstname>Vipin</ns2:firstname><ns2:lastname>Damle</ns2:lastname><ns2:gender>1</ns2:gender><ns2:gender_text>Male</ns2:gender_text><ns2:maritalstatuscode>1</ns2:maritalstatuscode><ns2:maritalstatustext>Marrd.</ns2:maritalstatustext><ns2:dateofbirth>1988-01-02</ns2:dateofbirth><ns2:dateofjoining>2019-11-28</ns2:dateofjoining><ns2:employmentstatus>3</ns2:employmentstatus><ns2:employmentstatustext>Active</ns2:employmentstatustext><ns2:employeemailid>VIPIN1.DAMLE@RIL.COM</ns2:employeemailid><ns2:employeedomainid>VIPIN1.DAMLE</ns2:employeedomainid><ns2:mobileno>+917666456714</ns2:mobileno><ns2:officeno>+912279651053</ns2:officeno><ns2:companycode>6031</ns2:companycode><ns2:companytext>Jio Platforms Limited</ns2:companytext><ns2:designationcode>MGR</ns2:designationcode><ns2:designationtext>Manager</ns2:designationtext><ns2:positioncode>45197652</ns2:positioncode><ns2:positiontext>Technical Lead</ns2:positiontext><ns2:personnelareacode>JOPL</ns2:personnelareacode><ns2:personalsubareacode>RIMM</ns2:personalsubareacode><ns2:personalsubareatext/><ns2:locationcode>RC23</ns2:locationcode><ns2:locationtext>Rel Cor Park-Block TC23</ns2:locationtext><ns2:locationcity>Navi Mumbai</ns2:locationcity><ns2:locationstate>Maharashtra</ns2:locationstate><ns2:locationcountry>India</ns2:locationcountry><ns2:l1employeecode>50017254</ns2:l1employeecode><ns2:l1name>Mr. Abhijeet Mahajan</ns2:l1name><ns2:l1email>ABHIJEET.MAHAJAN@RIL.COM</ns2:l1email><ns2:jobrolecode>45282881</ns2:jobrolecode><ns2:jobroletext>Tech Lead Software Development</ns2:jobroletext><ns2:hradmincode>JO5</ns2:hradmincode><ns2:hradmindesc>Luduwina Maniar</ns2:hradmindesc><ns2:orgunit>11000229</ns2:orgunit><ns2:orgunittext>Enterprise Platforms Development</ns2:orgunittext><ns2:proretiringdate/><ns2:dateofleave/><ns2:reasonforleavingcode/><ns2:reasonforleavingtext/><ns2:systemrundate/><ns2:cadre>MGR</ns2:cadre><ns2:nationalityid>IN</ns2:nationalityid><ns2:group>JO</ns2:group><ns2:function>Jio Software Information Technology</ns2:function><ns2:subfunction>Jio Software Development</ns2:subfunction><ns2:hrempcd>10049142</ns2:hrempcd><ns2:hrname>Ms. Priti M Waikul</ns2:hrname><ns2:hremail>PRITI.WAIKUL@RIL.COM</ns2:hremail><ns2:hrhead_empcd>55043909</ns2:hrhead_empcd><ns2:hrhead_name>Mr. Preetham Prakash Singh</ns2:hrhead_name><ns2:jo_stext>NHQ - Mumbai</ns2:jo_stext><ns2:jo_ort01>Mumbai RCP</ns2:jo_ort01><ns2:jo_loccd>N0000001</ns2:jo_loccd><ns2:storecode>IAN5</ns2:storecode><ns2:r4gstate>Mumbai</ns2:r4gstate><ns2:jo_type>NHQ</ns2:jo_type><ns2:zjioregion>NHQ</ns2:zjioregion><ns2:zfunctioncd/><ns2:zfunctiontxt/><ns2:zsubfunctioncd/><ns2:zsubfunctiontxt/><ns2:sid>P30CLNT430</ns2:sid></ns2:EmployeeDetailsResponse><ns2:Message>Authorization Is Successful</ns2:Message></ns2:fetchEmployeeDetailsResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>";
		
		String jobrolecode =null;
		String jobroletext =null;
		String orgunit=null; 
		String orgunittext = null;
		String msg = null;
		String date=null;
		String gender="M";
		Map<String, String> userInfo = null;
			
		if (!(xml==null) && !(request==null))
		{
			LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Extracting key-value pairs from XML response");
			try {
				userInfo = extractKeyValuePairsFromXml(xml);
				jobrolecode = userInfo.get("ns2:jobrolecode");
				jobroletext = userInfo.get("ns2:jobroletext");
				orgunit = userInfo.get("ns2:orgunit");
				orgunittext = userInfo.get("ns2:orgunittext");
				msg =userInfo.get("ns2:Message");
				LogWrapper.info(getClass(), String.format("HOTService class | processCandidateRequest() method | Extracted values | jobrolecode=%s, jobroletext=%s, orgunit=%s, orgunittext=%s, msg=%s", 
						jobrolecode, jobroletext, orgunit, orgunittext, msg));
			} catch (Exception e) {
				
				HOTServiceImpl.log.error("Exception occurred while getting values of jobrolecode, jobroletext, orgunit,orgunittext | Exception: {} | Message: {} | Cause: {}",
						e.getClass().getCanonicalName(),
						ExceptionUtils.getMessage(e),
						ExceptionUtils.getRootCauseMessage(e)
						);
			}
			
			
//			if (("Authorization Is Successful").equalsIgnoreCase(msg))
//			{		
		       String expectedDOJ = request.getCanDetails().getExpectedDOJ();
		       if(expectedDOJ == null || expectedDOJ.isEmpty())	
	           {
			      date =java.time.LocalDate.now().toString();
			      LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Setting default date to current date | date=" + date);
			   }
		       
		       String requestGender = request.getCanDetails().getGender();
		       if(requestGender != null && !requestGender.isEmpty())
		       {
		    	   gender=requestGender;
		    	   LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Setting gender from request | gender=" + gender);
		       }
		       
		       LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Building candidate details for onboarding");
		       
		       // Extract phone number safely
		       String phoneNo = request.getCanDetails().getPhoneNo();
		       String mobileNo = (phoneNo != null && phoneNo.length() >= 10) 
		    		   ? phoneNo.substring(phoneNo.length() - 10) 
		    		   : phoneNo;
		       
		       // Extract onboarder name safely
		       String onBoardDomain = request.getCanDetails().getOnBoardDomain();
		       String onboarderName = (onBoardDomain != null) 
		    		   ? onBoardDomain.replaceAll("[^a-zA-Z.]", "").replaceAll("[.]", " ") 
		    		   : "";
		       
		         CandidateDetails candidateOnbrd = CandidateDetails.builder()
			    .firstName(request.getCanDetails().getFirstName())
				.lastName(request.getCanDetails().getLastName())
				.dob(request.getCanDetails().getDateOfBirth())
				.mobileNo(mobileNo)
				.emailId(request.getCanDetails().getEmailId())
			    .idProofNo(DecryptPII.decrypt(request.getCanDetails().getIDProfNo()))
			    .middleName(request.getCanDetails().getMiddleName())
			    .localAddress(request.getCanDetails().getLocalAddress())
			    .localPincode(request.getCanDetails().getLPin())
			    .permanentAddress(request.getCanDetails().getPermanentAddress())
			    .permanentPincode(request.getCanDetails().getPPin())
			    .gender(gender.equalsIgnoreCase("Female") ? "FEMALE" : "MALE")
				.ctc(request.getCanDetails().getCTC())
				.candidateId(candidateID)
			    .fatherName(request.getCanDetails().getFatherName())
			    .bankName(request.getCanDetails().getBankName())
			    .ifscCode(request.getCanDetails().getIFSCCODE())
			    .expectedDoJ(date)
			    .pan(request.getCanDetails().getPAN())
			    .sapCode(request.getCanDetails().getSAPCode())
			    .jioCentreCode(request.getCanDetails().getJCCode())
			    .designation(request.getCanDetails().getDesignation())
			    .hiringManagerECNo(request.getCanDetails().getHMECCNO())
			    .onboarderEmail(request.getCanDetails().getOnBoardEmail())
			    .onboarderECNo(request.getCanDetails().getOnBoardECNO())
			    .onboarderName(onboarderName)
			    .bankName(DecryptPII.decrypt(request.getCanDetails().getBankName()))
			    .accountNo(DecryptPII.decrypt(request.getCanDetails().getAccountNumber()))
			    .ifscCode(DecryptPII.decrypt(request.getCanDetails().getIFSCCODE()))
			    .pan(DecryptPII.decrypt(request.getCanDetails().getPAN()))
			    .expectedJoiningDate(request.getCanDetails().getExpectedDOJ())
			    .qualification(request.getCanDetails().getEducationLevel())
			    .fatherName(request.getCanDetails().getFatherName())
			    .positionCodeId(request.getCanDetails().getPositionCode())
			    .nameAsPerIdProof(request.getCanDetails().getNameAsPerAadhar())
			    .profilePicUrl("")
				.build();
		
		CandidateOnboardRequest cr = CandidateOnboardRequest.builder()
				.action("ADD")
				.candidateDetails(candidateOnbrd)
				.build();
		
		LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Calling callCandidateOnboardApi");
		final CandidateOnboardResponse platformEmpOnboardResponse  = api.callCandidateOnboardApi(cr);
		LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Received response from callCandidateOnboardApi | status=" + platformEmpOnboardResponse.getStatus());
		
        
		if (platformEmpOnboardResponse.getStatus()==1) {
			LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Successfully processed candidate onboarding");
			final OnboardResponse onboard = OnboardResponse.builder().clientTxnId(platformEmpOnboardResponse.getClientTxnId()).status(1)
					.success(BooleanUtils.TRUE).errors("").resource(platformEmpOnboardResponse.getResource()).build();
	
			// Save candidate details only if resource are not null
			if (platformEmpOnboardResponse.getResource() != null ) {
				CandidateDetailsModel cd = CandidateDetailsModel.builder()
						.candidateId(platformEmpOnboardResponse.getResource().platformEmpOnboardResponse.candidateId)
						.uuid(platformEmpOnboardResponse.getResource().platformEmpOnboardResponse.uuid)
						.orgId(platformEmpOnboardResponse.getOrgId())
						.build();
				try {
					candidateDetailsRepository.save(cd);
					LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Saved candidate details to repository");
				}
				catch (Exception e)
				{
					LogWrapper.error(getClass(), "HOTService class | processCandidateRequest() method | Failed to save candidate_details to database | error=" + e.getMessage(), e);
				}
			} else {
				LogWrapper.warn(getClass(), "HOTService class | processCandidateRequest() method | Resource or platformEmpOnboardResponse is null, skipping candidate details save");
			}

			return onboard;
		}
		else
		{
			//String error =platformEmpOnboardResponse.getResource().getPlatformEmpOnboardResponse().error_message;
			
		    String error = platformEmpOnboardResponse.getErrors();   
		    LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Failed to process candidate onboarding | error=" + error);
			return OnboardResponse.builder()
					.clientTxnId(String.valueOf(platformEmpOnboardResponse.getClientTxnId()))
					.status(0)
					.success(BooleanUtils.FALSE)
					.errors(error)
					.resource("").build();
		}
		}
		// If status is neither 1 nor 0, return error response
		String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR","035");
		LogWrapper.info(getClass(), "HOTService class | processCandidateRequest() method | Failed to process candidate request, returning error response");
		
		return  OnboardResponse.builder()
				.clientTxnId(candidateID)
				.status(0)
				.success(BooleanUtils.FALSE)
				.errors(CommonUtils.modifyJsonMessage(str))
				.resource(request)
				.build();
		
	}
	
	public ProcessCandidateResult processCandidate(ProcessCandidate request) throws Exception {

		String candidateID = request.getCanDetails().getCandiateID();
		String logMessage = String.format("HOTService class | processCandidate() method | Started | candidateId=%s", candidateID);
		LogWrapper.info(getClass(), logMessage);

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("HOT");
		employeeLog.setEmpId(candidateID);
		employeeLog.setTransMode("ProcessCandidate");
		ObjectNode candidateDetailsJson = mapper.valueToTree(request.getCanDetails());
		candidateDetailsJson.remove("token");
		employeeLog.setRequest(mapper.writeValueAsString(candidateDetailsJson));
		employeeLog.setRequestTime(LocalDateTime.now());
		
		final OnboardResponse responseBody =processCandidateRequest(request);
		ProcessCandidateResult response = new ProcessCandidateResult();
		
		String msg;
		String candidateId;
		ArrayOfString array = new ArrayOfString();
		candidateId = responseBody.getClientTxnId();
		if(("true").equalsIgnoreCase(responseBody.getSuccess()))
		{ 
			msg="Success";
			
			array.getString().addAll(List.of(candidateId,msg));

			employeeLog.setTransId(candidateId);
			employeeLog.setResponse(mapper.writeValueAsString(responseBody));
			employeeLog.setResponseTime(LocalDateTime.now());
			employeeLog.setStatus("SUCCESS");
			LogWrapper.info(getClass(), "HOTService class | processCandidate() method | Successfully processed candidate | candidateId=" + candidateId);
			
		}else
		{
			msg="Failed";
			array.getString().addAll(List.of(responseBody.getErrors() != null ? responseBody.getErrors() : "", msg));
			employeeLog.setTransId(candidateId);
			employeeLog.setResponse(mapper.writeValueAsString(responseBody));
			employeeLog.setResponseTime(LocalDateTime.now());
			employeeLog.setStatus("FAILED");

			LogWrapper.info(getClass(), "HOTService class | processCandidate() method | Failed to process candidate | candidateId=" + candidateID + " | error=" + responseBody.getErrors());
		}
		
		try {
			employeeLogRepository.save(employeeLog);
		} catch (Exception e) {
			LogWrapper.error(getClass(), "HOTService class | processCandidate() method | Failed to save employee log to database | error=" + e.getMessage(), e);
		}
		response.setProcessCandidateResult(array);
		LogWrapper.info(getClass(), "HOTService class | processCandidate() method | Returning ProcessCandidateResult");
		return response;
	}

	public Map<String, String> extractKeyValuePairsFromXml(String xml) throws Exception {
		LogWrapper.info(getClass(), "HOTService class | extractKeyValuePairsFromXml() method | Started");
        Map<String, String> keyValuePairs = new HashMap<>();
   
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        InputSource inputSource = new InputSource(new StringReader(xml));
        Document document = builder.parse(inputSource);

        NodeList nodeList = document.getElementsByTagName("*");
        for (int i = 0; i < nodeList.getLength(); i++) {
            Element element = (Element) nodeList.item(i);
            String key = element.getNodeName();
            String value = element.getTextContent();
            keyValuePairs.put(key, value);
        }

        LogWrapper.info(getClass(), "HOTService class | extractKeyValuePairsFromXml() method | Successfully extracted " + keyValuePairs.size() + " key-value pairs from XML");
        return keyValuePairs;
    }
	
	private List<String> extractPositionsNameFromXml(String xml) {
		List<String> positionsNameList = new ArrayList<>();
		Set<String> uniquePositionsName = new HashSet<>();
		
		if (xml == null || xml.trim().isEmpty()) {
			LogWrapper.warn(getClass(), "HOTService class | extractPositionsNameFromXml() method | XML is null or empty");
			return positionsNameList;
		}
		
		try {
			String parseableXml = escapeBareAmpersandsForXmlParsing(xml);
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			DocumentBuilder builder = factory.newDocumentBuilder();
			InputSource inputSource = new InputSource(new StringReader(parseableXml));
			Document document = builder.parse(inputSource);

			// Extract all positionsName elements
			NodeList positionsNameNodes = document.getElementsByTagName("positionsName");
			for (int i = 0; i < positionsNameNodes.getLength(); i++) {
				Element element = (Element) positionsNameNodes.item(i);
				String positionsName = element.getTextContent();
				if (positionsName != null && !positionsName.trim().isEmpty()) {
					// Use Set to avoid duplicates
					uniquePositionsName.add(positionsName.trim());
				}
			}
			
			// Convert Set to List
			positionsNameList = new ArrayList<>(uniquePositionsName);
			LogWrapper.info(getClass(), "HOTService class | extractPositionsNameFromXml() method | Successfully extracted " + positionsNameList.size() + " unique positionsName values");
		} catch (Exception e) {
			LogWrapper.error(getClass(), "HOTService class | extractPositionsNameFromXml() method | Error extracting positionsName from XML: " + e.getMessage(), e);
		}
		
		return positionsNameList;
	}

	private static String escapeBareAmpersandsForXmlParsing(String xml) {
		if (xml == null || xml.isEmpty()) {
			return xml;
		}
		return XML_BARE_AMPERSAND.matcher(xml).replaceAll("&amp;");
	}
	
	public OnboardResponse updateDOJRequest (UpdateDOJ request) throws JsonMappingException, JsonProcessingException
	{
		String id= request.getId();
		String candidateId=String.valueOf(id);
		String logMessage = String.format("HOTService class | updateDOJRequest() method | Started | candidateId=%s", candidateId);
		LogWrapper.info(getClass(), logMessage);
		
		CandidateDetails candidateOnbrd = CandidateDetails.builder()
				.candidateId(id)
				.joiningDate(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
				.build();
		
		CandidateOnboardRequest cr = CandidateOnboardRequest.builder()
				.action("MOD")
				.candidateDetails(candidateOnbrd)
				.build();
		
		LogWrapper.info(getClass(), "HOTService class | updateDOJRequest() method | Calling callCandidateOnboardApi for DOJ update");
		 CandidateOnboardResponse updateDOJReq  = api.callCandidateOnboardApi(cr);
		 LogWrapper.info(getClass(), "HOTService class | updateDOJRequest() method | Received response from callCandidateOnboardApi | status=" + updateDOJReq.getStatus());
		
		 if (updateDOJReq.getStatus()==1) {
			LogWrapper.info(getClass(), "HOTService class | updateDOJRequest() method | Successfully updated DOJ");
			return  OnboardResponse.builder().clientTxnId(updateDOJReq.getClientTxnId()).status(1)
						.success(BooleanUtils.TRUE).errors("").resource(updateDOJReq.getResource()).build();
			 
			 
			 
		 }
		 else if (updateDOJReq.getStatus()==0) 
		 {
			 LogWrapper.info(getClass(), "HOTService class | updateDOJRequest() method | Failed to update DOJ | error=" + updateDOJReq.getErrors());
		 return  OnboardResponse.builder().clientTxnId(updateDOJReq.getClientTxnId()).status(0)
					.success(BooleanUtils.FALSE).errors(updateDOJReq.getErrors()).resource("").build();
		 } 
		 else
		 {
			 String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR","031");
			 LogWrapper.info(getClass(), "HOTService class | updateDOJRequest() method | Unexpected status in updateDOJRequest");
			 
			 return  OnboardResponse.builder().clientTxnId(candidateId).status(0)
						.success(BooleanUtils.FALSE).errors(CommonUtils.modifyJsonMessage(str)).resource(request).build();
			 
		 }
	}
	
	public UpdateDOJResponse updateDOJResp( UpdateDOJ request) throws Exception {

		if(request.getId()==null || request.getId().isBlank())
		{
			throw new SoapValidationException("candidate Id is either not present or empty");
		}
		String candidateId = String.valueOf(request.getId());
		String logMessage = String.format("HOTService class | updateDOJResp() method | Started | candidateId=%s", candidateId);
		LogWrapper.info(getClass(), logMessage);

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("HOT");
		employeeLog.setEmpId(candidateId);
		employeeLog.setTransMode("updateDOJ");
		ObjectNode updateDOJJson = mapper.valueToTree(request);
		updateDOJJson.remove("token");
		employeeLog.setRequest(mapper.writeValueAsString(updateDOJJson));
		employeeLog.setRequestTime(LocalDateTime.now());
		
		UpdateDOJResponse response = new UpdateDOJResponse();
		OnboardResponse responseBody = updateDOJRequest(request);
		
	    String msg;
		
		if(("true").equalsIgnoreCase(responseBody.getSuccess()))
		{ 
			msg="Success:" + request.getId();
			LogWrapper.info(getClass(), "HOTService class | updateDOJResp() method | Successfully updated DOJ | candidateId=" + candidateId);
		}else
		{
			msg="Failed";
			LogWrapper.info(getClass(), "HOTService class | updateDOJResp() method | Failed to update DOJ | candidateId=" + candidateId);
		}
		employeeLog.setTransId(responseBody.getClientTxnId());
		employeeLog.setResponse(mapper.writeValueAsString(responseBody));
		employeeLog.setResponseTime(LocalDateTime.now());
		employeeLog.setStatus(responseBody.getSuccess().equalsIgnoreCase("true") ? "SUCCESS" : "FAILED");
		try {
			employeeLogRepository.save(employeeLog);
		} catch (Exception e) {
			LogWrapper.error(getClass(), "HOTService class | updateDOJResp() method | Failed to save employee log to database | error=" + e.getMessage(), e);
		}

		ArrayOfString array = new ArrayOfString();
//		array.getString().addAll(List.of(responseBody.getErrors() != null ? responseBody.getErrors() : "", msg));
		String resultText =
		        (responseBody.getErrors() == null || responseBody.getErrors().isEmpty())
		                ? "Success"
		                : responseBody.getErrors();
		array.getString().addAll(List.of(resultText, msg));
		response.setUpdateDOJResult(array);
		
		return response;
	}
	
	public OnboardResponse uploadProfilePhoto(UpdatePhoto request) throws JsonMappingException, JsonProcessingException {

		String id = request.getId();
		String candidateId = String.valueOf(id);
		String logMessage = String.format("HOTService class | uploadProfilePhoto() method | Started | candidateId=%s", candidateId);
		LogWrapper.info(getClass(), logMessage);
		
		String photo = request.getPhoto();
		if(photo == null || photo.isBlank())
		{
			throw new SoapValidationException("photo is either not present or empty");
		}
		String imageFileName = HOTServiceImpl.EMPLOYEE_CODE_PREFIX+request.getId(); 
		LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Uploading image to Azure Blob Storage");
		String downloadUrl= azureBlobService.pushImageToAzureBlobStorage(request.getId(),photo);
		LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Successfully uploaded image to Azure Blob Storage | downloadUrl=" + downloadUrl);
		
		CandidateDetails candidateOnbrd = CandidateDetails.builder()
				.candidateId(id)
				.profilePicUrl(downloadUrl)
				.build();
		
		CandidateOnboardRequest cr = CandidateOnboardRequest.builder()
				.action("MOD")
				.candidateDetails(candidateOnbrd)
				.build();
		 LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Calling callCandidateOnboardApi for profile photo update");
		 CandidateOnboardResponse platformEmpOnboardResponse  = api.callCandidateOnboardApi(cr);
		 LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Received response from callCandidateOnboardApi | status=" + platformEmpOnboardResponse.getStatus());
			
			
		 if (platformEmpOnboardResponse.getStatus()==1) {
			LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Successfully updated profile photo");
			
//			 HotMessagePublishRequest hotMessagePublishRequest = new HotMessagePublishRequest();
//			 hotMessagePublishRequest.setCandidateId(candidateId);
//			 hotMessagePublishRequest.setStatus("Joined");
//				
//			 final var messagePublishRequest = new MessagePublisherRequest();
//				messagePublishRequest.setTopicName("cwms-sample-topic-3");
//				messagePublishRequest.setModuleName("onboard");
//				messagePublishRequest.setMessage(new ObjectMapper().writeValueAsString(hotMessagePublishRequest));
//
//				HttpHeaders headers =new HttpHeaders();
//				try {
//					LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Publishing message to Kafka topic");
//					final MessagePublisherResponse onboardRequestPublished = cwmsPublisherApis.callPublishAPI("", headers,messagePublishRequest);
//					
//					if ("1".equals(onboardRequestPublished.getStatus())) {
//						LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Successfully published message to Kafka Topic");
//						LogWrapper.info(getClass(), "Message Published to Kafka Topic: " + messagePublishRequest.getTopicName() +", Published Message: " +messagePublishRequest.getMessage());
//					} else {
//						LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Failed to publish message to Kafka Topic");
//					}
//				} catch (Exception e) {
//					LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Exception occurred while publishing message to Kafka Topic | error=" + e.getMessage());
//					LogWrapper.error(getClass(), "Failed to publish message to Kafka Topic: " + messagePublishRequest.getTopicName() +", Error Message: "+ e.getMessage());
//				}
				
			 
			return  OnboardResponse.builder().clientTxnId(platformEmpOnboardResponse.getClientTxnId()).status(1)
						.success(BooleanUtils.TRUE).errors("").resource(platformEmpOnboardResponse.getResource()).build();
			 	 
		 }
		 else if (platformEmpOnboardResponse.getStatus()==0) 
		 {
			 LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Failed to update profile photo | error=" + platformEmpOnboardResponse.getErrors());
		 return  OnboardResponse.builder().clientTxnId(platformEmpOnboardResponse.getClientTxnId()).status(0)
					.success(BooleanUtils.FALSE).errors(platformEmpOnboardResponse.getErrors()).resource("").build();
		 } 
		 else
		 {
			 
			 String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR","031");
			 LogWrapper.info(getClass(), "HOTService class | uploadProfilePhoto() method | Unexpected status in uploadProfilePhoto");
			 
			 return  OnboardResponse.builder().clientTxnId(candidateId).status(0)
						.success(BooleanUtils.FALSE).errors(CommonUtils.modifyJsonMessage(str)).resource(request).build();
				
		 }
	}

	public UpdatePhotoResponse updatePhotoResp(@RequestPayload UpdatePhoto request) throws Exception {
		if(request.getId()== null || request.getId().isBlank())
		{
			throw new SoapValidationException("id is either not present or empty");
		}

		String candidateId = String.valueOf(request.getId());
		String logMessage = String.format("HOTService class | updatePhotoResp() method | Started | candidateId=%s", candidateId);
		LogWrapper.info(getClass(), logMessage);

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("HOT");
		employeeLog.setEmpId(candidateId);
		employeeLog.setTransMode("updatePhoto");
		employeeLog.setRequestTime(LocalDateTime.now());
		
		OnboardResponse responseBody =uploadProfilePhoto(request);
		UpdatePhotoResponse response = new UpdatePhotoResponse();
		  String msg;
			
			if(("true").equalsIgnoreCase(responseBody.getSuccess()))
			{ 
				msg="Success:" + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
				LogWrapper.info(getClass(), "HOTService class | updatePhotoResp() method | Successfully updated photo | candidateId=" + candidateId);
				
			}else
			{
				msg="Failed";
				LogWrapper.info(getClass(), "HOTService class | updatePhotoResp() method | Failed to update photo | candidateId=" + candidateId);
			}

		ArrayOfString array = new ArrayOfString();
//		array.getString().addAll(List.of(responseBody.getErrors() != null ? responseBody.getErrors() : "", msg)); 
//		response.setUpdatePhotoResult(array);
		String resultText =
		        (responseBody.getErrors() == null || responseBody.getErrors().isEmpty())
		                ? "Success"
		                : responseBody.getErrors();
		array.getString().addAll(List.of(resultText, msg));
		response.setUpdatePhotoResult(array);
		employeeLog.setTransId(responseBody.getClientTxnId());
		employeeLog.setResponse(mapper.writeValueAsString(responseBody));
		employeeLog.setResponseTime(LocalDateTime.now());
		employeeLog.setStatus(responseBody.getSuccess().equalsIgnoreCase("true") ? "SUCCESS" : "FAILED");
		try {
			employeeLogRepository.save(employeeLog);
		} catch (Exception e) {
			LogWrapper.error(getClass(), "HOTService class | updatePhotoResp() method | Failed to save employee log to database | error=" + e.getMessage(), e);
		}
		
		return response;
	}

	public GetCandidateStatusResponse CandidateStatusRequest (GetCandidateStatus request) throws JsonMappingException, JsonProcessingException
	{
		int id = request.getCandidateID();
		String candidateId=String.valueOf(id);
		String logMessage = String.format("HOTService class | CandidateStatusRequest() method | Started | candidateId=%s", candidateId);
		LogWrapper.info(getClass(), logMessage);

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("HOT");
		employeeLog.setEmpId(candidateId);
		employeeLog.setTransMode("CandidateStatusRequest");
		ObjectNode candidateStatusJson = mapper.valueToTree(request);	
		candidateStatusJson.remove("token");
		employeeLog.setRequest(mapper.writeValueAsString(candidateStatusJson));
		employeeLog.setRequestTime(LocalDateTime.now());
	    
		CandidateStatusRequest cr =CandidateStatusRequest.builder()
				.action("CS")
				.typeCode("1")
				.candidateId(candidateId)
				.build();
		
		LogWrapper.info(getClass(), "HOTService class | CandidateStatusRequest() method | Calling getCandidateDetailsApi for candidate status");
		 CandidateOnboardResponse candidateStatusRequest  = api.getCandidateDetailsApi(cr);
		 LogWrapper.info(getClass(), "HOTService class | CandidateStatusRequest() method | Received response from getCandidateDetailsApi | status=" + candidateStatusRequest.getStatus());
		
		 GetCandidateStatusResponse response = new GetCandidateStatusResponse();
		 ArrayOfString array = new ArrayOfString();
			
		 HashMap<String,String> hs = new HashMap<String , String>();
		 hs.put("READY_TO_OFFER", "3");
		 hs.put("READY_TO_JOIN_UPDATED_BY_AGENCY", "4");
		 hs.put("READY_TO_JOIN_APPROVED_BY_MANAGER", "5");
		 hs.put("JOINED", "6");

		  hs.put("TERMINATED", "7");
			
		 if (candidateStatusRequest.getStatus()==1) {
			 LogWrapper.info(getClass(), "HOTService class | CandidateStatusRequest() method | Successfully retrieved candidate status");

			 if(hs.containsKey(candidateStatusRequest.getResource().status))
			 {
				array.getString().addAll(List.of(hs.get(candidateStatusRequest.getResource().status),candidateStatusRequest.getResource().modifiedon));
				response.setGetCandidateStatusResult(array);
				employeeLog.setTransId(candidateStatusRequest.getClientTxnId());
				employeeLog.setResponse(mapper.writeValueAsString(response));
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getGetCandidateStatusResult() != null && !response.getGetCandidateStatusResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
				try {
					employeeLogRepository.save(employeeLog);
				} catch (Exception e) {
					LogWrapper.error(getClass(), "HOTService class | CandidateStatusRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
				}

				return response;
			}

			
			
				array.getString().addAll(List.of(candidateStatusRequest.getResource().status,candidateStatusRequest.getResource().modifiedon));
				response.setGetCandidateStatusResult(array);
				employeeLog.setTransId(candidateStatusRequest.getClientTxnId());
				employeeLog.setResponse(mapper.writeValueAsString(response));
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getGetCandidateStatusResult() != null && !response.getGetCandidateStatusResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
				try {
					employeeLogRepository.save(employeeLog);
				} catch (Exception e) {
					LogWrapper.error(getClass(), "HOTService class | CandidateStatusRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
				}

				return response;
			
			  }
		 else if(candidateStatusRequest.getStatus()==0)
		 {
			 LogWrapper.info(getClass(), "HOTService class | CandidateStatusRequest() method | Failed to retrieve candidate status | error=" + candidateStatusRequest.getErrors());
				array.getString().addAll(List.of("Failed" , candidateStatusRequest.getErrors() != null ? candidateStatusRequest.getErrors() : "" ));
				response.setGetCandidateStatusResult(array);
				employeeLog.setTransId(candidateStatusRequest.getClientTxnId());
				employeeLog.setResponse(mapper.writeValueAsString(response));
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getGetCandidateStatusResult() != null && !response.getGetCandidateStatusResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
				try {
					employeeLogRepository.save(employeeLog);
				} catch (Exception e) {
					LogWrapper.error(getClass(), "HOTService class | CandidateStatusRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
				}

				return response;
		 }
		 else
		 {
			 String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR","031");
			 LogWrapper.info(getClass(), "HOTService class | CandidateStatusRequest() method | Unexpected status in CandidateStatusRequest");
				
			 array.getString().addAll(List.of("Failed" , CommonUtils.modifyJsonMessage(str)));
				response.setGetCandidateStatusResult(array);
				employeeLog.setTransId(candidateStatusRequest.getClientTxnId());
				employeeLog.setResponse(mapper.writeValueAsString(response));
				employeeLog.setResponseTime(LocalDateTime.now());
				employeeLog.setStatus(response.getGetCandidateStatusResult() != null && !response.getGetCandidateStatusResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
				try {
					employeeLogRepository.save(employeeLog);
				} catch (Exception e) {
					LogWrapper.error(getClass(), "HOTService class | CandidateStatusRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
				}

				return response;
		 }
	}
	
	public GetDetailsResponse getCandidateDetailsRequest (GetDetails request) throws Exception
	{
		if(request.getId()==null || request.getId().isBlank())
		{
			throw new SoapValidationException("id is either not present or empty");
		}
		String id= request.getId();
		String logMessage = String.format("HOTService class | getCandidateDetailsRequest() method | Started | managerId=%s", id);
		LogWrapper.info(getClass(), logMessage);

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("HOT");
		employeeLog.setEmpId(id);
		employeeLog.setTransMode("getDetails");
		ObjectNode getDetailsJson = mapper.valueToTree(request);
		getDetailsJson.remove("token");
		employeeLog.setRequest(mapper.writeValueAsString(getDetailsJson));
		employeeLog.setRequestTime(LocalDateTime.now());
		
		CandidateStatusRequest cr =CandidateStatusRequest.builder()
				.action("CD")
				.typeCode("1")
				.managerId(id)
				.build();
		
		LogWrapper.info(getClass(), "HOTService class | getCandidateDetailsRequest() method | Calling getCandidateDetailsApi");
		 CandidateOnboardResponse getCandidateDetailsReq  = api.getCandidateDetailsApi(cr);
		 LogWrapper.info(getClass(), "HOTService class | getCandidateDetailsRequest() method | Received response from getCandidateDetailsApi | status=" + getCandidateDetailsReq.getStatus());
		
		 LogWrapper.info(getClass(), "Better API call ended Mapping in response Starts :");
		//  LogWrapper.info(getClass(), "response from Betterplace API,Candidate payload :" + getCandidateDetailsReq.getResource().getCandidateDetail() );
		 GetDetailsResponse response = new GetDetailsResponse();
		      		 
		 if (getCandidateDetailsReq.getStatus()==1) {
			 LogWrapper.info(getClass(), "HOTService class | getCandidateDetailsRequest() method | Successfully retrieved candidate details");
			 LogWrapper.info(getClass(), "Data that is provided for response mapping : " + List.of(CandidateDetailHot.fromRequest(getCandidateDetailsReq.getResource().getCandidateDetail())));
			 
			 
			 ArrayOfString array = new ArrayOfString();
			array.getString().addAll(List.of(cdataCreation.createCdata(List.of(CandidateDetailHot.fromRequest(getCandidateDetailsReq.getResource().getCandidateDetail()))), "Success"));
			response.setGetDetailsResult(array);
			 
//			 response.setGetDetailsResult(cdataCreation.createCdata(List.of(CandidateDetailHot.fromRequest(getCandidateDetailsReq.getResource().getCandidateDetail()))));
			 LogWrapper.info(getClass(), "response :" + response.toString());
			 employeeLog.setTransId(getCandidateDetailsReq.getClientTxnId());
			 employeeLog.setResponse(mapper.writeValueAsString(getCandidateDetailsReq));
			 employeeLog.setResponseTime(LocalDateTime.now());
			 employeeLog.setStatus(response.getGetDetailsResult() != null && !response.getGetDetailsResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
			 try {
				 employeeLogRepository.save(employeeLog);
			 } catch (Exception e) {
				 LogWrapper.error(getClass(), "HOTService class | getCandidateDetailsRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
			 }

			 return response;
			
			  }
		 else if(getCandidateDetailsReq.getStatus()==0 || getCandidateDetailsReq.getErrors() != null)
		 {
			 if(getCandidateDetailsReq.getErrors() != null) {
			 	 LogWrapper.error(getClass(), "HOTService class | getCandidateDetailsRequest() method | Error received from getCandidateDetailsApi: " + getCandidateDetailsReq.getErrors());
			 }
			 LogWrapper.info(getClass(), "HOTService class | getCandidateDetailsRequest() method | Failed to retrieve candidate details, returning empty response");

			 // Handle error message - check if it's JSON or plain text
			 String errorMessage = null;
			 if (getCandidateDetailsReq.getErrors() != null) {
				 String errorStr = getCandidateDetailsReq.getErrors();
				 try {
					 // Try to parse as JSON
					 JsonNode jsonNode = mapper.readTree(errorStr);
					 // If it's valid JSON, use modifyJsonMessage
					 errorMessage = CommonUtils.modifyJsonMessage(errorStr);
				 } catch (JsonProcessingException e) {
					 // If it's not JSON, use the plain text directly
					 LogWrapper.info(getClass(), "HOTService class | getCandidateDetailsRequest() method | Error is plain text, using as-is: " + errorStr);
					 errorMessage = errorStr;
				 }
			 }
			 

			 
			 ArrayOfString errorArray = new ArrayOfString();
			 errorArray.getString().addAll(List.of(errorMessage != null ? errorMessage : "","Failed"));
			 response.setGetDetailsResult(errorArray);
			 employeeLog.setTransId(getCandidateDetailsReq.getClientTxnId());
			 employeeLog.setResponse(mapper.writeValueAsString(getCandidateDetailsReq));
			 employeeLog.setResponseTime(LocalDateTime.now());
			 employeeLog.setStatus("FAILED");
			 try {
				 employeeLogRepository.save(employeeLog);
			 } catch (Exception e) {
				 LogWrapper.error(getClass(), "HOTService class | getCandidateDetailsRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
			 }

			 return response;
		 }
		 else
		 {
			 String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR","031");
			 LogWrapper.info(getClass(), "HOTService class | getCandidateDetailsRequest() method | Unexpected status in getCandidateDetailsRequest");
				
			 ArrayOfString array = new ArrayOfString();
			 array.getString().addAll(List.of(cdataCreation.createCdata(List.of(CommonUtils.modifyJsonMessage(str))), "Failed"));
			 response.setGetDetailsResult(array);
			 employeeLog.setTransId(getCandidateDetailsReq.getClientTxnId());
			 employeeLog.setResponse(mapper.writeValueAsString(response));
			 employeeLog.setResponseTime(LocalDateTime.now());
			 employeeLog.setStatus(response.getGetDetailsResult() != null && !response.getGetDetailsResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
			 try {
				 employeeLogRepository.save(employeeLog);
			 } catch (Exception e) {
				 LogWrapper.error(getClass(), "HOTService class | getCandidateDetailsRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
			 }

			return response;
		 }
	
	}
	
	//Extra Duplicate GetDetails method for Scrum without Token.
	public GetDetailsResponse getScrumCandidateDetailsRequest (GetScrumDetails request) throws Exception
	{
		String id= request.getId();
		String logMessage = String.format("HOTService class | getScrumCandidateDetailsRequest() method | Started | managerId=%s", id);
		LogWrapper.info(getClass(), logMessage);

		EmployeeLog employeeLog = new EmployeeLog();
		employeeLog.setSystemName("HOT");
		employeeLog.setEmpId(id);
		employeeLog.setTransMode("getScrumCandidateDetails");
		employeeLog.setRequest(mapper.writeValueAsString(request));
		employeeLog.setRequestTime(LocalDateTime.now());
		
		CandidateStatusRequest cr =CandidateStatusRequest.builder()
				.action("CD")
				.typeCode("1")
				.managerId(id)
				.build();
		
		LogWrapper.info(getClass(), "HOTService class | getScrumCandidateDetailsRequest() method | Calling getCandidateDetailsApi for Scrum details");
		 CandidateOnboardResponse getCandidateDetailsReq  = api.getCandidateDetailsApi(cr);
		 LogWrapper.info(getClass(), "HOTService class | getScrumCandidateDetailsRequest() method | Received response from getCandidateDetailsApi | status=" + getCandidateDetailsReq.getStatus());
		
		 LogWrapper.info(getClass(), "Better API call ended Mapping in response Starts :");
		 LogWrapper.info(getClass(), "response from Betterplace API,Candidate payload :" + getCandidateDetailsReq.getResource().getCandidateDetail() );
		 GetDetailsResponse response = new GetDetailsResponse();
		      		 
		 if (getCandidateDetailsReq.getStatus()==1) {
			 LogWrapper.info(getClass(), "HOTService class | getScrumCandidateDetailsRequest() method | Successfully retrieved Scrum candidate details");
			 LogWrapper.info(getClass(), "Data that is provided for response mapping : " + List.of(CandidateDetailHot.fromRequest(getCandidateDetailsReq.getResource().getCandidateDetail())));
			 ArrayOfString array = new ArrayOfString();
			 array.getString().addAll(List.of(cdataCreation.createCdata(List.of(CandidateDetailHot.fromRequest(getCandidateDetailsReq.getResource().getCandidateDetail()))), "Success"));
			 response.setGetDetailsResult(array);
			 LogWrapper.info(getClass(), "response :" + response.toString());
			 employeeLog.setTransId(getCandidateDetailsReq.getClientTxnId());
			 employeeLog.setResponse(mapper.writeValueAsString(response));
			 employeeLog.setResponseTime(LocalDateTime.now());
			 employeeLog.setStatus(response.getGetDetailsResult() != null && !response.getGetDetailsResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
			 try {
				 employeeLogRepository.save(employeeLog);
			 } catch (Exception e) {
				 LogWrapper.error(getClass(), "HOTService class | getScrumCandidateDetailsRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
			 }

			 return response;
			
			  }
		 else if(getCandidateDetailsReq.getStatus()==0)
		 {
			 LogWrapper.info(getClass(), "HOTService class | getScrumCandidateDetailsRequest() method | Failed to retrieve Scrum candidate details, returning empty response");
			 ArrayOfString array = new ArrayOfString();
			 array.getString().addAll(List.of(cdataCreation.createCdata(List.of()), "Failed"));
			 response.setGetDetailsResult(array);
			 employeeLog.setTransId(getCandidateDetailsReq.getClientTxnId());
			 employeeLog.setResponse(mapper.writeValueAsString(response));
			 employeeLog.setResponseTime(LocalDateTime.now());
			 employeeLog.setStatus(response.getGetDetailsResult() != null && !response.getGetDetailsResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
			 try {
				 employeeLogRepository.save(employeeLog);
			 } catch (Exception e) {
				 LogWrapper.error(getClass(), "HOTService class | getScrumCandidateDetailsRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
			 }

			 return response;
		 }
		 else
		 {
			 String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR","031");
			 LogWrapper.info(getClass(), "HOTService class | getScrumCandidateDetailsRequest() method | Unexpected status in getScrumCandidateDetailsRequest");
				
			 ArrayOfString array = new ArrayOfString();
			 array.getString().addAll(List.of(cdataCreation.createCdata(List.of(CommonUtils.modifyJsonMessage(str))), "Failed"));
			 response.setGetDetailsResult(array);
			 employeeLog.setTransId(getCandidateDetailsReq.getClientTxnId());
			 employeeLog.setResponse(mapper.writeValueAsString(response));
			 employeeLog.setResponseTime(LocalDateTime.now());
			 employeeLog.setStatus(response.getGetDetailsResult() != null && !response.getGetDetailsResult().getString().isEmpty() ? "SUCCESS" : "FAILED");
			 try {
				 employeeLogRepository.save(employeeLog);
			 } catch (Exception e) {
				 LogWrapper.error(getClass(), "HOTService class | getScrumCandidateDetailsRequest() method | Failed to save employee log to database | error=" + e.getMessage(), e);
			 }

			return response;
		 }
	}	
}