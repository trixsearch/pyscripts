package com.jio.cwms.onboard.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jio.cwms.onboard.service.AuthQmsService;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping("/v1.0")
public class QmsController {
	
	@Autowired
	private AuthQmsService authQmsService;
	
	@GetMapping("/qms/user/info")
	public ResponseEntity<Object> authQMS(@RequestHeader HttpHeaders headers){
		
		LogWrapper.info(getClass(), "QMS user info request received");
		return authQmsService.qmsApiCall(headers);
		
	}
}
