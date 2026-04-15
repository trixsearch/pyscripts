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
@Table(name = "candidate_details")
public class CandidateDetailsModel {

	@Id
	@Column(name = "candidate_id")
	private String candidateId	;
	
	@Column(name = "uuid")
	private String uuid;
	
	@Column(name = "emp_id")
	private String empId;

	@Column(name = "org_id")
	private String orgId;
}
