package com.jio.cwms.onboard.exception;

public class RequestBodyException extends BaseException {

	public RequestBodyException(String clientTxnId, int status, String success, String errors, Object resource) {
		super(clientTxnId, status, success, errors, resource);
		
	}

}
