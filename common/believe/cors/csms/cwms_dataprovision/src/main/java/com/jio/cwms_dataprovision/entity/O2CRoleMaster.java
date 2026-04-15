package com.jio.cwms_dataprovision.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity(name = "o2c_role_master")
public class O2CRoleMaster {
	
	@Id
	@Column(name = "orm_id")
	private Integer id;
	
	@Column(name = "orm_sector")
	private String sector;
	
	@Column(name = "orm_plant")
	private String plant;
	
	@Column(name = "orm_department")
	private String department;
	
	@Column(name = "orm_trade")
	private String trade;
	
	@Column(name = "orm_matrix_type")
	private String matrixType;

}
