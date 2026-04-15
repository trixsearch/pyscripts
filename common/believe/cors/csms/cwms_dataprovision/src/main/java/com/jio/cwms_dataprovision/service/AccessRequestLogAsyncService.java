package com.jio.cwms_dataprovision.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.entity.AccessRequestLogEntity;
import com.jio.cwms_dataprovision.repository.AcessRequestLogAsyncRepository;

import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
public class AccessRequestLogAsyncService {
	
	@Autowired
	private AcessRequestLogAsyncRepository acessRequestLogAsyncRepository;

	public boolean isRequestLogged(GeneralRequest request, String requestBody, String systemName) {

	    String empId = request.getResource_Details().getWorkerCode();
	    String orgId = request.getResource_Details().getOrganization();
	    String siteId = request.getResource_Details().getSiteID();
	    String transId = request.getClientTxnId();
	    String transMode = request.getResource_Details().getTransMode();

	    log.info(
	            "[ACCESS-LOG] Processing request logging | SystemName={} | OrgId={} | SiteId={} | EmpId={} | TransMode={} | TxnId={}",
	            systemName, orgId, siteId, empId, transMode, transId
	    );

	    try {
	        // ✅ CHECK: Existing record
	        Optional<AccessRequestLogEntity> existingLogOpt =
	                acessRequestLogAsyncRepository
	                        .findTopBySystemNameAndEmpIdAndTransModeAndTransIdStartingWithOrderByRequestTimeDesc(
	                                systemName, empId, transMode, transId
	                        );

	        AccessRequestLogEntity logRequest;

	        if (existingLogOpt.isPresent()) {
	            // 🔁 UPDATE EXISTING
	            logRequest = existingLogOpt.get();

	            log.info(
	                    "[ACCESS-LOG][DB] Existing record found | Id={} | EmpId={} | TxnId={}",
	                    logRequest.getId(), empId, transId
	            );
	        } else {
	            // ➕ CREATE NEW
	            logRequest = new AccessRequestLogEntity();

	            log.info(
	                    "[ACCESS-LOG][DB] No existing record found. Creating new entry | EmpId={} | TxnId={}",
	                    empId, transId
	            );

	            logRequest.setSystemName(systemName);
	            logRequest.setEmpId(empId);
	            logRequest.setSiteID(siteId);
	            logRequest.setOrgId(orgId);
	            logRequest.setTransId(transId);
	            logRequest.setTransMode(transMode);
	            logRequest.setApprovalStatus(request.getResource_Details().getApproval_Status());
	            logRequest.setRetry(0L);
	            logRequest.setKafkaStatus(0);
	        }

	        // ✅ Common fields (always update)
	        logRequest.setRequest(requestBody);
	        logRequest.setRequestTime(LocalDateTime.now());
	        logRequest.setStatus("PENDING");

	        acessRequestLogAsyncRepository.save(logRequest);

	        log.info(
	                "[ACCESS-LOG][DB-SUCCESS] Request logged successfully | SystemName={} | EmpId={} | OrgId={} | TxnId={} | Status=PENDING",
	                systemName, empId, orgId, transId
	        );

	        return true;

	    } catch (Exception e) {

	        log.error(
	                "[ACCESS-LOG][DB-ERROR] Failed to log request | SystemName={} | EmpId={} | OrgId={} | TxnId={} | Error={}",
	                systemName, empId, orgId, transId, e.getMessage(), e
	        );

	        return false;
	    }
	}

}
