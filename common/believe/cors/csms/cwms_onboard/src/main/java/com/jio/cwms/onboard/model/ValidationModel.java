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
@Table(name = "validation_master")
public class ValidationModel {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Long id ;

	@Column(name = "validation_key")
	private String validationKey ;

	@Column(name = "field_name")
	private String  fieldName ;

	@Column(name = "data_type")
	private String  dataType;

	@Column(name = "length")
	private Long length;

	@Column(name = "field_type")
	private boolean fieldType;

	@Column(name = "group_name")
	private String group;

	@Column(name = "value")
	private String value;
}
