package com.jio.cwms_dataprovision.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms_dataprovision.constants.AppConstant;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.mHere.AddProfile;
import com.jio.cwms_dataprovision.dto.mHere.MHereOnboardResponse;
import com.jio.cwms_dataprovision.entity.AccessRequestLogEntity;
import com.jio.cwms_dataprovision.repository.AcessRequestLogAsyncRepository;

@Service
public class MhereAsyncHibernationService {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AcessRequestLogAsyncRepository acessRequestLogAsyncRepository;

    private final Logger logger = LogManager.getLogger(this.getClass());

    public MHereOnboardResponse dbLogAccessAsyncRequest(GeneralRequest request) {
    	logger.info("Starting MHere Hibernation Async Logging process for empCode : {}", request.getResource_Details().getWorkerCode());
        AccessRequestLogEntity accessLog = new AccessRequestLogEntity();
        MHereOnboardResponse response = new MHereOnboardResponse();
        try {
        	 logger.info("Preparing AccessRequestLogEntity for empCode={}, site={}, org={}",
                     request.getResource_Details().getWorkerCode(),
                     request.getResource_Details().getSiteID(),
                     request.getResource_Details().getOrganization()
             );
        	 
        	 Optional<AccessRequestLogEntity> existingLogOpt =
                     acessRequestLogAsyncRepository
                             .findTopBySystemNameAndEmpIdAndTransModeAndTransIdStartingWithOrderByRequestTimeDesc(
                            		 ServiceDataEnum.MHERE.name(),
                            		 request.getResource_Details().getWorkerCode(),
                            		 request.getResource_Details().getTransMode(),
                            		 request.getClientTxnId()
                             );
        	 
        	 if (existingLogOpt.isPresent()) {
                 accessLog = existingLogOpt.get();
                 logger.info(
                         "[MHERE-ASYNC] Existing pending record found | Id={} | RequestTime={}",
                         accessLog.getId(), accessLog.getRequestTime()
                 );
             } else {
                 accessLog = new AccessRequestLogEntity();
                 logger.info(
                         "[MHERE-ASYNC] No pending record found. Creating new entry | EmpCode={}",
                         request.getResource_Details().getWorkerCode()
                 );
             }
        	 
            accessLog.setEmpId(request.getResource_Details().getWorkerCode());
            accessLog.setOrgId(request.getResource_Details().getOrganization());
            accessLog.setSiteID(request.getResource_Details().getSiteID());
            accessLog.setApprovalStatus(request.getResource_Details().getApproval_Status());
            accessLog.setSystemName(ServiceDataEnum.MHERE.name());
            accessLog.setStatus(AppConstant.sysStatusP);
            accessLog.setTransId(request.getClientTxnId());
            accessLog.setTransMode(request.getResource_Details().getTransMode());
            accessLog.setRetry(
                    accessLog.getRetry() == null ? 0L : accessLog.getRetry()
            );
            accessLog.setKafkaStatus(0);
            accessLog.setRequestTime(LocalDateTime.now());

            AddProfile mHereOnboardRequest = new AddProfile();
            mHereOnboardRequest.fromGeneralRequest(request);

            String jsonRequest = objectMapper.writeValueAsString(mHereOnboardRequest);
            accessLog.setRequest(jsonRequest);
            logger.info("Saving AccessRequestLogEntity in async log table...");
            acessRequestLogAsyncRepository.save(accessLog);
            logger.info("Successfully inserted Hibernation data for empCode={}, txnId={}",
                    accessLog.getEmpId(), accessLog.getTransId());
            response.setStatus("200");
            response.setMessage("Data inserted for Hibernation");
            response.setTimestamp(LocalDateTime.now().toString());

        } catch (Exception e) {

            logger.error(
                "Exception while saving mHere async hibernation request | Exception: {} | Message: {} | Cause: {}",
                e.getClass().getCanonicalName(),
                ExceptionUtils.getMessage(e),
                ExceptionUtils.getRootCauseMessage(e)
            );

            accessLog.setStatus(AppConstant.sysStatusF);
            accessLog.setRequest(e.getMessage());
            acessRequestLogAsyncRepository.save(accessLog);
            logger.warn("Saving failure log entry for empCode={}, txnId={}", 
                    accessLog.getEmpId(), accessLog.getTransId());
            response.setStatus("500");
            response.setMessage("Failed to insert data for Hibernation");
            response.setTimestamp(LocalDateTime.now().toString());
        }
        logger.info("Completed MHere Hibernation Async Logging process.");
        return response;
    }
}
