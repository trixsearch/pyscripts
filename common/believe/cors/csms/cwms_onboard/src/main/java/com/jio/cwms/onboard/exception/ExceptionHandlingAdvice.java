package com.jio.cwms.onboard.exception;

import org.apache.commons.lang3.BooleanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.jio.cwms.onboard.constants.ErrorConstants;
import com.jio.cwms.onboard.dto.response.OnboardResponse;


@RestControllerAdvice
public class  ExceptionHandlingAdvice {



    
    @ExceptionHandler(ServiceFailedException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	@ResponseBody
	public OnboardResponse handleServiceFailedException(ServiceFailedException exception) {
    	String clientTxnId =exception.getClientTxnId();
    	String success=exception.getSuccess();
		String message = exception.getErrors();
		int status = exception.getStatus();		
		OnboardResponse response = new OnboardResponse(clientTxnId, success ,status, message, exception.getResource());
		return response;
	}
    
    @ExceptionHandler(BaseException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ResponseBody
    public OnboardResponse handleBaseException(BaseException exception) {
    	
    	String message = exception.getErrors();
    	  if (message == null || message.isEmpty()) {
              message = ErrorConstants.ERR_CD_02.getValue();
          }		
		OnboardResponse response = new OnboardResponse("", BooleanUtils.FALSE ,0, message, null);
		return response;
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseBody
    public ResponseEntity<OnboardResponse> exception(Exception exception) {
    	   String message = exception.getMessage();
           if (message == null || message.isEmpty()) {
               message = ErrorConstants.ERR_CD_01.getValue();
           }	
		OnboardResponse response = new OnboardResponse("", BooleanUtils.FALSE ,0, message, null);
		return new ResponseEntity<OnboardResponse>(response, HttpStatusCode.valueOf(400));
    }
    

    @ExceptionHandler(RequestBodyException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public OnboardResponse badRequestException(RequestBodyException requestBodyException) {
    	   String message = "Invalid Request body or Missing Mandatory Headers";
           if (message == null || message.isEmpty()) {
               message = ErrorConstants.ERR_CD_01.getValue();
           }		
		OnboardResponse response = new OnboardResponse(requestBodyException.getClientTxnId(), BooleanUtils.FALSE ,requestBodyException.getStatus(), message, null);
		return response;
    }
    
    @ExceptionHandler(DownStreamResponseError.class)
    @ResponseBody
    public ResponseEntity<OnboardResponse> exception(DownStreamResponseError downStreamResponseError ) {
    	   String message = downStreamResponseError.getErrors();
           if (message == null || message.isEmpty()) {
               message = ErrorConstants.ERR_CD_01.getValue();
           }

         //  DownStreamResponseError response1 = new DownStreamResponseError(downStreamResponseError.getStatusCode(),downStreamResponseError.getStatus(), downStreamResponseError.getErrors(), null);
       OnboardResponse response = new OnboardResponse(downStreamResponseError.getClientTxnId(), BooleanUtils.FALSE ,downStreamResponseError.getStatus(), downStreamResponseError.getErrors(), null);
		return new ResponseEntity<OnboardResponse>(response, HttpStatusCode.valueOf(downStreamResponseError.getStatusCode()));
    }
    
    
    @ExceptionHandler(UnauthorizedException.class)
   	@ResponseStatus(HttpStatus.UNAUTHORIZED)
   	@ResponseBody
   	public OnboardResponse handleUnauthorizedException(UnauthorizedException exception) {
       	String clientTxnId =exception.getClientTxnId();
       	String success=exception.getSuccess();
   		String message = exception.getErrors();
   		int status = exception.getStatus();		
   		OnboardResponse response = new OnboardResponse(clientTxnId, success ,status, message, exception.getResource());
   		return response;
   	}
    
    @ExceptionHandler(InternalServerErrorException.class)
   	@ResponseStatus(HttpStatus.BAD_REQUEST)
   	@ResponseBody
   	public OnboardResponse handleInternalServerErrorExceptionException(InternalServerErrorException exception) {
       	String clientTxnId =exception.getClientTxnId();
       	String success=exception.getSuccess();
   		String message = exception.getErrors();
   		int status = exception.getStatus();		
   		OnboardResponse response = new OnboardResponse(clientTxnId, success ,status, message, exception.getResource());
   		return response;
   	}

    
}

