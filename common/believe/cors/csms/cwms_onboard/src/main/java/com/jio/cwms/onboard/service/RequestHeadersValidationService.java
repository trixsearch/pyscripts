package com.jio.cwms.onboard.service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.validator.routines.InetAddressValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.jio.commons.messages.CommonsMessage;
import com.jio.cwms.onboard.model.HeaderValidationMaster;
import com.jio.cwms.onboard.repository.HeaderValidationMasterRepository;

import com.jio.cwms.onboard.wrapper.LogWrapper;

import jakarta.annotation.PostConstruct;
import lombok.extern.log4j.Log4j2;


@Service
public class RequestHeadersValidationService {

	private static List<HeaderValidationMaster> headersList = new ArrayList<>();

	@Autowired
	private HeaderValidationMasterRepository headersRepository;

	@PostConstruct
	protected void initialize() {
		
		//RequestHeadersValidationService.log.info("Initializing header validation service");
			LogWrapper.info(RequestHeadersValidationService.class, "Initializing header validation service");
		final var list = headersRepository.findAll();
		if (list.isEmpty()) {
			throw new IllegalStateException("No headers found in header validation master in database");
		}
		
		//RequestHeadersValidationService.log.debug("Found {} headers in database", list.size());
		LogWrapper.debug(RequestHeadersValidationService.class, "Found " +list.size()+ "headers in database");
		
		if (!list.isEmpty()) {
			RequestHeadersValidationService.setHeadersList(list);
			//.stream().filter(HeaderValidationMaster::isActive).collect(Collectors.toList()));
			
			
			//RequestHeadersValidationService.log.info("Added {} added headers to request headers validation list", RequestHeadersValidationService.headersList.size());
			LogWrapper.info(RequestHeadersValidationService.class, "Added "+ RequestHeadersValidationService.headersList.size()+ "added headers to request headers validation list");
			
		}
		
		//RequestHeadersValidationService.log.info("Header validation service initializaiton completed");
		LogWrapper.info(RequestHeadersValidationService.class, "Header validation service initializaiton completed");
	}

	protected static List<HeaderValidationMaster> getHeadersList() {
		return RequestHeadersValidationService.headersList;
	}

	private static void setHeadersList(final List<HeaderValidationMaster> headersList) {
		RequestHeadersValidationService.headersList = headersList;
	}

	public List<String> validateHeaders(final HttpHeaders httpHeaders) throws JsonMappingException, JsonProcessingException {
		final var errorList = new ArrayList<String>();
		final var dateFormat = new SimpleDateFormat("dd/MM/yyyy hh:mm:ss");
		String currentTimestamp = null;

		if (httpHeaders == null) {
			currentTimestamp = dateFormat.format(new Date());
			
			//RequestHeadersValidationService.log.info("Headers validation failed | Timestamp: {}", currentTimestamp);
			LogWrapper.info(RequestHeadersValidationService.class, "Headers validation failed | Timestamp:: " + currentTimestamp);
			
			String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR","029");
			ObjectMapper objectMapper = new ObjectMapper();
			JsonNode jsonNode = objectMapper.readTree(str);
			String message = jsonNode.get("msg").asText();
			String modifiedMessage = message.trim();
			((ObjectNode) jsonNode).put("message", modifiedMessage);
			errorList.add(modifiedMessage);
			
			return errorList;
		}

		final var missingMandatoryHeaders = verifyMandatoryHeadersPresent(httpHeaders);
		
		if (!missingMandatoryHeaders.isEmpty()) {
			missingMandatoryHeaders.add(0, "Mandatory request header is missing");
			return missingMandatoryHeaders;
		}

		RequestHeadersValidationService.headersList.forEach((final var header) -> {
			final String headerName = header.getHeaderKey();
			final String headerValue = httpHeaders.getFirst(headerName);
			if (StringUtils.isBlank(headerValue)) {
				
				
		errorList.add("Invalid or missing %s request header".formatted(headerName));
			}
			if (headerValue != null) {
				if (!((headerValue.length() >= header.getHeaderMinLength()) && (headerValue.length() <= header.getHeaderMaxLength()))) {
					errorList.add("Invalid %s header length in request headers".formatted(headerName));
				}
				if ("varchar".equals(header.getHeaderType())
						&& !headerValue.matches("^[a-zA-Z0-9-]+$")) {
					errorList.add("Invalid %s header because expected alphanumeric value".formatted(headerName));
				}
				if ("integer".equals(header.getHeaderType())) {
					try {
						Integer.parseInt(headerValue);
					} catch (final NumberFormatException e) {
						errorList.add("Invalid %s header because expected integer value".formatted(headerName));
					}
				}
				if ("host-address".equals(header.getHeaderType())
						&& (!headerValue.matches("^((\\d+\\.){3}\\d+|(\\d+\\.){1,3}\\*)$")
								|| !InetAddressValidator.getInstance().isValidInet4Address(headerValue))) {
					errorList.add("Invalid host address pattern found in %s header".formatted(headerName));
				}
			}
		});

		return errorList;
	}

	private List<String> verifyMandatoryHeadersPresent(final HttpHeaders httpHeaders) {
		final var errorList = new ArrayList<String>();
		RequestHeadersValidationService.headersList.stream()
		.filter(header -> header.isMandatory() && StringUtils.isBlank(httpHeaders.getFirst(header.getHeaderKey())))
		.forEach(header -> errorList.add("%s".formatted(header.getHeaderKey())));
		return errorList;
	}

	public final class RequestHeaders {

		private RequestHeaders() {
			/* Default constructor */
		}

		public static final String CHANNEL_ID = "channelId";

		public static final String SOURCE_DEVICE = "sourceDevice";

		public static final String CLIENT_TXN_ID = "clientTxnId";

		public static final String CLIENT_IP = "clientIp";

	}

}
