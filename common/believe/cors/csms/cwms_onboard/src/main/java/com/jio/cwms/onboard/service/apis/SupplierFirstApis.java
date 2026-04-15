package com.jio.cwms.onboard.service.apis;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.dto.request.SupplierFirstRequest;
import com.jio.cwms.onboard.dto.response.CreateClaimFailedResponse;
import com.jio.cwms.onboard.dto.response.CreateClaimResponse;
import com.jio.cwms.onboard.exception.InternalServerErrorException;
import com.jio.cwms.onboard.exception.ServiceFailedException;
import com.jio.cwms.onboard.exception.UnauthorizedException;
import com.jio.cwms.onboard.wrapper.LogWrapper;



@Service
public class SupplierFirstApis {

	@Autowired
	private ApplicationConfig config;

	@Autowired
	private RestTemplate restTemplate;

	public CreateClaimResponse callCreateClaimApi(SupplierFirstRequest requestBody, HttpHeaders headers)
			throws JsonMappingException, JsonProcessingException {

		LogWrapper.info(SupplierFirstApis.class, "Calling supplier first create claim api  | API URL:: "
				+ ApplicationConfig.getSupplierFirstCreate().getPublisherURL() );

		CreateClaimResponse response = new CreateClaimResponse();
		ObjectMapper objectMapper = new ObjectMapper();
		HttpEntity<SupplierFirstRequest> entity = new HttpEntity<SupplierFirstRequest>(requestBody, headers);

		try {

			ResponseEntity<CreateClaimResponse> responseEntity = restTemplate.postForEntity(
					ApplicationConfig.getSupplierFirstCreate().getPublisherURL(), entity, CreateClaimResponse.class);

			response = responseEntity.getBody();
		} catch (HttpClientErrorException e) {
			CreateClaimFailedResponse response1 = objectMapper.readValue(e.getResponseBodyAsString(),
					CreateClaimFailedResponse.class);
			LogWrapper.info(SupplierFirstApis.class,
					"Call to supplier first create claim api completed  || Response :: " + response);
			if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
				throw new ServiceFailedException("111111", response1.getErrors(), null);

			}else if(e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
				throw new UnauthorizedException("111111", response1.getErrors(), null);
			}
			else if(e.getStatusCode() == HttpStatus.INTERNAL_SERVER_ERROR) {
				throw new InternalServerErrorException("111111", response1.getErrors(), null);
			}
		} catch (Exception e) {

			LogWrapper.error(SupplierFirstApis.class,
					"Exception occurred while calling supplierFirst Create claim  api | Exception:: "
							+ e.getClass().getCanonicalName() + " | Message:: " + e.getClass().getCanonicalName()
							+ "| Cause:: " + ExceptionUtils.getRootCauseMessage(e));

			throw new ServiceFailedException("111111", e.getMessage(), null);
		}

		LogWrapper.info(SupplierFirstApis.class,
				"Call to supplier first create claim api completed" );

		return response;
	}

}
