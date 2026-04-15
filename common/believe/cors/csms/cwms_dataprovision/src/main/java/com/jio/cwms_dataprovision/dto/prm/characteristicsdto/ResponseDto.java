package com.jio.cwms_dataprovision.dto.prm.characteristicsdto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.jio.cwms_dataprovision.dto.prm.ResultStatus;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResponseDto {

	private DealerProfile dealerProfile;
	private ResultStatus resultStatus;
	
}
