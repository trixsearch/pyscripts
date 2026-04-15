package com.jio.cwms.onboard.exception;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class BaseException extends RuntimeException {
	
	@JsonProperty("clientTxnId")
	private String clientTxnId;

	@JsonProperty("success")
	private String success;

	@JsonProperty("status")
	private int status;

	@JsonProperty("errors")
	private String errors;

	@JsonProperty("resource")
	private Object resource;


	public BaseException(String clientTxnId, int status, String success, String errors, Object resource) {
		super();
		this.clientTxnId = clientTxnId;
		this.success = success;
		this.status = status;
		this.errors = errors;
		this.resource = resource;
	}


}
