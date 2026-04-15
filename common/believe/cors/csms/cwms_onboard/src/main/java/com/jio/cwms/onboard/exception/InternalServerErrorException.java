package com.jio.cwms.onboard.exception;

import org.apache.commons.lang3.BooleanUtils;

public class InternalServerErrorException extends BaseException {



	public InternalServerErrorException(String clientTxnId ,String errors, Object resource) {
		super(clientTxnId,0,BooleanUtils.FALSE, errors,resource);
		
	

}

}
