package com.jio.cwms_dataprovision.Scheduler;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class MhereSchedulerService {

	@Autowired
	MhereHibernationService mhereHibernationService;
	
	@Autowired
	ObjectMapper objectMapper;
	
	@Autowired
	SchedulerConfigRepository schedulerConfigRepo;
	
	@Autowired
	AcessRequestLogAsyncRepository acessRequestLogAsyncRepo;
	
	@Autowired
	EmployeeLogRepository employeeLogRepo;
	
	@Autowired
	BetterPlaceService bpService;

	public void mhereAsyncSchedulerService(SchedulerConfigRequest configRequest, String transMode) {
		 LogWrapper.info(getClass(),
	                "Mhere Scheduler Triggered | TransMode: " + transMode +
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

//	    boolean isRestAll = configRequest.getCronSite().contains("ALL");
//
//	    if (isRestAll) {
//	        Optional<SchedularConfig> configOpt = schedulerConfigRepo
//	                .findBySystemNameAndTransModeAndSchedulerTypeAndOrgId("GENETEC", transMode, "Hourly", "O2C");
//
//	        if (configOpt.isPresent()) {
//	            sites = Arrays.asList(configOpt.get().getCronSite().split(","));
//	            useInclude = 0;
//	        }
//	    }

	    // --------------------------------------------
	    // STEP 1: Calculate next execution time
	    // --------------------------------------------
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

	    // --------------------------------------------
	    // STEP 2: Fetch Pending Records based on scheduler type
	    // --------------------------------------------
	    LogWrapper.info(getClass(), "Fetching Pending Records | SchedulerType: " + schedulerType);
	    switch  (schedulerType == null ? "" : schedulerType.toUpperCase())  {

	        case "HOURLY":
	        	LogWrapper.info(getClass(), "Scheduler Type: " + schedulerType);
	        	pageList = acessRequestLogAsyncRepo.findPendingFirstHitsInLastHour("MHERE",
	                    transMode,
	                    conditionCheck,
	                    sites,
	                    useInclude,
	                    batchSizeInt);
	        	break;
//	        case "HOURLY_REST_ALL":
//	            LogWrapper.info(getClass(), "Scheduler Type: " + schedulerType);
//	            pageList = genetecRequestRepo.findPendingFirstHitsInLastHour(
//	                    "MHERE",
//	                    transMode,
//	                    conditionCheck,
//	                    sites,
//	                    useInclude,
//	                    batchSizeInt);
//	            break;

	        case "ONCE":
	            LogWrapper.info(getClass(), "Scheduler Type: ONCE");
	            pageList = acessRequestLogAsyncRepo.findAllFirstHitsWithoutSuccess(
	                    "MHERE",
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
	    	LogWrapper.info(getClass(), "No pending MHERE requests found. Scheduler exiting.");
	        return;
	    }

	    LogWrapper.info(getClass(), "Starting MHERE " + transMode + " Batch Processing");

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

	        if (!isValidJson(req.getRequest())) {
                LogWrapper.error(getClass(), "Invalid JSON in AccessRequestLog request body. Marking as FAILED. Emp: " + req.getEmpId());
                req.setStatus(CwmsConstants.sysStatusF);
                req.setResponse("Invalid request JSON");
                req.setResponseTime(LocalDateTime.now());
                acessRequestLogAsyncRepo.save(req);
                continue;
            }

	        EmployeeLog employeeLog = new EmployeeLog();
	        employeeLog.setSystemName(ServiceDataEnum.MHERE.name());
	        employeeLog.setEmpId(req.getEmpId());
	        employeeLog.setTransId(req.getTransId());
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
	            // Calling CUA API
	            // --------------------------------------------
	            LogWrapper.info(getClass(), "Processing CUA API with EMP ID: " + req.getEmpId());

	            AddProfile addProfileObj = objectMapper.readValue(req.getRequest(), AddProfile.class);

	            MHereOnboardResponse response = mhereHibernationService.insertProfile(addProfileObj, req);

	            
	            if(response == null) {
	            	LogWrapper.warn(getClass(), "CUA returned empty response for Emp: " + req.getEmpId());
	            	req.setResponse("");
	            	req.setResponseTime(LocalDateTime.now());
	            	req.setStatus(CwmsConstants.sysStatusF);
	            	acessRequestLogAsyncRepo.save(req);
	            	return;
	            	
	            }
	            String responseJson = objectMapper.writeValueAsString(response);
	            req.setResponse(responseJson);
	            req.setResponseTime(LocalDateTime.now());
	            employeeLog.setResponse(responseJson);
	            employeeLog.setResponseTime(LocalDateTime.now());

	            // --------------------------------------------
	            // Status handling
	            // --------------------------------------------
	            String finalStatus = CwmsConstants.sysStatusF;

	            if ("SUCCESS".equalsIgnoreCase(response.getStatus())) {
	            	LogWrapper.info(getClass(),
                            "MHERE Api Success | EmpCode: " + req.getEmpId()+" || response : "+ responseJson);
	                finalStatus = CwmsConstants.sysStatusS;
	            }
	            else if ("FAILED".equalsIgnoreCase(response.getStatus())) {
	            	LogWrapper.info(getClass(),
                            "MHERE Api Failed | EmpCode: " + req.getEmpId()+" || response : "+ responseJson);
	                finalStatus = CwmsConstants.sysStatusF;
	            }
	            Response resp = new Response();
	            resp.setWorkerCode(req.getEmpId());
	            resp.setActivity("onboarding");
	            System sys = new System();
	            sys.setSystemName("MHERE");
	            sys.setSystemStatus(finalStatus);
	            sys.setSystemMsg(response.getMessage());
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

	    LogWrapper.info(getClass(), "Completed processing  for MHERE batch of " + recordSize + " records." + "| Mode : "+ transMode);
	}

	private boolean isValidJson(String json) {
        if (isBlank(json)) return false;
        try {
            JsonNode node = objectMapper.readTree(json);
            return node != null;
        } catch (Exception e) {
            return false;
        }
    }
	
	private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

}
