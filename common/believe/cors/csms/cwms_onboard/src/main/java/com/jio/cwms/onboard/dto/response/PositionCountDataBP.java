package com.jio.cwms.onboard.dto.response;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
@Builder
public class PositionCountDataBP {
	
	private String positionName;
	private String jioCenter;
	private Integer offCount;
	private Integer availCount;
	private Integer gapCount;
	private Integer recCount;
	private String orgId;
	
	
	public PositionCountDataHOT toPositionDataHot() {
		PositionCountDataHOT data = new PositionCountDataHOT();
		data.setAvailCount(availCount);
		data.setGapCount(gapCount);
		data.setJioCenter(jioCenter);
		data.setOffCount(offCount);
		data.setPositionName(positionName);
		data.setRecCount(recCount);
		
		return data;
	}
	

}
