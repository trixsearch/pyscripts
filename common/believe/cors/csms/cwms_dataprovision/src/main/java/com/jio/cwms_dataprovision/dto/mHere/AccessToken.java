package com.jio.cwms_dataprovision.dto.mHere;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccessToken {
	private Integer status;
	private String token;
	private String issued_at;
	private String expires_at;
}
