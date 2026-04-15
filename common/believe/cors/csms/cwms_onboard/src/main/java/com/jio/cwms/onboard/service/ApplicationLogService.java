package com.jio.cwms.onboard.service;

import java.text.SimpleDateFormat;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jio.cwms.onboard.constants.ApiConstant;
import com.jio.cwms.onboard.model.ApplicationLogMaster;
import com.jio.cwms.onboard.repository.ApplicationLogRepository;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class ApplicationLogService {

	@Autowired
	private ApplicationLogRepository repository;

	public ApplicationLogMaster save(final ApplicationLogMaster applicationLogMaster) {
		return repository.save(applicationLogMaster);
	}

	public static ApplicationLogMaster generateLog(final String module, final String action, final String requestId, final String status, final String methodName, final String stage, final String workerCode) {
		//ApplicationLogService.log.info("Generating application log master");
		LogWrapper.info(ApplicationLogService.class, "Generating application log master");
		
		final var dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		if ("received".equals(action)) {
			return ApplicationLogMaster.builder().module(module)
					.transactionId(requestId)
					.remarks(ApiConstant.received + methodName)
					.status(status)
					.createdBy("System")
					.createdOn(dateFormat.format(new Date()))
					.stage(stage)
					.workerCode(workerCode)
					.build();
		}
		return ApplicationLogMaster.builder().module(module)
				.transactionId(requestId)
				.remarks(ApiConstant.sent + methodName)
				.status(status)
				.createdBy("System")
				.createdOn(dateFormat.format(new Date()))
				.stage(stage)
				.workerCode(workerCode)
				.build();

	}

}
