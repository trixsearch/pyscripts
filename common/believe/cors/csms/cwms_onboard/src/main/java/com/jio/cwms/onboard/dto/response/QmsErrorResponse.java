package com.jio.cwms.onboard.dto.response;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class QmsErrorResponse {
	public int errorCode;
    public String errorMessage;
    public String errortype;
}