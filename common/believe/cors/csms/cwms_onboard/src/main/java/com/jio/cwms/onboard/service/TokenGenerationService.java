package com.jio.cwms.onboard.service;

import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.model.ApplicationMasterEntity;
import com.jio.cwms.onboard.wrapper.LogWrapper;
import com.jio.cwms_soap.pojo.GetToken;
import com.jio.cwms_soap.pojo.GetTokenResponse;

@Service
public class TokenGenerationService {

	
	public boolean validateTokenInput(GetToken tokenRequest) {
		
		ApplicationMasterEntity hotDbDetails = ApplicationConfig.getHotToken();
		String username = hotDbDetails.getDamUsername();
		String password = hotDbDetails.getDamPassword();
		if(StringUtils.equals(username, tokenRequest.getUsername()) && StringUtils.equals(password, tokenRequest.getPassword())) {
			LogWrapper.info(getClass(), "Username and Password Validated");
			return true;
		}else {
			LogWrapper.error(getClass(), "Username and Password Invalid");
			return false;
		}
		
	}
	
	public GetTokenResponse GenerateToken(GetToken tokenRequest) throws Exception {
		String token = "";
		GetTokenResponse tokenResponse = new GetTokenResponse();
		
		 boolean isValid = validateTokenInput(tokenRequest);
		if (isValid) {
		
		String keyStr = "kcobxRsRXxqgPJjP";
		byte[] key1 = keyStr.getBytes();
		SecretKey key = new SecretKeySpec(key1, 0, key1.length, "AES");
		
		String ivkey = "B9xAqc4H2TgPNn9j";
		byte[] IV = ivkey.getBytes();

		String encryptionToken = tokenRequest.getUsername()+"|"+ tokenRequest.getPassword()+"|"+(System.currentTimeMillis()+21600000);
//		LogWrapper.info(getClass(), "Token before encryption : " + encryptionToken);
		try {
			byte[] en = encrypt(encryptionToken.getBytes(), key, IV);
			System.out.println(Base64.getEncoder().encodeToString(en));
			
			token =  Base64.getEncoder().encodeToString(en);
			
		} catch (Exception e) {
			e.printStackTrace();
			LogWrapper.error(getClass(), "Token Generation Failed : " + e.getMessage());
		}
			
		 	tokenResponse.setToken(token);
		 
		 	return tokenResponse;
		 
		}else {
			
			throw new Exception("Username and Password Invalid");
			
		}
	}
	
	
	
	public static byte[] encrypt(byte[] plaintext, SecretKey key, byte[] IV) throws Exception
	{
		// Get Cipher Instance
		Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");

		// Create SecretKeySpec
		SecretKeySpec keySpec = new SecretKeySpec(key.getEncoded(), "AES");

		// Create IvParameterSpec
		IvParameterSpec ivSpec = new IvParameterSpec(IV);

		//Initialize Cipher for ENCRYPT_MODE
		cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);

		//Perform Encryption
		byte[] cipherText = cipher.doFinal(plaintext);

		return cipherText;
	}
}
