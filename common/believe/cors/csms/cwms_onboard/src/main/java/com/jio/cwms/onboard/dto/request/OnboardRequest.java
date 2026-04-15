package com.jio.cwms.onboard.dto.request;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class OnboardRequest {

//	@JsonProperty("resource_Details")
	private ResourceDetails resource_Details;

//	@JsonProperty("access_Details")
	private AccessDetails access_Details;
	
	private String clientTxnId;

	List<String> serviceList = new ArrayList<>();

	public static boolean isAnyMandatoryMissing() {
		return false;
	}

}
