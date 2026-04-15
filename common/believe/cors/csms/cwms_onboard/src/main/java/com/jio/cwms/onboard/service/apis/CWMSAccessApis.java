package com.jio.cwms.onboard.service.apis;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.dto.request.MessageAccessRequest;
import com.jio.cwms.onboard.dto.response.AccessResponse;
import com.jio.cwms.onboard.repository.inmem.InMemoryUpstreamApplicationDetails;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class CWMSAccessApis extends InMemoryUpstreamApplicationDetails {


	@Autowired
	private RestTemplate restTemplate;

	protected AccessResponse callAccessAPI(final String clientTxnId, final MessageAccessRequest requestBody) {
		
		LogWrapper.info(CWMSAccessApis.class, "Calling CWMS access API | Client Txn ID:: " + clientTxnId + 
				" | API URL:: " +  ApplicationConfig.getUpstreamMasterAccess().getPublisherURL() +
				" | Request Body:: " +requestBody);
		
		//CWMSAccessApis.log.info("Calling CWMS access API | Client Txn ID: {} | API URL: {} | Request Body: {}", clientTxnId,ApplicationConfig.getUpstreamMasterAccess().getPublisherURL(), requestBody);

		final var headers = new HttpHeaders();
		headers.add("Content-Type", "application/json");
		headers.add("clientTxnId", clientTxnId);
		
		
		
		var response = new AccessResponse();
		try {
			
			ResponseEntity<AccessResponse> responseEntity = restTemplate.postForEntity(ApplicationConfig.getUpstreamMasterAccess().getPublisherURL(), new HttpEntity<String>(requestBody.getMessage(),headers),
					AccessResponse.class);
			
			if (responseEntity.getBody() == null) {
				return new AccessResponse();
			}
			response = responseEntity.getBody();
		} catch (final Exception e) {

			LogWrapper.error(CWMSAccessApis.class, 
					"Exception occurred while calling cwms access API | Exception:: " + e.getClass().getCanonicalName()+
					" | Message:: " +e.getClass().getCanonicalName()+
					"| Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			
//			CWMSAccessApis.log.error("Exception occurred while calling cwms access API | Exception: {} | Message: {} | Cause: {}",
//					e.getClass().getCanonicalName(),
//					ExceptionUtils.getMessage(e),
//					ExceptionUtils.getRootCauseMessage(e)
//					);
			return new AccessResponse();
		}
		
		LogWrapper.info(CWMSAccessApis.class,"Call to cwms access completed | Client Txn ID:: " + clientTxnId + 
				" | Response:: " + response);
		//CWMSAccessApis.log.info("Call to cwms access completed | Client Txn ID: {} | Response: {}", clientTxnId, response);
		return response;
	}

}
