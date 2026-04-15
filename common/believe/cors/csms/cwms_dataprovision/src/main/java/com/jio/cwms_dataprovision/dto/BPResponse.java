package com.jio.cwms_dataprovision.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class BPResponse {
	
	public String  clientTxnId ;
    public String success;
    public int status;
    public String errors;
    public Resource resource;

}
