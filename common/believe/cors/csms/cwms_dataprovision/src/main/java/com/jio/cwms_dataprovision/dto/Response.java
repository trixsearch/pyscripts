package com.jio.cwms_dataprovision.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Response {
	
	private String workerCode;
	private String activity;
	List<System> system = new ArrayList<>();

}
