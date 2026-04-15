package com.jio.cwms.onboard.dto.request;

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
public class MessagePublisherRequest {

	private String clientTxnId;

	private String topicName;

	private String moduleName;

	private String message;

}
