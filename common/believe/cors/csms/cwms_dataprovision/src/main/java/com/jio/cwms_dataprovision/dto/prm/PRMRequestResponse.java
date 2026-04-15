package com.jio.cwms_dataprovision.dto.prm;

import java.util.HashMap;

import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.System;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PRMRequestResponse {

	private DealerProfile dealerProfile = new DealerProfile();

	private ResultStatus resultStatus = new ResultStatus();
	
	public PRMRequestResponse(DealerProfile dealerProfile) {
		this.dealerProfile = dealerProfile;
		this.resultStatus = null;
	}

	public System toResponse() {
		System response = new System();
		
		response.setRefNo(this.dealerProfile.getTransaction().getTransactionRefNo());
		response.setSystemMsg(this.resultStatus.getErrorMessage());
		response.setSystemName(ServiceDataEnum.PRM.toString());
		response.setSystemStatus(this.resultStatus.getStatus());
		HashMap<String, String> agentValue = (HashMap<String, String>) this.dealerProfile.getOrganization().getLocation().getAgent();
		response.setPrm_id(agentValue.get("id"));
		
		return response;
	}
}
