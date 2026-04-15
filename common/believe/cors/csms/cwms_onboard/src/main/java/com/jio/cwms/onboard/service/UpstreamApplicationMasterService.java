package com.jio.cwms.onboard.service;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jio.cwms.onboard.model.UpstreamApplicationMaster;
import com.jio.cwms.onboard.repository.UpstreamApplicationMasterRepository;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;


@Service
public class UpstreamApplicationMasterService {

	@Autowired
	private UpstreamApplicationMasterRepository repository;

	protected List<UpstreamApplicationMaster> findAll() {
		try {
			final var result = repository.findAll();
			if (!result.isEmpty()) {
				//UpstreamApplicationMasterService.log.info("Successfully fetched all upstream application from database");
				LogWrapper.info(UpstreamApplicationMasterService.class, "Successfully fetched all upstream application from database");
				
				return result;
			}
		} catch (final Exception e) {

//			UpstreamApplicationMasterService.log.error("Exception occurred while fetching upstream application data from database | Exception: {} | Message: {} | Cause: {}",
//					e.getClass().getCanonicalName(),
//					ExceptionUtils.getMessage(e),
//					ExceptionUtils.getRootCauseMessage(e)
//					);
			
			LogWrapper.error(UpstreamApplicationMasterService.class, "Exception occurred while fetching upstream application data from database | Exception:: " + e.getClass().getCanonicalName() +
				    " | Message:: " + ExceptionUtils.getMessage(e) + 
			        " | Cause: {}" + ExceptionUtils.getRootCauseMessage(e));

		}
		//UpstreamApplicationMasterService.log.info("Failed to fetch all upstream application from database");
		LogWrapper.info(UpstreamApplicationMasterService.class, "Failed to fetch all upstream application from database");
		
		return new ArrayList<>();
	}

}
