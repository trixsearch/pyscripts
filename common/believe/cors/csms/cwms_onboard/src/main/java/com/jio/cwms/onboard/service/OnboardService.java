package com.jio.cwms.onboard.service;

import org.springframework.http.HttpHeaders;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.jio.cwms.onboard.dto.request.OnboardRequest;
import com.jio.cwms.onboard.dto.response.OnboardResponse;
import com.jio.cwms.onboard.model.OnboardLogging;

public interface OnboardService {

	OnboardResponse onboardAsEmployee(String clientTxnId, HttpHeaders headers, OnboardRequest onboardRequest, OnboardLogging onboardLog) throws JsonProcessingException;
}
