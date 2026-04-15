package com.jio.cwms.onboard.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "employee_log")
public class OnboardLogging {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;
	
	@Column(name = "system_name")
	private String systemName;
	
	@Column(name = "emp_id")
	private String empId;
	
	@Column(name = "trans_id")
	private String transId;
	
	@Column(name = "trans_mode")
	private String transMode;
	
	@Column(name = "approval_status")
	private String approvalStatus;
	
	@Column(name = "request")
	private String request;
	
	@Column(name = "request_time")
	private LocalDateTime requestTime;
	
	@Column(name = "response")
	private String response;
	
	@Column(name = "response_time")
	private LocalDateTime responseTime;
	
	@Column(name = "status")
	private String status;
	
	@Column(name = "remark")
	private String remark;
}
