package com.jio.cwms_dataprovision.dto;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeneralRequest {

	ResourceDetails resource_Details;
	AccessDetails access_Details;
	String topicName;
	String clientTxnId;
	List<String> serviceList = new ArrayList<>();
	public void setSingleService(ServiceDataEnum system) {
        this.serviceList.clear();                  
        this.serviceList.add(system.name());     
    }

}
