package com.jio.cwms.onboard.service.apis;

import java.net.URI;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.dto.request.MessagePublisherRequest;
import com.jio.cwms.onboard.dto.response.MessagePublisherResponse;
import com.jio.cwms.onboard.repository.inmem.InMemoryUpstreamApplicationDetails;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class CWMSPublisherApis extends InMemoryUpstreamApplicationDetails {

	@Autowired
	private RestTemplate restTemplate;

	public MessagePublisherResponse callPublishAPI(final String clientTxnId, final HttpHeaders headers, final MessagePublisherRequest requestBody) {

		LogWrapper.info(CWMSPublisherApis.class, "Calling CWMS publisher API | Client Txn ID:: " + clientTxnId + 
				" | API URL:: " + ApplicationConfig.getUpstreamMaster().getPublisherURL()+
				" | Request Body:: " +requestBody);
		
//		CWMSPublisherApis.log.info("Calling CWMS publisher API | Client Txn ID: {} | API URL: {} | Request Body: {}",
//				clientTxnId,
//				ApplicationConfig.getUpstreamMaster().getPublisherURL(),
//				requestBody
//				);

		var response = new MessagePublisherResponse();
		try {
			final ResponseEntity<MessagePublisherResponse> responseEntity = restTemplate.exchange(
//					"http://10.173.173.12:31005/cwms-publisher/v1.0/publish",
				  URI.create(ApplicationConfig.getUpstreamMaster().getPublisherURL()),
					// "http://10.173.173.13:31005/cwms-publisher/v1.0/publish",
					HttpMethod.POST,
					new HttpEntity<MessagePublisherRequest>(requestBody, headers),
					MessagePublisherResponse.class
					);
			if (responseEntity.getBody() == null) {
				return new MessagePublisherResponse();
			}
			response = responseEntity.getBody();
		} catch (final Exception e) {

//			CWMSPublisherApis.log.error("Exception occurred while calling cwms publisher API | Exception: {} | Message: {} | Cause: {}",
//					e.getClass().getCanonicalName(),
//					ExceptionUtils.getMessage(e),
//					ExceptionUtils.getRootCauseMessage(e)
//					);
			
			LogWrapper.error(CWMSPublisherApis.class, 
					"Exception occurred while calling cwms publisher API | Exception:: " + e.getClass().getCanonicalName()+
					" | Message:: " +e.getClass().getCanonicalName()+
					"| Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			return new MessagePublisherResponse();
		}
		
		LogWrapper.info(CWMSPublisherApis.class,"Call to cwms access completed | Client Txn ID:: " + clientTxnId + 
				" | Response:: " + response);
		//CWMSPublisherApis.log.info("Call to cwms publisher completed | Client Txn ID: {} | Response: {}", clientTxnId, response);
		return response;
	}

}
