package com.jio.cwms_dataprovision.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "scheduler_config")
public class SchedularConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "system_name")
	private String systemName;
	
	@Column(name = "trans_mode")
	private String transMode;
	
	@Column(name = "org_id")
	private String orgId;

	@Column(name = "batch_size")
	private Long batchSize;
	
	@Column(name = "active")
	private boolean active;
	
	@Column(name = "cron_expression")
	private String cronExpression;
	
	@Column(name = "cron_site")
	private String cronSite;

	@Column(name = "scheduler_type")
	private String schedulerType;
	
	@Column(name = "maximum_retry")
	private Long maximumRetry;
	
	@Column(name = "readtimeout")
	private Long readTimeout;
	
	@Column(name = "condition_check")
	private String conditionCheck;
	
	@Column(name = "cron_execution_skip_time")
	private Long cronExecutionSkipTime;
	
}