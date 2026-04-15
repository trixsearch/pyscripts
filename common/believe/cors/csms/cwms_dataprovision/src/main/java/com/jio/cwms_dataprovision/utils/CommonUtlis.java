package com.jio.cwms_dataprovision.utils;

import java.util.Iterator;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class CommonUtlis {
	
public JsonNode jsonNodeResponse(String jsonString) throws JsonMappingException, JsonProcessingException {
		
		ObjectMapper objectMapper = new ObjectMapper();
		JsonNode jsonNode = objectMapper.readTree(jsonString);
	    		
	    return jsonNode;
	}
	
	public HttpHeaders headers(JsonNode jsonNode) {

        HttpHeaders headers = new HttpHeaders();
         
         Iterator<String> fieldNames = jsonNode.fieldNames();
         while (fieldNames.hasNext()) {
        	 String key = fieldNames.next();
            headers.add(key, jsonNode.get(key).textValue());
         }
         
       return headers;
	}

}
