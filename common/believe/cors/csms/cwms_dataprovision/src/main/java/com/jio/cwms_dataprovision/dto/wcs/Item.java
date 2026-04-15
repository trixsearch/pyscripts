package com.jio.cwms_dataprovision.dto.wcs;

import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Item {
	
	public String scrum_id;
	public String resouce_firstname;
	public String resource_lastname;
	public String status;
	public String store_code;
	public String role_code;
	
	public void fromGeneralRequest(GeneralRequest request) {
		
		ResourceDetails resourceDetails = request.getResource_Details();
		
		this.scrum_id = resourceDetails.getWorkerCode().replace("PPRR", "92");
		this.resouce_firstname = resourceDetails.getFirst_Name();
		this.resource_lastname = resourceDetails.getLast_Name();
		if (resourceDetails.getTransMode().equals("ADD") || resourceDetails.getTransMode().equals("MOD")) {
			this.status = "Active";
		}
		else if (resourceDetails.getTransMode().equals("TER")) {
			this.status = "InActive";
		}
		this.store_code = resourceDetails.getSite_Code();
		this.role_code = resourceDetails.getArea_of_Movement_Jobkey();
	}

}
