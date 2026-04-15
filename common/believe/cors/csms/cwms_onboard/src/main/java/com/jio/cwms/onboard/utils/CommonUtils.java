package com.jio.cwms.onboard.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class CommonUtils {

	
	private static ObjectMapper objectMapper = new ObjectMapper();

public static  String modifyJsonMessage(String str)  {
	try {

	JsonNode jsonNode = objectMapper.readTree(str);
	String message = jsonNode.get("msg").asText();
	String modifiedMessage = message.trim();
	((ObjectNode) jsonNode).put("message", modifiedMessage);
	return modifiedMessage;
	 } catch (Exception e) {
            // Handle exceptions if needed
            e.printStackTrace();
            return str; // Return the original JSON string on error
        }
}
}
