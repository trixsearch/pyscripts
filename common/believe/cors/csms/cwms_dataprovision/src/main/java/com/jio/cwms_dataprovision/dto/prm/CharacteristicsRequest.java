package com.jio.cwms_dataprovision.dto.prm;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class CharacteristicsRequest {

	Dealer dealer;
	
	public void fromCharacteristicsRequest(String PRMId) {
		this.dealer = new Dealer();
		this.dealer.fromDealerRequest(PRMId);
		
	}
}
