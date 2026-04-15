package com.jio.cwms_dataprovision.dto.oim;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OIMResponse {
	
	private String errorCode;
    private String operationStatus;
    private String requestID;
    private String errMessage;


}
