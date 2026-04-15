package com.jio.cwms.onboard.exception;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.ResponseErrorHandler;

import com.jio.cwms.onboard.wrapper.LogWrapper;

public class RestExceptionHandler implements ResponseErrorHandler {
 
    @Override
    public void handleError(ClientHttpResponse response) throws IOException {
        LogWrapper.error(getClass(), response.toString());
        LogWrapper.error(RestExceptionHandler.class, "Error occured " + response.getStatusCode() + " " + response.getStatusText());
    }
 
    @Override
    public boolean hasError(ClientHttpResponse response) throws IOException {
        HttpStatus.Series series = ((HttpStatus) response.getStatusCode()).series();
        return HttpStatus.Series.CLIENT_ERROR.equals(series) || HttpStatus.Series.SERVER_ERROR.equals(series);
    }
 
}
