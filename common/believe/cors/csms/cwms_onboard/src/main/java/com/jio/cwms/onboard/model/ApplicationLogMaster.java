package com.jio.cwms.onboard.model;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Hidden
@Data
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "application_log_master")
public class ApplicationLogMaster {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "alm_id")
	private int id;

	@Column(name = "alm_module")
	private String module;

	@Column(name = "alm_transaction")
	private String transactionId;

	@Column(name = "alm_Remarks")
	private String remarks;

	@Column(name = "alm_status")
	private String status;

	@Column(name = "alm_created_on")
	private String createdOn;

	@Column(name = "alm_createdBY")
	private String createdBy;

	@Column(name = "alm_stage")
	private String stage;

	@Column(name = "alm_worker_code")
	private String workerCode;

}
