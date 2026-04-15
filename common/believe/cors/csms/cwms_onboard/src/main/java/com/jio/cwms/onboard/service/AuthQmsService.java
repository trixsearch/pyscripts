package com.jio.cwms.onboard.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.dto.response.OnboardResponse;
import com.jio.cwms.onboard.dto.response.QmsErrorResponse;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;
@Service
@Log4j2
public class AuthQmsService {

	
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper;
	
	public AuthQmsService(ObjectMapper objectMapper, RestTemplate restTemplate) {
		this.objectMapper=objectMapper;
		this.restTemplate=restTemplate;
	}
	
	public ResponseEntity<Object> qmsApiCall(HttpHeaders headers){	
		
		LogWrapper.info(getClass(), "QMSApiCall method started");
		
		String username = headers.containsKey("Username") ? headers.getFirst("Username") : "";
		String password = headers.containsKey("Password") ? headers.getFirst("Password") : "";
		
		boolean isValid = (ApplicationConfig.getQMSfield().getDamUsername().equals(username) && ApplicationConfig.getQMSfield().getDamPassword().equals(password));
		
		if(!isValid) {
			LogWrapper.error(getClass(),"Client Error: Username or Password is incorrect | Not Authorised");
			
            QmsErrorResponse errorResponse = new QmsErrorResponse();
            errorResponse.setErrorCode(401); 
            errorResponse.setErrorMessage("Username or Password is incorrect");
            errorResponse.setErrortype("client_error");
            OnboardResponse response = OnboardResponse.builder()
    				.clientTxnId(headers.getFirst("clientTxnId"))
    				.success("true")
    				.status(1)  
    				.errors("")
    				.resource(errorResponse)
    				.build();
            return new ResponseEntity<>(response,HttpStatusCode.valueOf(401));
		}
		
		headers.remove("Username");
		headers.remove("Password");
		
		HttpEntity<String> entity = new HttpEntity<String>(headers);
		ResponseEntity<String> authQmsApiCall;
		
		try {
			
			JsonNode jsonNode = objectMapper.readTree(ApplicationConfig.getQMSfield().getDamserverIpUrl());
			String url = jsonNode.get("api").asText();
			
			authQmsApiCall = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
			String responseBody = authQmsApiCall.getBody();
			
			LogWrapper.info(getClass(), "QMSApiCall method ended");
			return new ResponseEntity<>(responseBody, HttpStatus.OK);
			
		} catch (HttpClientErrorException e) {

            log.error("Client Error: Status Code: {}, Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            
            QmsErrorResponse errorResponse = new QmsErrorResponse();
            errorResponse.setErrorCode(e.getStatusCode().value()); 
            errorResponse.setErrorMessage("Unauthorized");
            errorResponse.setErrortype("client_error");
            OnboardResponse object = OnboardResponse.builder()
    				.clientTxnId(headers.getFirst("clientTxnId"))
    				.success("true")
    				.status(1)  
    				.errors("")
    				.resource(errorResponse)
    				.build();
            return new ResponseEntity<>(object, e.getStatusCode());
        }
        catch (HttpServerErrorException e) {

            log.error("Server Error: Status Code: {}, Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            
            QmsErrorResponse errorResponse = new QmsErrorResponse();
            errorResponse.setErrorCode(e.getStatusCode().value()); 
            errorResponse.setErrorMessage("Server error occurred. Please try again later.");
            errorResponse.setErrortype("server_error");
            OnboardResponse object = OnboardResponse.builder()
    				.clientTxnId(headers.getFirst("clientTxnId"))
    				.success("true")
    				.status(1)    	
    				.errors("")
    				.resource(errorResponse)
    				.build();
            return new ResponseEntity<>(object, e.getStatusCode());
        }
        catch (ResourceAccessException e) {

            log.error("Connection Error: {}", e.getMessage());
            
            QmsErrorResponse errorResponse = new QmsErrorResponse();
            errorResponse.setErrorCode(503); 
            errorResponse.setErrorMessage("Service unavailable. Unable to connect to the server.");
            errorResponse.setErrortype("connection_error");
            OnboardResponse object = OnboardResponse.builder()
    				.clientTxnId(headers.getFirst("clientTxnId"))
    				.success("true")
    				.status(1)    		
    				.errors("")
    				.resource(errorResponse)
    				.build();
            return new ResponseEntity<>(object, HttpStatus.SERVICE_UNAVAILABLE);         
        }
        catch (JsonProcessingException e) {

            log.error("JSON Processing Error: {}", e.getMessage());

            QmsErrorResponse errorResponse = new QmsErrorResponse();
            errorResponse.setErrorCode(500);
            errorResponse.setErrorMessage("Error processing the JSON response.");
            errorResponse.setErrortype("json_processing_error");
            OnboardResponse object = OnboardResponse.builder()
    				.clientTxnId(headers.getFirst("clientTxnId"))
    				.success("true")
    				.status(1)    		
    				.errors("")
    				.resource(errorResponse)
    				.build();

            return new ResponseEntity<>(object, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        catch (Exception e) {

            log.error("Unexpected Error: {}, Cause: {}", e.getMessage(), e.getCause());
            
            QmsErrorResponse errorResponse = new QmsErrorResponse();
            errorResponse.setErrorCode(500);
            errorResponse.setErrorMessage("An unexpected error occurred. Please try again later.");
            errorResponse.setErrortype("unexpected_error");
            OnboardResponse object = OnboardResponse.builder()
    				.clientTxnId(headers.getFirst("clientTxnId"))
    				.success("true")
    				.status(1)
    				.errors("")
    				.resource(errorResponse)
    				.build();
            return new ResponseEntity<>(object, HttpStatus.INTERNAL_SERVER_ERROR);
         }
	}
}
