package com.jio.cwms.onboard.service;

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.json.JSONObject;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.jio.commons.messages.CommonsMessage;
import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.constants.ApiConstant;
import com.jio.cwms.onboard.dto.request.DateFormatRequest;
import com.jio.cwms.onboard.dto.request.MessagePublisherRequest;
import com.jio.cwms.onboard.dto.request.OnboardRequest;
import com.jio.cwms.onboard.dto.response.MessagePublisherResponse;
import com.jio.cwms.onboard.dto.response.OnboardResponse;
import com.jio.cwms.onboard.dto.response.OnboardResponseResource;
import com.jio.cwms.onboard.exception.ServiceFailedException;
import com.jio.cwms.onboard.model.OnboardLogging;
import com.jio.cwms.onboard.model.ValidationModel;
import com.jio.cwms.onboard.repository.ApplicationLogRepository;
import com.jio.cwms.onboard.repository.ValidationRepository;
import com.jio.cwms.onboard.service.RequestHeadersValidationService.RequestHeaders;
import com.jio.cwms.onboard.service.apis.CWMSPublisherApis;
import com.jio.cwms.onboard.utils.CommonUtils;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class OnboardServiceImpl implements OnboardService {

//	private static final String DATA_INSERTED_SUCCESSFULLY = "data inserted successfully";

	String str_success = CommonsMessage.getSuccessJsonResponseMessage("CWMS_Onboard_SUCC", "005");

//	private static final String DATA_INSERTION_FAILED = "data insertion failed";

	String str = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR", "028");
	private static final String RECEIVED = "received";

	@Autowired
	private ValidationRepository validationRepository;

	@Autowired
	private ApplicationLogRepository applicationLogRepository;

	@Autowired
	RedisTemplate<String, String> template;
	
	@Autowired
	ObjectMapper objectMapper;
	
	@Autowired
	CWMSPublisherApis cwmsPublisherApis;
	
	@Value("${app.config.kafka.producer.topic-name}")
	private String kafkaTopicName;

	@Override
	public OnboardResponse onboardAsEmployee(final String clientTxnId, final HttpHeaders headers,
			OnboardRequest onboardRequest, OnboardLogging onboardLog) throws JsonProcessingException {
		final var workerCode = onboardRequest.getResource_Details().getWorkerCode();
		
		 LocalDateTime now = LocalDateTime.now(); 

		// Redis data insertion
		String component = "CWMS-Onboard-" + clientTxnId + "-" + now + "-" + workerCode;
		try {
			ObjectMapper mapper = new ObjectMapper();
			String jsonInString = mapper.writeValueAsString(onboardRequest);
			boolean redisStatus = insertIntoRedis(component, "Onboard", jsonInString); // CWMS-Onboard-ClientTxnId-WorkerCode
		} catch (Exception e) {

			LogWrapper.error(getClass(), e.getMessage());
		}

		try {
			DateFormatRequest dateChangeRequest = changeDateFormat(onboardRequest, clientTxnId);
			onboardLog.setResponse(objectMapper.writeValueAsString(dateChangeRequest));
			if (!dateChangeRequest.getFieldName().isEmpty()) {

				String str_1 = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR", "032");
				String error =(CommonUtils.modifyJsonMessage(str_1) + dateChangeRequest.getFieldName().toString());
				
				throw new ServiceFailedException(headers.getFirst(RequestHeaders.CLIENT_TXN_ID),error,null);
			}
		} catch (NoSuchFieldException | SecurityException e1) {

		}
		final List<String> errorList = validateOnboardRequestData(clientTxnId, onboardRequest);
		if (!errorList.isEmpty()) {
			//applicationLogRepository
			//		.save(ApplicationLogService.generateLog(ApiConstant.onboard, OnboardServiceImpl.RECEIVED,
			//				clientTxnId, "1", ApiConstant.upstream, ApiConstant.onboard, workerCode));

			String str1 = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR", "030");
			OnboardResponseResource resource= OnboardResponseResource.builder()
					.workerCode(onboardRequest.getResource_Details().getWorkerCode())
					.message(CommonUtils.modifyJsonMessage(str)).build();
			
			String error= (CommonUtils.modifyJsonMessage(str1) + ":" + errorList + "");
			throw new ServiceFailedException(headers.getFirst(RequestHeaders.CLIENT_TXN_ID),error,resource);


		}

		//applicationLogRepository.save(ApplicationLogService.generateLog(ApiConstant.onboard,
				//OnboardServiceImpl.RECEIVED, clientTxnId, "1", ApiConstant.upstream, ApiConstant.onboard, workerCode));

		//applicationLogRepository.save(ApplicationLogService.generateLog(ApiConstant.onboard, "sent", clientTxnId, "1",
				//ApiConstant.publisher, ApiConstant.onboard, workerCode));



		final var messagePublishRequest = new MessagePublisherRequest();
		messagePublishRequest.setTopicName(kafkaTopicName);
		messagePublishRequest.setModuleName("onboard");

		
		String ClientTxnId = headers.getFirst("clientTxnId");
		messagePublishRequest.setClientTxnId(ClientTxnId);
		onboardRequest.setClientTxnId(ClientTxnId);

			messagePublishRequest.setMessage(new ObjectMapper().writeValueAsString(onboardRequest));


		final MessagePublisherResponse onboardRequestPublished = cwmsPublisherApis.callPublishAPI(clientTxnId, headers,
				messagePublishRequest);
		String str2 = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR", "031");

		try
		{
			if ("1".equals(onboardRequestPublished.getStatus())) {
			//applicationLogRepository
					//.save(ApplicationLogService.generateLog(ApiConstant.onboard, OnboardServiceImpl.RECEIVED,
							//clientTxnId, "1", ApiConstant.publisher, ApiConstant.onboard, workerCode));

			final OnboardResponse onboard = OnboardResponse.builder().clientTxnId(clientTxnId).status(1)
					.success(BooleanUtils.TRUE).errors("")
					.resource(OnboardResponseResource.builder()
							.workerCode(onboardRequest.getResource_Details().getWorkerCode())
							.message(CommonUtils.modifyJsonMessage(str_success)).build())
					.build();
			//applicationLogRepository.save(ApplicationLogService.generateLog(ApiConstant.onboard, "sent", clientTxnId,
					//"1", ApiConstant.upstream, ApiConstant.onboard, workerCode));
			return onboard;
		}
		}
		catch (Exception e)
		{

		//applicationLogRepository.save(ApplicationLogService.generateLog(ApiConstant.onboard, "sent", clientTxnId, "1",
				//ApiConstant.upstream, ApiConstant.onboard, workerCode));
		throw new ServiceFailedException(clientTxnId,CommonUtils.modifyJsonMessage(str),null);
		}

		
		OnboardResponseResource resource=OnboardResponseResource.builder()
				.workerCode(onboardRequest.getResource_Details().getWorkerCode())
				.message(CommonUtils.modifyJsonMessage(str)).build();
		
		throw new ServiceFailedException(clientTxnId,CommonUtils.modifyJsonMessage(str2),resource);

	}

	public List<String> validateOnboardRequestData(final String clientTxnId, final OnboardRequest onboardRequest) {
		if (onboardRequest == null) {
			return Collections.singletonList("Invalid request data");
		}
		String organization = onboardRequest.getResource_Details().getOrganization();

		final List<String> errorList = new ArrayList<>();

		if (ApiConstant.validOrganizations.contains((organization).toUpperCase())) {
			try {

				errorList.addAll(validateResourceDetails(onboardRequest));
				errorList.addAll(validateAccessDetails(onboardRequest));
			} catch (final Exception e) {

				LogWrapper.error(OnboardServiceImpl.class,
						"Exception occurred while validating onboarding request data | Client Txn Id:: " + clientTxnId
								+ " | Worker Code :: " + onboardRequest.getResource_Details().getWorkerCode()
								+ " | Exception ::" + e.getClass().getCanonicalName() + " | Message::"
								+ ExceptionUtils.getMessage(e) + " | Cause::" + ExceptionUtils.getRootCauseMessage(e));
			}
		} else {
			errorList.add("organization");
		}
		return errorList;
	}

	private List<String> validateResourceDetails(final OnboardRequest onboardRequest) {
		final List<String> errorList = new ArrayList<>();
		if (onboardRequest.getResource_Details() != null) {
			final String orgtype = onboardRequest.getResource_Details().getOrganization();
			final String grp = onboardRequest.getResource_Details().getClass().getSimpleName();

			Map<String, ValidationModel> ls = new HashMap<>();

			List<ValidationModel> validation = validationRepository.findByValidationKeyAndGroup(orgtype, grp);
			for (ValidationModel validationModel : validation) {
				String fieldName = validationModel.getFieldName();
				boolean fieldType = validationModel.isFieldType();
				ValidationModel model = new ValidationModel();
				model.setFieldName(fieldName);
				model.setValue(validationModel.getValue());
				model.setFieldType(fieldType);
				ls.put(fieldName, model);
			}

			final var jsonObject = new Gson().toJsonTree(onboardRequest.getResource_Details()).getAsJsonObject();

			for (Map.Entry<String, ValidationModel> entry : ls.entrySet()) {
				String key = entry.getKey();
				ValidationModel validationModel = entry.getValue();

				JsonElement element = jsonObject.get(key);
				if (validationModel.isFieldType()) {
					if (element != null && !element.isJsonNull()) {
						String value = element.getAsString();

						if (value.isEmpty()) {
							errorList.add(key);
						}

						else if (key.equals(ApiConstant.approvalStatus) || key.equals(ApiConstant.transMode)) {

							String fieldValue = validationModel.getValue();

							List<String> possibleValues = Arrays.asList(fieldValue.split(","));

							boolean valueMatches = possibleValues.contains(value.toUpperCase());

							if (!valueMatches) {
								errorList.add(key);
							}
						}

					} else {
						errorList.add(key);
					}

				}
			}
		}
		return errorList;
	}

	private List<String> validateAccessDetails(final OnboardRequest onboardRequest) {
		final List<String> errorList = new ArrayList<>();
		if (onboardRequest.getAccess_Details() != null) {
			final var jsonObj1 = new JSONObject(onboardRequest.getAccess_Details());

			if (jsonObj1.length() > 0) {
				final String orgtype = onboardRequest.getResource_Details().getOrganization();
				final String grp = onboardRequest.getAccess_Details().getClass().getSimpleName();

				final var ls = new HashMap<String, Boolean>();
				final var validation = validationRepository.findByValidationKeyAndGroup(orgtype, grp);
				validation.forEach(validationModel -> {
					final String fieldName = validationModel.getFieldName();
					final boolean fieldType = validationModel.isFieldType();
					ls.put(fieldName, fieldType);
				});
				final var jsonObject = new Gson().toJsonTree(onboardRequest.getAccess_Details()).getAsJsonObject();
				ls.entrySet().forEach((final Map.Entry<String, Boolean> entry) -> {
					final String key = entry.getKey();
					final boolean fieldType = entry.getValue();
					if (fieldType) {
						final var element = jsonObject.get(key);
						if ((element != null) && !element.isJsonNull()) {
							final var value = element.getAsString();
							if (value.isEmpty()) {
								errorList.add(key);
							}
						} else {
							errorList.add(key);
						}
					}
				});

				errorList.addAll(validateGateAccessDetails(orgtype, jsonObject));
			}
		}
		return errorList;
	}

	private List<String> validateGateAccessDetails(final String orgtype, final JsonObject jsonObject) {
		final List<String> errorList = new ArrayList<>();
		final var gateAccessArray = jsonObject.getAsJsonArray(ApiConstant.gateAccess);
		for (final JsonElement gateAccessElement : gateAccessArray) {
			final var gateAccessObject = gateAccessElement.getAsJsonObject();
			final var jsonObject1 = new Gson().toJsonTree(gateAccessObject).getAsJsonObject();
			final var gate = new HashMap<String, Boolean>();
			final var gatevalidation = validationRepository.findByValidationKeyAndGroup(orgtype, ApiConstant.gate);
			gatevalidation.forEach(validationModel1 -> {
				final String gateFieldName = validationModel1.getFieldName();
				final boolean gateFieldType = validationModel1.isFieldType();
				gate.put(gateFieldName, gateFieldType);
			});

			gate.entrySet().forEach((final Map.Entry<String, Boolean> entry) -> {
				final String key = entry.getKey();
				final boolean fieldType = entry.getValue();
				if (fieldType) {
					final var element = jsonObject1.get(key);
					if ((element != null) && !element.isJsonNull()) {
						final var value = element.getAsString();
						if (value.isEmpty()) {
							errorList.add("gate_Access." + key);
						}
					} else {
						errorList.add("gate_Access." + key);
					}
				}
			});
		}
		return errorList;
	}

	private boolean insertIntoRedis(String componentName, String outerKey, String jsonInString) {

		try {

			template.opsForHash().put(componentName, outerKey, jsonInString);
			template.opsForHash().put(componentName, "Requested Date", LocalDateTime.now().toString());
			template.expire(componentName, Duration.ofDays(Long.parseLong(ApplicationConfig.getRedisData().getValue())));

			return true;
		} catch (Exception e) {

			return false;
		}
	}

	public DateFormatRequest changeDateFormat(OnboardRequest mainRequest, String clientTxnId)
			throws NoSuchFieldException, SecurityException {
		String currentMethodName = (new Throwable().getStackTrace()[0].getMethodName());
		String requestId = MDC.get(ApiConstant.requestId);
		String workerCode = mainRequest.getAccess_Details().getWorker_Code();
		LogWrapper.info(OnboardServiceImpl.class,
				currentMethodName + ": clientTxnId:" + requestId + ",WorkerCode :" + workerCode);
		List<String> dateFields = new ArrayList<String>();
		DateFormatRequest dateChangeRequest = DateFormatRequest.builder().request(mainRequest).fieldName(dateFields)
				.build();

		List<ValidationModel> dateField = ApplicationConfig.getDateFieldList();

		List<String> dateFieldList = new ArrayList<>();
		for (ValidationModel validationOnboard : dateField) {
			dateFieldList.add(validationOnboard.getFieldName());
		}

		List<String> uniqueList = dateFieldList.stream().distinct().collect(Collectors.toList());

		for (String requestDate : uniqueList) {

			Field field = mainRequest.getResource_Details().getClass().getDeclaredField(requestDate);
			field.setAccessible(true);
			try {
				String date = (String) field.get(mainRequest.getResource_Details());
				if (date != null && !date.isEmpty()) {
					// String dateFormat = getDate(date, "yyyy-MM-dd");

					DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
					DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

					LocalDate workOrderDateParsed = LocalDate.parse(date, inputFormatter);
					String convertedWorkOrderDate = workOrderDateParsed.format(outputFormatter);

					field.set(mainRequest.getResource_Details(), convertedWorkOrderDate);
				}
				dateChangeRequest = DateFormatRequest.builder().request(mainRequest).fieldName(dateFields).build();

			} catch (IllegalArgumentException | DateTimeParseException | IllegalAccessException e) {
				OnboardServiceImpl.log.error(
						"Exception occurred while changed the format of date in ResourceDetails | Client Txn Id: {} | Worker Code: {} | Exception: {} | Message: {} | Cause: {}",
						clientTxnId, mainRequest.getResource_Details().getWorkerCode(), e.getClass().getCanonicalName(),
						ExceptionUtils.getMessage(e), ExceptionUtils.getRootCauseMessage(e));
				dateFields.add(requestDate);
				dateChangeRequest = DateFormatRequest.builder().request(mainRequest).fieldName(dateFields).build();
			}
		}

		List<ValidationModel> accessDateField = ApplicationConfig.getAccessDateFieldList();

		List<String> accessDateFieldList = new ArrayList<>();
		for (ValidationModel validationOnboard : accessDateField) {
			accessDateFieldList.add(validationOnboard.getFieldName());
		}

		List<String> accessUniqueList = accessDateFieldList.stream().distinct().collect(Collectors.toList());

		for (String requestDate : accessUniqueList) {

			Field field = mainRequest.getAccess_Details().getClass().getDeclaredField(requestDate);
			field.setAccessible(true);
			try {
				String date = (String) field.get(mainRequest.getAccess_Details());
				if (date != null && !date.isEmpty()) {
					// String dateFormat = getDate(date, "yyyy-MM-dd");
					DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
					DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

					LocalDate workOrderDateParsed = LocalDate.parse(date, inputFormatter);
					String convertedWorkOrderDate = workOrderDateParsed.format(outputFormatter);

					field.set(mainRequest.getAccess_Details(), convertedWorkOrderDate);
				}
				dateChangeRequest = DateFormatRequest.builder().request(mainRequest).fieldName(dateFields).build();
			} catch (IllegalArgumentException | DateTimeParseException | IllegalAccessException e) {
				OnboardServiceImpl.log.error(
						"Exception occurred while changed the format of date in AccessDetails | Client Txn Id: {} | Worker Code: {} | Exception: {} | Message: {} | Cause: {}",
						clientTxnId, mainRequest.getResource_Details().getWorkerCode(), e.getClass().getCanonicalName(),
						ExceptionUtils.getMessage(e), ExceptionUtils.getRootCauseMessage(e));
				dateFields.add(requestDate);
				dateChangeRequest = DateFormatRequest.builder().request(mainRequest).fieldName(dateFields).build();
			}
		}

		return dateChangeRequest;
	}

	public static String getDate(String inputStringDate, String format) {

		DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
		DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern(format);

		LocalDate workOrderDateParsed = LocalDate.parse(inputStringDate, inputFormatter);
		String convertedWorkOrderDate = workOrderDateParsed.format(outputFormatter);

		return convertedWorkOrderDate;
	}
}
