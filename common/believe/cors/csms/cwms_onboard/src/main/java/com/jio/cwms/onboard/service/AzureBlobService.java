package com.jio.cwms.onboard.service;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.Base64;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.sas.BlobSasPermission;
import com.azure.storage.blob.sas.BlobServiceSasSignatureValues;
import com.jio.cwms.onboard.wrapper.LogWrapper;

import jakarta.annotation.PostConstruct;

@Service
public class AzureBlobService {

	private static final Logger log = LogManager.getLogger(AzureBlobService.class);

	@Value("${app.config.azure.default-endpoint-protocol}")
	protected String defaultEndpointProtocol;

	@Value("${app.config.azure.account-name}")
	protected String accountName;

	@Value("${app.config.azure.account-key}")
	protected String accountKey;

	@Value("${app.config.azure.endpoint-suffix}")
	protected String endpointSuffix;

	@Value("${app.config.azure.blob-container-name}")
	protected String blobContainerName;
	
	@Value("${app.config.azure.blob-url-path}") 
	protected String urlName;
	
	protected String storageAccountURL;

	private String connectionString;

	@PostConstruct
	public void initialize() {
		storageAccountURL = "https://" + accountName + "." + endpointSuffix;
		connectionString = "DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=%s".formatted(accountName, accountKey, endpointSuffix);
	}

	protected String getDefaultEndpointProtocol() {
		return defaultEndpointProtocol;
	}

	protected String getAccountName() {
		return accountName;
	}

	protected String getAccountKey() {
		return accountKey;
	}

	protected String getEndpointSuffix() {
		return endpointSuffix;
	}

	protected String getBlobContainerName() {
		return blobContainerName;
	}

	public String pushImageToAzureBlobStorage(final String fileName, final String photo) {
		try  {
			final var blobServiceClient = new BlobServiceClientBuilder().connectionString(connectionString).buildClient();
			final var blobContainerClient = blobServiceClient.getBlobContainerClient(blobContainerName);

			final var blobClient = blobContainerClient.getBlobClient(fileName+".jpg");

			final var blobSasPermission = new BlobSasPermission();
			blobSasPermission.setReadPermission(true);
			blobSasPermission.setWritePermission(true);
			blobSasPermission.setCreatePermission(true);
			
			blobClient.generateSas(new BlobServiceSasSignatureValues(OffsetDateTime.now().plusDays(1L), blobSasPermission));

			blobClient.upload(new ByteArrayInputStream(Base64.getDecoder().decode(photo)),true);
			LogWrapper.info(AzureBlobService.class, "Uploaded blob image to azure blob container | Image Name:: " + fileName + 
            		" | Container Name:: " + blobContainerName);
			
			final var blobURL = "file/download/employee_profile_pictures/" + fileName + ".jpg";
				 
            LogWrapper.info(AzureBlobService.class,
            		"Generated blob image URL | Image Name:: " + fileName +
            		" Generated URL:: "+ blobURL);
			return blobURL;
		} catch (final Exception e) {

			LogWrapper.error(AzureBlobService.class,
					"Exception occurred while uploading file to blob storage | Filename:: " + fileName +
					" | Exception:: " + e.getClass().getCanonicalName() +
			        " | Message:: " + ExceptionUtils.getMessage(e) +
			        " | Cause:: " + ExceptionUtils.getRootCauseMessage(e));
					
		}
		return StringUtils.EMPTY;
	}

}
