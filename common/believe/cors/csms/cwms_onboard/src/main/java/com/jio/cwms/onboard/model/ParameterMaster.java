package com.jio.cwms.onboard.model;



import java.sql.Timestamp;

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
@Table(name = "um_param_master")
public class ParameterMaster {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "upr_id")
	private Long id;

	@Column(name = "upr_group")
	private String group;

	@Column(name = "upr_key_code")
	private String key;

	@Column(name = "upr_key_value")
	private String value;

	@Column(name = "upr_sequence")
	private String sequence;

	@Column(name = "upr_isactive")
	private int active;

	@Column(name = "upr_createdate")
	private Timestamp createdOn;

	@Column(name = "upr_modidate")
	private Timestamp modifiedOn;

	@Column(name = "upr_createdby")
	private String createdBy;

	@Column(name = "upr_modi_by")
	private String modifiedBy;

}
