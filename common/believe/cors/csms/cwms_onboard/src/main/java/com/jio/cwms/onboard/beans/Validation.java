package com.jio.cwms.onboard.beans;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class Validation {

	private String validationKey;

	private String fieldName;

	private String dataType;

	private Long length;

	private String fieldType;

}
