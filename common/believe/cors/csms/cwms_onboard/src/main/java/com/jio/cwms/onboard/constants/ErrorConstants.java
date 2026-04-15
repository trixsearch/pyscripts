package com.jio.cwms.onboard.constants;


import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorConstants {
	ERR_CD_01("Something went wrong"),
	ERR_CD_02("Internal Error Occurred");
    private final String value;
    
	

	@JsonValue
	public String getValue() {
		return value;
	}


}
