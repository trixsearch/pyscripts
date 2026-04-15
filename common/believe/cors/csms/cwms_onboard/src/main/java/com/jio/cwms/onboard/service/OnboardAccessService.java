package com.jio.cwms.onboard.service;

import org.springframework.http.HttpHeaders;

import com.jio.cwms.onboard.dto.request.OnboardRequest;
import com.jio.cwms.onboard.dto.response.OnboardResponse;

public interface OnboardAccessService {

	OnboardResponse onboardAsEmployee(String clientTxnId, OnboardRequest onboardRequest, HttpHeaders headers) throws NoSuchFieldException, SecurityException;

}
