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
@Table(name = "header_validation_master")
public class HeaderValidationMaster {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "header_key")
	private String headerKey;

	@Column(name = "header_value_min_length")
	private int headerMinLength;

	@Column(name = "header_value_max_length")
	private int headerMaxLength;

	@Column(name = "header_type")
	private String headerType;

	@Column(name = "description")
	private String description;

	@Column(name = "mandatory")
	private boolean mandatory;

	@Column(name = "created_date")
	private Timestamp createdDate;

	@Column(name = "created_by")
	private long createdBy;

	@Column(name = "updated_date")
	private Timestamp updatedDate;

	@Column(name = "updated_by")
	private Long updatedBy;

	@Column(name = "active")
	private boolean active;

}
