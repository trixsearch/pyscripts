package com.jio.cwms.onboard.dto.response;


import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class PositionCountDataHOT {
	
	@JsonProperty("PositionName")
	private String positionName;
	@JsonProperty("JioCenter")
	private String jioCenter;
	@JsonProperty("Off_Count")
	private Integer offCount;
	@JsonProperty("Avail_Count")
	private Integer availCount;
	@JsonProperty("Gap_count")
	private Integer gapCount;
	@JsonProperty("REC_count")
	private Integer recCount;
	

}
