package com.jio.cwms_dataprovision.dto.cua_new;

import java.util.ArrayList;

import lombok.Data;

@Data
public class ResponseDataObj {

	private Object t_ERRORS;
	
	private ArrayList<ResEmpData> t_EMP_DATA;
	
    private ArrayList<ResEmpAuthData> t_EMP_AUTH_DATA;
}
