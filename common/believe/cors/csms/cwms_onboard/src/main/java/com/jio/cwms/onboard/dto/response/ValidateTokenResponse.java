package com.jio.cwms.onboard.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ValidateTokenResponse {

	public Object clientTxnId;
    public String success;
    public int status;
    public String errors;
    @JsonProperty("resource")
    public TokenResponse resource;
	
}
