package com.jio.cwms_dataprovision.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.Response;
import com.jio.cwms_dataprovision.dto.System;

@Service
public class ExecutionService {
	
	public Response executeServices (List<GeneralService> serviceList, GeneralRequest request) throws Exception, Exception {
		Response output = new Response();

		List<System> responseList = new ArrayList<>();
		
		Set<GeneralService> serviceSet = new HashSet<GeneralService>();
		
		serviceSet.addAll(serviceList);
		
		serviceSet.parallelStream().forEach(service -> {
			try {
				responseList.add(service.executeService(request));
			} catch (Exception e) {
				e.printStackTrace();
			}
		});
		
		output.setActivity("onboarding");
		output.setSystem(responseList);
		output.setWorkerCode(request.getResource_Details().getWorkerCode());
		
		return output;
	}

}