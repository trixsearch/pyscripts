package com.jio.cwms_dataprovision.dto;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString

public class SchedulerConfigRequest {

	private Long id;

	private String systemName;
	
	private String transMode;
	
	private String orgId;

	private Long batchSize;
	
	private boolean active;
	
	private String cronExpression;
	
	private String cronSite;

	private String schedulerType;
	
	private Long maximumRetry;
	
	private Long readtimeout;
	
	private String conditionCheck;
	
	private Long cronExecutionSkipTime;
	
}
