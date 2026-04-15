package com.jio.cwms_dataprovision.service;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.System;

@Service
public interface GeneralService {
	
	public System executeService(GeneralRequest request) throws JsonProcessingException, Exception;

}
