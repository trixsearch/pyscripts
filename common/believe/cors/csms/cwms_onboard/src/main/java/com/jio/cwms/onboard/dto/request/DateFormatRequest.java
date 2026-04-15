package com.jio.cwms.onboard.dto.request;

import java.util.List;

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
public class DateFormatRequest {

	private OnboardRequest request;
	
	private List<String> fieldName;
}

