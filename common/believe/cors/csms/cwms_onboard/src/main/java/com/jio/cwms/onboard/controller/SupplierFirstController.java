package com.jio.cwms.onboard.controller;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.jio.cwms.onboard.dto.request.SupplierFirstRequest;
import com.jio.cwms.onboard.dto.response.OnboardResponse;
import com.jio.cwms.onboard.exception.ServiceFailedException;
import com.jio.cwms.onboard.service.SupplierFirstPortalService;
import com.jio.cwms.onboard.utils.HttpRequestUtils;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping("/v1.0")
public class SupplierFirstController {
	@Autowired
	private SupplierFirstPortalService supplier;

	@PostMapping("/createclaim/supplierfirst")
	public ResponseEntity<OnboardResponse> createClaim(@RequestBody SupplierFirstRequest request,
			@RequestHeader HttpHeaders headers, HttpServletRequest re) throws JsonMappingException, JsonProcessingException {

		String clientIp =  HttpRequestUtils.getRemoteIPAddress(re);
		SupplierFirstController.log.info("Received request to generate claim | clientIP: {} ",clientIp);
		headers.set("X-Forwarded-For-CWMS", clientIp);
		
		
		if (StringUtils.isBlank(headers.getFirst("clientId")) || StringUtils.isBlank(headers.getFirst("Authorization"))) {
		    throw new ServiceFailedException("111111", "Missing or invalid header", null);
		}
		
	
		OnboardResponse responseBody = supplier.CreateClaimService(request, headers);
		return ResponseEntity.ok().body(responseBody);

	}

}
