package com.jio.cwms.onboard.exception;

import org.apache.commons.lang3.BooleanUtils;

public class UnauthorizedException extends BaseException {



	public UnauthorizedException(String clientTxnId ,String errors, Object resource) {
		super(clientTxnId,0,BooleanUtils.FALSE, errors,resource);
		
	

}

}
