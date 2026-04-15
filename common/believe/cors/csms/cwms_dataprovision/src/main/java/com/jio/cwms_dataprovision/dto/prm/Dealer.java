package com.jio.cwms_dataprovision.dto.prm;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Dealer {

	private String id;
	private String returnCompleteDealer;

	public void fromDealerRequest(String PRMId) {
		this.id = PRMId;
		this.returnCompleteDealer = "1";

	}

}
