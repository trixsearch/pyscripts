package com.jio.cwms.onboard.exception;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class DownStreamResponseError extends RuntimeException  {

	@JsonProperty("statusCode")
	private int statusCode;

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
	
	public DownStreamResponseError(int statusCode,String clientTxnId,int status, String errors,Object resource ) {
		super();
		this.statusCode = statusCode;
		this.clientTxnId = clientTxnId;
		this.success = "fasle";
		this.status = status;
		this.errors = errors;
		this.resource = resource;
	}
}
