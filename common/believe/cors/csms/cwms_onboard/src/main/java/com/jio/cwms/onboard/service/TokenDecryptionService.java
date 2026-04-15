package com.jio.cwms.onboard.service;

import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import com.jio.cwms.onboard.dto.response.TokenResponse;
import com.jio.cwms.onboard.dto.response.ValidateTokenResponse;
import com.jio.cwms.onboard.exception.SoapUnauthorizedException;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.wrapper.LogWrapper;

@Service
public class TokenDecryptionService {

	@Autowired
	private RestTemplate restTemplate;

	
	public boolean tokenValidation(String headers){
		LogWrapper.info(getClass(), "tokenValidation Method started" );
		String decodedString = null;
		String keyStr = "kcobxRsRXxqgPJjP";
		byte[] key1 = keyStr.getBytes();
		SecretKey key = new SecretKeySpec(key1, 0, key1.length, "AES");
		String ivkey = "B9xAqc4H2TgPNn9j";
		byte[] IV = ivkey.getBytes();
		try {
			String encryptedToken = headers;                        //.getFirst("AuthToken")
			byte[] en = Base64.getDecoder().decode(encryptedToken);
			decodedString = decrypt(en, key, IV);
			
			if (decodedString == null || decodedString.isEmpty()) {
				LogWrapper.error(getClass(), "Decryption resulted in null or empty string");
				return false;
			}
			
			String subString = StringUtils.substringAfterLast(decodedString, "|");
			if (subString == null || subString.isEmpty()) {
				LogWrapper.error(getClass(), "Token timestamp not found in decoded string");
				return false;
			}
			
			try {
				Long tokentimeStamp = Long.valueOf(subString);
				boolean isvalid = tokentimeStamp > System.currentTimeMillis();
				LogWrapper.info(getClass(), "Token Requested time : "+ tokentimeStamp);
				return isvalid;
			} catch (NumberFormatException e) {
				LogWrapper.error(getClass(), "Invalid timestamp format in token: " + subString);
				return false;
			}
		} catch (Exception e) {
			LogWrapper.error(getClass(), "Exception during token validation: " + e.getMessage(), e);
			return false;
		}
	}
	
	private String decrypt (byte[] cipherText, SecretKey key,byte[] IV) throws Exception
    {
		LogWrapper.info(getClass(), "Decrypt method start");
        //Get Cipher Instance
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        //Create SecretKeySpec
        SecretKeySpec keySpec = new SecretKeySpec(key.getEncoded(), "AES");
        //Create IvParameterSpec
        IvParameterSpec ivSpec = new IvParameterSpec(IV);
        //Initialize Cipher for DECRYPT_MODE
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
        //Perform Decryption
        byte[] decryptedText = cipher.doFinal(cipherText);
        return new String(decryptedText);
    }
	
	//Implementation change
	public TokenResponse tokenValidation1(String clientId, String token,String clientIp) throws Exception {
	    LogWrapper.info(getClass(), "Starting token validation");

	    TokenResponse tokenResponse = new TokenResponse();
	    String url = "http://cwms-auth:8082/auth/v1.0/token/validate"; // Replace with actual URL 10.173.173.13:31002 instead of cwms-auth:8082

	    HttpHeaders headers = new HttpHeaders();
	    headers.add("clientId", clientId);
	    headers.add("Authorization", "Bearer " + token);
	    headers.add("X-Forwarded-For-CWMS", clientIp);

	    try {
	        LogWrapper.info(getClass(), "Sending request to token validation endpoint");
	        ResponseEntity<ValidateTokenResponse> response = restTemplate.exchange(
	            url,
	            HttpMethod.GET,
	            new HttpEntity<>(headers),
	            ValidateTokenResponse.class
	        );
	        
	        if(response.getBody().resource!=null)
	        {
	        	tokenResponse = response.getBody().resource;
		        LogWrapper.info(getClass(), "Token validation successful");
	        }
	        else
	        {
	        	LogWrapper.error(getClass(), "HTTP 401 Unauthorized during token validation: Response body or resource is null");
	            throw new SoapUnauthorizedException("Failed to Validate Token. Please Try Again");
	        }
	       
	        
	        
	    } catch (HttpClientErrorException httpEx) {
	        // Check for 401 Unauthorized specifically
	        if (httpEx.getStatusCode().value() == 401) {
	            LogWrapper.error(getClass(), "HTTP 401 Unauthorized during token validation: " + httpEx.getResponseBodyAsString());
	            throw new SoapUnauthorizedException("Failed to Validate Token. Please Try Again");
	        }
	        // Other client errors (4xx) should return 400 Bad Request
	        LogWrapper.error(getClass(), "HTTP client error during token validation: " + httpEx.getStatusCode() + " - " + httpEx.getResponseBodyAsString());
	        throw new SoapValidationException("Failed to validate token: " + httpEx.getMessage());
	    } catch (HttpServerErrorException httpEx) {
	        // Server errors (5xx) should return 500 Internal Server Error
	        LogWrapper.error(getClass(), "HTTP server error during token validation: " + httpEx.getStatusCode() + " - " + httpEx.getResponseBodyAsString());
	        throw new Exception("Token validation service error: " + httpEx.getMessage(), httpEx);
	    }
	    catch (SoapUnauthorizedException e) {
	        // Server errors (5xx) should return 500 Internal Server Error
	        LogWrapper.error(getClass(), "HTTP 401 Unauthorized during token validation: " + e.getMessage());
	        throw  e;
	    }
	    catch (Exception e) {
	        // For other exceptions during token validation, treat as validation error (400)
	        LogWrapper.error(getClass(), "Unexpected error during token validation: " + e.getMessage());
	        throw new SoapValidationException("An unexpected error occurred while validating the token: " + e.getMessage());
	    }

	    return tokenResponse;
	}
}
