package com.jio.cwms_dataprovision.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "access_request_log")
public class AccessRequestLogEntity {
	
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Integer id;
	 
	    @Column(name = "system_name")
	    private String systemName;
	 
	    @Column(name = "emp_id")
	    private String empId;
	    
	    @Column(name = "siteID")
	    private String siteID;
	 
	    @Column(name = "trans_id")
	    private String transId;

	    @Column(name = "org_id")
	    private String orgId;
	 
	    @Column(name = "trans_mode")
	    private String transMode;
	 
	    @Column(name = "approval_status")
	    private String approvalStatus;
	 
	    @Column(name = "request", columnDefinition = "TEXT")
	    private String request;
	 
	    @Column(name = "request_time")
	    private LocalDateTime requestTime;
	 
	    @Column(name = "response", columnDefinition = "TEXT")
	    private String response;
	 
	    @Column(name = "response_time")
	    private LocalDateTime responseTime;
	 
	    @Column(name = "status")
	    private String status;	
	    
	    @Column(name = "retry")
	    private Long retry;
	    
	    @Column(name = "kafka_status")
	    private int kafkaStatus;

}
