package com.jio.cwms_dataprovision.service;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.Response;
import com.jio.cwms_dataprovision.dto.System;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class RedisService {

	@Autowired
	ConditionCheckService service;

	@Autowired
	RedisTemplate<String, String> template;

	public boolean insertIntoRedis(String componentName, Map<String, String> particularSystemResponse) {

		try {
			template.opsForHash().putAll(componentName, particularSystemResponse); // for multiple <key, value> pair

			// put(componentName, outerKey, jsonInString); //for single <key, value> pair

			LogWrapper.info(RedisService.class, "Value inserted in Redis for key : " + particularSystemResponse
					+ " and " + componentName + " : true ");

			return true;

		} catch (Exception e) {

			LogWrapper.error(RedisService.class, "Value not inserted in Redis for key : " + particularSystemResponse
					+ " and " + componentName + " : false ");
			LogWrapper.error(getClass(), e.getMessage());

			return false;
		}
	}

	public void redisPush(GeneralRequest request , Response response) throws Exception {

		ObjectMapper mapper = new ObjectMapper();

		// Push data in Redis.
		String requestId = request.getClientTxnId();
		String workerCode = request.getResource_Details().getWorkerCode();
		String topicName = "CWMS-Onboard";
		String component = topicName + "-" + requestId + "*" + workerCode;

	Set<String> key = template.keys(component);
	if(!key.isEmpty()) { 
		Map<String, String> particularSystemResponse = response.getSystem().stream()
				.collect(Collectors.toMap(System::getSystemName, system -> {
					try {
						return mapper.writeValueAsString(system);
					} catch (Exception e) {
						LogWrapper.error(getClass(), e.getMessage());
						return "";
					}
				}));
		try {

			boolean redisStatus = insertIntoRedis(key.iterator().next(), particularSystemResponse); // CWMS-Onboard-ClientTxnId-WorkerCode

		} catch (Exception e) {

			e.printStackTrace();
		}
		
	 }else {
			LogWrapper.error(RedisService.class, "Hash-Key not present in Redis : " + component );
		}

	}

	public String getFromRedis(String component, String outerKey) {
		try {
			if (template.opsForHash().hasKey(component, outerKey)) {

				LogWrapper.info(RedisService.class, " Method: getFromRedis");
				LogWrapper.info(RedisService.class,
						"Value retreived from Redis for key : " + outerKey + " and " + component + " : ");

				return String.valueOf(template.opsForHash().get(component, outerKey));
			}
		} catch (Exception e) {

			LogWrapper.error(RedisService.class, "Exception Occurred :-" + e.getMessage());

			return "";
		}
		return "";
	}

}
