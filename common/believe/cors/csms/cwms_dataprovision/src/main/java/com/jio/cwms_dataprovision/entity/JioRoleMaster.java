package com.jio.cwms_dataprovision.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity(name = "jio_role_master")
public class JioRoleMaster {
	
	@Id
	@Column(name = "jrm_id")
	private Integer id;
	
	@Column(name = "jrm_vertical")
	private String vertical;
	
	@Column(name = "jrm_work_area")
	private String workArea;
	
	@Column(name = "jrm_work_stream")
	private String workStream;
	
	@Column(name = "jrm_role_position_code")
	private String rolePositionCode;
	
	@Column(name = "jrm_matrix_type")
	private String matrixType;

}
