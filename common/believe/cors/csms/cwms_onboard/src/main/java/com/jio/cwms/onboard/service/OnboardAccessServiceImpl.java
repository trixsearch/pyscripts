package com.jio.cwms.onboard.service;

import java.io.ObjectInputFilter.Config;
import java.lang.reflect.Field;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
import com.jio.cwms.onboard.dto.request.MessageAccessRequest;
import com.jio.cwms.onboard.dto.request.OnboardRequest;
import com.jio.cwms.onboard.dto.response.AccessResponse;
import com.jio.cwms.onboard.dto.response.OnboardResponse;
import com.jio.cwms.onboard.dto.response.OnboardResponseResource;
import com.jio.cwms.onboard.exception.ServiceFailedException;
import com.jio.cwms.onboard.model.ValidationModel;
import com.jio.cwms.onboard.repository.ApplicationLogRepository;
import com.jio.cwms.onboard.repository.ValidationRepository;
import com.jio.cwms.onboard.service.apis.CWMSAccessApis;
import com.jio.cwms.onboard.utils.CommonUtils;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class OnboardAccessServiceImpl extends CWMSAccessApis implements OnboardAccessService {

	private static final String RECEIVED = "received";

	@Autowired
	RedisTemplate<String, String> template;

	@Autowired
	private ValidationRepository validationRepository;

	@Autowired
	private ApplicationLogRepository applicationLogRepository;
	
	@Autowired 
	private ApplicationConfig config;

	@Override
	public OnboardResponse onboardAsEmployee(final String clientTxnId, OnboardRequest onboardRequest,
			final HttpHeaders headers) throws NoSuchFieldException, SecurityException {
		final var workerCode = onboardRequest.getResource_Details().getWorkerCode();
		 LocalDateTime now = LocalDateTime.now();  
		// Redis data Insertion
		String component = "CWMS-Access-" + clientTxnId + "-" + now  + "-" + workerCode;
		try {
			ObjectMapper mapper = new ObjectMapper();
			String jsonInString = mapper.writeValueAsString(onboardRequest);
			boolean redisStatus = insertIntoRedis(component, "Access", jsonInString); // CWMS-Onboard-ClientTxnId-WorkerCode
		} catch (Exception e)
		{
		LogWrapper.error(getClass(), e.getMessage());
		}	
			
		onboardRequest = changeDateFormat(onboardRequest);
		
		if (Arrays.asList(config.getOrgList().getDam_siteService().split(","))
				.contains(onboardRequest.getResource_Details().getOrganization())) {
		final List<String> errorList = validateOnboardRequestData(clientTxnId, onboardRequest);
		if (!errorList.isEmpty()) {
			applicationLogRepository
					.save(ApplicationLogService.generateLog(ApiConstant.onboard, OnboardAccessServiceImpl.RECEIVED,
							clientTxnId, "1", ApiConstant.upstream, ApiConstant.onboard, workerCode));

			String str1 = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR", "030");
		     throw new ServiceFailedException(clientTxnId,CommonUtils.modifyJsonMessage(str1),null);
		}
		}
		else {
			 throw new ServiceFailedException(clientTxnId,"Invalid/Deactivated Organization",null);
		}

		applicationLogRepository
				.save(ApplicationLogService.generateLog(ApiConstant.onboard, OnboardAccessServiceImpl.RECEIVED,
						clientTxnId, "1", ApiConstant.upstream, ApiConstant.onboard, workerCode));

		applicationLogRepository.save(ApplicationLogService.generateLog(ApiConstant.onboard, "sent", clientTxnId, "1",
				ApiConstant.publisher, ApiConstant.onboard, workerCode));

		final var messageAccessRequest = new MessageAccessRequest();
		messageAccessRequest.setModuleName("cwms_onboard");
		try {
			messageAccessRequest.setMessage(new ObjectMapper().writeValueAsString(onboardRequest));
		} catch (final JsonProcessingException JsonMappingException) {

			LogWrapper.error(OnboardAccessServiceImpl.class,
					"Exception occurred while converting onboard request to json string for access api call | Client Txn Id::  "
							+ clientTxnId + " | Worker Code:: " + onboardRequest.getResource_Details().getWorkerCode());
			String str_2 = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR", "033");

			String str_3 = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR", "034");
			
			OnboardResponseResource resource = OnboardResponseResource.builder()
			.workerCode(onboardRequest.getResource_Details().getWorkerCode())
			.message(CommonUtils.modifyJsonMessage(str_3)).build();
			
			 throw new ServiceFailedException(clientTxnId,CommonUtils.modifyJsonMessage(str_2),resource);

		}

		String str_4 = CommonsMessage.getErrorJsonResponseMessage("CWMS_Onboard_ERR", "031");		
		final AccessResponse onboardRequestAccess = super.callAccessAPI(clientTxnId, messageAccessRequest);
		try
		{
		if ((onboardRequestAccess.getWorkerCode()) != null) {
			applicationLogRepository
					.save(ApplicationLogService.generateLog(ApiConstant.onboard, OnboardAccessServiceImpl.RECEIVED,
							clientTxnId, "1", ApiConstant.publisher, ApiConstant.onboard, workerCode));

			final OnboardResponse onboard = OnboardResponse.builder().clientTxnId(clientTxnId).status(1)
					.success(BooleanUtils.TRUE).errors("").resource(onboardRequestAccess).build();

			applicationLogRepository.save(ApplicationLogService.generateLog(ApiConstant.onboard, "sent", clientTxnId,
					"1", ApiConstant.upstream, ApiConstant.onboard, workerCode));

			return onboard;
		}}
		catch (final Exception e) { 

		applicationLogRepository.save(ApplicationLogService.generateLog(ApiConstant.onboard, "sent", clientTxnId, "1",
				ApiConstant.upstream, ApiConstant.onboard, workerCode));

        throw new ServiceFailedException(clientTxnId,CommonUtils.modifyJsonMessage(str_4),onboardRequestAccess);
		}
		
		throw new ServiceFailedException(clientTxnId,CommonUtils.modifyJsonMessage(str_4),onboardRequestAccess);
//		 return OnboardResponse.builder().clientTxnId(clientTxnId).status(0).success(BooleanUtils.FALSE)
//				.errors(CommonUtils.modifyJsonMessage(str_4)).resource(onboardRequestAccess).build();
	}

	public List<String> validateOnboardRequestData(final String clientTxnId, final OnboardRequest onboardRequest) {
		if (onboardRequest == null) {
			return Collections.singletonList("Invalid request data");
		}
		final List<String> errorList = new ArrayList<>();
		try {
			errorList.addAll(validateResourceDetails(onboardRequest));
			errorList.addAll(validateAccessDetails(onboardRequest));
		} catch (final Exception e) {
			LogWrapper.error(OnboardAccessServiceImpl.class,
					"Exception occurred while validating onboarding request data | Client Txn Id:: " + clientTxnId
							+ " | Worker Code:: " + onboardRequest.getResource_Details().getWorkerCode()
							+ " | Exception:: " + e.getClass().getCanonicalName() + " | Message:: "
							+ ExceptionUtils.getMessage(e) + " | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
		}
		return errorList;
	}

	private List<String> validateResourceDetails(final OnboardRequest onboardRequest) {
		final List<String> errorList = new ArrayList<>();
		if (onboardRequest.getResource_Details() != null) {

			final String grp = onboardRequest.getResource_Details().getClass().getSimpleName();

			Map<String, ValidationModel> ls = new HashMap<>();
			final List<ValidationModel> validation = validationRepository
					.findByValidationKeyAndGroup(ApiConstant.access, grp);
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

				final String grp = onboardRequest.getAccess_Details().getClass().getSimpleName();

				final var ls = new HashMap<String, Boolean>();
				final var validation = validationRepository.findByValidationKeyAndGroup(ApiConstant.access, grp);
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

				errorList.addAll(validateGateAccessDetails(ApiConstant.access, jsonObject));
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
			final var gatevalidation = validationRepository.findByValidationKeyAndGroup(ApiConstant.access,
					ApiConstant.gate);
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

	public OnboardRequest changeDateFormat(OnboardRequest mainRequest) throws NoSuchFieldException, SecurityException {
		String currentMethodName = (new Throwable().getStackTrace()[0].getMethodName());
		String requestId = MDC.get(ApiConstant.requestId);
		String workerCode = mainRequest.getAccess_Details().getWorker_Code();

		LogWrapper.info(OnboardServiceImpl.class,
				currentMethodName + ": clientTxnId:" + requestId + ",WorkerCode :" + workerCode);

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
					String dateFormat = getDate(date, "yyyy-MM-dd");
					field.set(mainRequest.getResource_Details(), dateFormat);
					}
			} catch (IllegalArgumentException | IllegalAccessException e) {
				LogWrapper.error(OnboardAccessServiceImpl.class,
						"Exception occurred while Changing Date Format | "
								+ " | Exception:: " + e.getClass().getCanonicalName() + " | Message:: "
								+ ExceptionUtils.getMessage(e) + " | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			}
		}
		
		List<ValidationModel> accessDateField = ApplicationConfig.getAccessDateFieldList();
		List<String> accessDateFieldList = new ArrayList<>();
		for (ValidationModel validationOnboard : accessDateField) {
			accessDateFieldList.add(validationOnboard.getFieldName());
		}

		List<String> accessUniqueList = accessDateFieldList.stream().distinct().collect(Collectors.toList());

		for (String accessDate : accessUniqueList) {

			Field field = mainRequest.getAccess_Details().getClass().getDeclaredField(accessDate);
			field.setAccessible(true);
			try {
				String date = (String) field.get(mainRequest.getAccess_Details());
				if (date != null && !date.isEmpty())  {
					String dateFormat = getDate(date, "yyyy-MM-dd");
					field.set(mainRequest.getAccess_Details(), dateFormat);
				}
			} catch (IllegalArgumentException | IllegalAccessException e) {
				
				LogWrapper.error(OnboardAccessServiceImpl.class,
						"Exception occurred while Changing Date Format | "
								+ " | Exception:: " + e.getClass().getCanonicalName() + " | Message:: "
								+ ExceptionUtils.getMessage(e) + " | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
			}
		}
		LogWrapper.info(OnboardServiceImpl.class,
				currentMethodName + "Request Body after changing date format : " + mainRequest);
		return mainRequest;
	}

	public static String getDate(String inputStringDate, String format) {

		if (inputStringDate.length() == 10) {
			inputStringDate = "0" + inputStringDate;
		}

		DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
		DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern(format);

		LocalDate workOrderDateParsed = LocalDate.parse(inputStringDate, inputFormatter);
		String convertedWorkOrderDate = workOrderDateParsed.format(outputFormatter);

		return convertedWorkOrderDate;
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
}
