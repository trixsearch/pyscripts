package com.jio.cwms.onboard.dto.response;

import java.util.List;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

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
@JsonInclude(value = Include.NON_NULL)
public class MessagePublisherResponse {

	private String clientTxnId;

	private String success;

	private String status;

	private String errors;

	private Object resource;

	public static String generateErrorString(final List<String> errorList) {
		if (errorList.isEmpty()) {
			return StringUtils.EMPTY;
		}
		final var error = new StringBuilder();
		error.append("[");
		errorList.forEach(err -> error.append("'" + err + "',"));
		error.append("]");
		return error.toString().replace(",]", "]");
	}

}
