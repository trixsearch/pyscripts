package com.jio.cwms_dataprovision.Scheduler;

import java.io.StringReader;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import com.cronutils.model.Cron;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms_dataprovision.constants.CwmsConstants;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.BPResponse;
import com.jio.cwms_dataprovision.dto.Response;
import com.jio.cwms_dataprovision.dto.SchedulerConfigRequest;
import com.jio.cwms_dataprovision.dto.System;
import com.jio.cwms_dataprovision.dto.mHere.AddProfile;
import com.jio.cwms_dataprovision.dto.mHere.MHereOnboardResponse;
import com.jio.cwms_dataprovision.entity.AccessRequestLogEntity;
import com.jio.cwms_dataprovision.entity.EmployeeLog;
import com.jio.cwms_dataprovision.repository.AcessRequestLogAsyncRepository;
import com.jio.cwms_dataprovision.repository.EmployeeLogRepository;
import com.jio.cwms_dataprovision.repository.SchedulerConfigRepository;
import com.jio.cwms_dataprovision.service.BetterPlaceService;
import com.jio.cwms_dataprovision.service.MhereHibernationService;
import com.jio.cwms_dataprovision.service.OIMAsyncHibernationService;
import com.jio.cwms_dataprovision.service.OIMService;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class OIMSchedulerService {
	
	@Autowired
	OIMService oIMService;
	
	@Autowired
	ObjectMapper objectMapper;
	
	@Autowired
	SchedulerConfigRepository schedulerConfigRepo;
	
	@Autowired
	AcessRequestLogAsyncRepository acessRequestLogAsyncRepo;
	
	@Autowired
	EmployeeLogRepository employeeLogRepo;
	
	@Autowired
	OIMAsyncHibernationService oIMAsyncHibernationService;
	
	@Autowired
	BetterPlaceService bpService;
	
	public void oimAsyncSchedulerService(SchedulerConfigRequest configRequest, String transMode) {
		 LogWrapper.info(getClass(),
	                "OIM Scheduler Triggered | TransMode: " + transMode +
	                " | BatchSize: " + configRequest.getBatchSize() +
	                " | SchedulerType: " + configRequest.getSchedulerType() +
	                " | Sites: " + configRequest.getCronSite());
		
	    int batchSizeInt = configRequest.getBatchSize().intValue();
	    int maxRetry = configRequest.getMaximumRetry() != null ? configRequest.getMaximumRetry().intValue() : 0;
	    String schedulerType = configRequest.getSchedulerType();
	    Long skipThresholdMinutes = configRequest.getCronExecutionSkipTime();
	    List<String> conditionCheck = Arrays.asList(configRequest.getConditionCheck().split(","));
	    List<String> sites = Arrays.asList(configRequest.getCronSite().split(","));

	    int useInclude = 1;
	    List<AccessRequestLogEntity> pageList = new ArrayList();
	    ZonedDateTime now = ZonedDateTime.now();
	    ZonedDateTime nextExecTime;

	    try {
	    	if (configRequest.getCronExpression() == null || configRequest.getCronExpression().trim().isEmpty()) {
               LogWrapper.error(getClass(), "Cron expression is empty. Scheduler exiting.");
               return;
           }
	        CronParser parser = new CronParser(
	                CronDefinitionBuilder.instanceDefinitionFor(com.cronutils.model.CronType.QUARTZ));

	        Cron cron = parser.parse(configRequest.getCronExpression());
	        cron.validate();

	        ExecutionTime executionTime = ExecutionTime.forCron(cron);
	        Optional<ZonedDateTime> nextExec = executionTime.nextExecution(now);

	        if (nextExec.isEmpty()) {
	        	LogWrapper.warn(getClass(), "Unable to determine Next Execution Time. Scheduler exiting.");
               return;
	        }

	        nextExecTime = nextExec.get();

	        LogWrapper.info(getClass(), "Current Time: " + now);
	        LogWrapper.info(getClass(), "Next Execution Time: " + nextExecTime);

	    } catch (Exception e) {
	        LogWrapper.error(getClass(), "Failed to compute next execution time due to cron parsing failed: " + e.getMessage(), e);
	        return;
	    }
	    LogWrapper.info(getClass(), "Fetching Pending Records | SchedulerType: " + schedulerType);
	    switch  (schedulerType == null ? "" : schedulerType.toUpperCase())  {

	        case "HOURLY":
	        	LogWrapper.info(getClass(), "Scheduler Type: " + schedulerType);
	        	pageList = acessRequestLogAsyncRepo.findPendingFirstHitsInLastHour("OIM",
	                    transMode,
	                    conditionCheck,
	                    sites,
	                    useInclude,
	                    batchSizeInt);
	        	break;
//	        case "HOURLY_REST_ALL":
//	            LogWrapper.info(getClass(), "Scheduler Type: " + schedulerType);
//	            pageList = genetecRequestRepo.findPendingFirstHitsInLastHour(
//	                    "OIM",
//	                    transMode,
//	                    conditionCheck,
//	                    sites,
//	                    useInclude,
//	                    batchSizeInt);
//	            break;

	        case "ONCE":
	            LogWrapper.info(getClass(), "Scheduler Type: ONCE");
	            pageList = acessRequestLogAsyncRepo.findAllFirstHitsWithoutSuccess(
	                    "OIM",
	                    transMode,
	                    conditionCheck,
	                    maxRetry,
	                    batchSizeInt
	            );
	            break;

	        default:
	            LogWrapper.warn(getClass(), "Unknown scheduler type: " + schedulerType);
	            return;
	    }

	    int recordSize = pageList.size();
	    LogWrapper.info(getClass(), "Pending Records Retrieved: " + recordSize);

	    if (recordSize == 0) {
	    	LogWrapper.info(getClass(), "No pending OIM requests found. Scheduler exiting.");
	        return;
	    }

	    LogWrapper.info(getClass(), "Starting OIM " + transMode + " Batch Processing");

	    // --------------------------------------------
	    // STEP 3: Process Each Record
	    // --------------------------------------------
	    for (AccessRequestLogEntity req : pageList) {
	    	LogWrapper.info(getClass(),
                   "Processing START | EmpCode: " + req.getEmpId() +
                   " | TxnId: " + req.getTransId() +
                   " | RetryCount: " + req.getRetry());

	        // Skip execution if within next cron window
	        if (Duration.between(ZonedDateTime.now(), nextExecTime).toMinutes() < skipThresholdMinutes) {
	            LogWrapper.info(getClass(), "Skipping execution due to skipThresholdMinutes for EMP: " + req.getEmpId());
	            continue;
	        }

	        // Validate XML
	        if (isBlank(req.getRequest())) {
	            LogWrapper.error(getClass(),
	                    "Empty XML request found. Marking FAILED | EmpCode=" + req.getEmpId());

	            req.setStatus(CwmsConstants.sysStatusF);
	            req.setResponse("Empty XML request");
	            req.setResponseTime(LocalDateTime.now());
	            acessRequestLogAsyncRepo.save(req);
	            continue;
	        }

	        EmployeeLog employeeLog = new EmployeeLog();
	        employeeLog.setSystemName(ServiceDataEnum.OIM.name());
	        employeeLog.setEmpId(req.getEmpId());
	        employeeLog.setTransId(req.getTransId());
//	        String transMode = req.getTransMode();
	        employeeLog.setTransMode(req.getTransMode());
	        employeeLog.setApprovalStatus(req.getApprovalStatus());
	        employeeLog.setRequest(req.getRequest());
	        employeeLog.setRequestTime(LocalDateTime.now());

	        int currentRetry = req.getRetry() == null ? 0 : req.getRetry().intValue();

	        // Retry check
	        if ("ONCE".equalsIgnoreCase(schedulerType) && currentRetry >= maxRetry) {
	            LogWrapper.warn(getClass(),
	                    "Max retry reached for EMP ID: " + req.getEmpId() + ", retry: " + currentRetry);
	            continue;
	        }

	        try {
	            // --------------------------------------------
	            // Calling OIM API
	            // --------------------------------------------
	        	LogWrapper.info(getClass(),
	                    "Calling OIM Async API | EmpCode=" + req.getEmpId());

	        	  EmployeeLog oimResponseLog =
	                      oIMAsyncHibernationService.callAsyncOIAMHibernation(
	                              req.getRequest(),   // XML
	                              employeeLog,
	                              req.getTransMode(),
	                              false
	                      );
	            
	        	  if (oimResponseLog == null || isBlank(oimResponseLog.getResponse())) {
	        		    LogWrapper.warn(getClass(),
	        		            "OIM returned empty response | EmpId: " + req.getEmpId());

	        		    req.setResponse("OIM returned empty response");
	        		    req.setResponseTime(LocalDateTime.now());
	        		    req.setStatus(CwmsConstants.sysStatusF);
	        		    acessRequestLogAsyncRepo.save(req);
	        		    continue;   
	        		}

	        		String responseXml = oimResponseLog.getResponse();
	        		Document doc = parseXml(responseXml);

	        		String errorCode = getTagValue(doc, "errorCode");

	        		if ("122".equals(errorCode)) {
	        		    oimResponseLog = oIMAsyncHibernationService.callAsyncOIAMHibernation(
	        		            req.getRequest(), employeeLog, req.getTransMode(), true);

	        		    responseXml = oimResponseLog.getResponse();
	        		    doc = parseXml(responseXml); // ✅ re-assign
	        		}

	        		errorCode = getTagValue(doc, "errorCode");
	        		if ("114".equals(errorCode) || "128".equals(errorCode)) {
	        		    oimResponseLog = oIMAsyncHibernationService.callAsyncOIAMHibernation(
	        		            req.getRequest(), employeeLog, req.getTransMode(), false);

	        		    responseXml = oimResponseLog.getResponse();
	        		    doc = parseXml(responseXml); 
	        		}

	        		String requestId = getTagValue(doc, "requestID");
	        		String finalStatus;

	        		if ("0".equals(errorCode) && !isBlank(requestId)) {
	        		    finalStatus = CwmsConstants.sysStatusS;

	        		    LogWrapper.info(getClass(),
	        		            "OIM API SUCCESS | EmpId: " + req.getEmpId()
	        		                    + " | RequestId: " + requestId);

	        		} else {
	        		    finalStatus = CwmsConstants.sysStatusF;
	        		    LogWrapper.info(getClass(),
	        		            "OIM API FAILED | EmpId: " + req.getEmpId()
	        		                    + " | errorCode: " + errorCode
	        		                    + " | response: " + responseXml);
	        		}
	        		 req.setResponse(responseXml);
	 	            req.setResponseTime(LocalDateTime.now());
	 	            employeeLog.setResponse(responseXml);
	 	            employeeLog.setResponseTime(LocalDateTime.now());
	 	            Response resp = new Response();
	 	            resp.setWorkerCode(req.getEmpId());
	 	            resp.setActivity("onboarding");
	 	            System sys = new System();
	 	            sys.setSystemName("OIM");
	 	            sys.setSystemStatus(finalStatus);
	 	            sys.setRefNo(doc.getElementsByTagName("requestID").item(0) == null
	 						? doc.getElementsByTagName("errorMsg").item(0).getTextContent()
	 						: doc.getElementsByTagName("requestID").item(0).getTextContent());
	 	            List<System> system = new ArrayList<>();
	 	            system.add(sys);
	 	            resp.setSystem(system);
	 	            LogWrapper.info(getClass(), "Response need to call BP API : "+ resp);
	 	            BPResponse bpResponse = bpService.updateSystemResponseToBP(resp, req.getTransId());
	 	            LogWrapper.info(getClass(), bpResponse.toString());

	 	            req.setStatus(finalStatus);
	 	            employeeLog.setStatus(finalStatus);

	        } catch (Exception ex) {
	            LogWrapper.error(getClass(), "Exception occured for EMP ID: " + req.getEmpId() + ", Error: " + ex.getMessage());
	            req.setStatus(CwmsConstants.sysStatusF);
	            req.setResponse(ex.getMessage());
	            req.setResponseTime(LocalDateTime.now());
	        }

	        // Retry increment only for ONCE scheduler
	        if ("ONCE".equalsIgnoreCase(schedulerType)) {
	            req.setRetry((long) (currentRetry + 1));
	        }

	        // Save updates
	        acessRequestLogAsyncRepo.save(req);
	        LogWrapper.info(getClass(), "updated the field for the access request log for emp Id : " + req.getEmpId()+ "data be updated : "+ req);
	        employeeLogRepo.saveAndFlush(employeeLog);
	        LogWrapper.info(getClass(), "Saving the data into employeelog for emp Id : " + req.getEmpId()+ "data to be saved : "+ employeeLog);
	    }

	    LogWrapper.info(getClass(), "Completed processing  for OIM batch of " + recordSize + " records." + "| Mode : "+ transMode);
	}
	private boolean isBlank(String s) {
       return s == null || s.trim().isEmpty();
   }
	private Document parseXml(String xml) throws Exception {
        DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        InputSource src = new InputSource(new StringReader(xml));
        return builder.parse(src);
    }

    private String getTagValue(Document doc, String tag) {
        return doc.getElementsByTagName(tag).item(0) != null
                ? doc.getElementsByTagName(tag).item(0).getTextContent()
                : "";
    }

}
