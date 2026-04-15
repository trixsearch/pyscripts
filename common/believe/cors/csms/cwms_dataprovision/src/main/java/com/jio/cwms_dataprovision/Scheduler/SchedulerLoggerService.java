package com.jio.cwms_dataprovision.Scheduler;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jio.cwms_dataprovision.entity.ProcedureExecutionLog;
import com.jio.cwms_dataprovision.repository.ProcedureExecutionLogRepository;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;


@Service
public class SchedulerLoggerService {

    @Autowired
    private ProcedureExecutionLogRepository logRepo;

    // Map to keep the initial start time
    private final Map<String, LocalDateTime> startTimeMap = new ConcurrentHashMap<>();

    public void logStart(String procedureName) {
        LocalDateTime now = LocalDateTime.now();
        startTimeMap.put(procedureName, now);

        ProcedureExecutionLog log = new ProcedureExecutionLog();
        log.setLogTimestamp(now);
        log.setProcedureName(procedureName);
        log.setStatus("STARTED");
        logRepo.save(log);
    }

    public void logEnd(String procedureName) {
        LocalDateTime startTime = startTimeMap.get(procedureName);

        ProcedureExecutionLog log = new ProcedureExecutionLog();
        log.setLogTimestamp(startTime); 
        log.setProcedureName(procedureName);
        log.setStatus("COMPLETED");
        log.setResolvedTimestamp(LocalDateTime.now());
        logRepo.save(log);

        startTimeMap.remove(procedureName);
    }

    public void logError(String procedureName, Exception ex) {
    	LocalDateTime startTime = startTimeMap.get(procedureName);

        if (startTime == null) {
        	LogWrapper.warn(getClass(),"Warning: No start time found for procedure: " + procedureName);
            startTime = LocalDateTime.now(); 
        }

        ProcedureExecutionLog log = new ProcedureExecutionLog();
        log.setLogTimestamp(startTime); 
        log.setProcedureName(procedureName);
        log.setStatus("FAILED");
        log.setErrorMessage(ex.getMessage());
        log.setStackTrace(Arrays.toString(ex.getStackTrace()));
        log.setResolvedTimestamp(LocalDateTime.now());
        logRepo.save(log);

        startTimeMap.remove(procedureName);
    }
}