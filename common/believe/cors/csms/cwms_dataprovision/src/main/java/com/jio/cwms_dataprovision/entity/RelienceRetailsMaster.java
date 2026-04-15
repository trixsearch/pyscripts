package com.jio.cwms_dataprovision.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity(name = "reliance_retails_master")
public class RelienceRetailsMaster {
	
	@Id
	@Column(name = "rrm_id")
	private Integer id;
	
	@Column(name = "rrm_business_code")
	private String businessCode;
	
	@Column(name = "rrm_segment_code")
	private String segmentCode;
	
	@Column(name = "rrm_family_code")
	private String familyCode;
	
	@Column(name = "rrm_class_code")
	private String classCode;
	
	@Column(name = "rrm_job_code")
	private String jobCode;
	
	@Column(name = "rrm_matrix_type")
	private String matrixType;

}
