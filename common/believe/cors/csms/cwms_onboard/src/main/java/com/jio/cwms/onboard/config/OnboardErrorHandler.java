package com.jio.cwms.onboard.config;

import java.io.IOException;

import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResponseErrorHandler;

import com.jio.cwms.onboard.wrapper.LogWrapper;

@Component
public class OnboardErrorHandler implements ResponseErrorHandler {

	@Override
	public boolean hasError(ClientHttpResponse response) throws IOException {
		
		return (
				response.getStatusCode().is4xxClientError()
		          || response.getStatusCode().is5xxServerError());
	}

	@Override
	public void handleError(ClientHttpResponse response) throws IOException {
		LogWrapper.error(getClass(), response.getStatusCode() + " " + response.getStatusText());
		
	}

}
