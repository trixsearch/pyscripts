package com.jio.cwms.onboard.config;

import org.jasypt.encryption.StringEncryptor;
import org.jasypt.encryption.pbe.PooledPBEStringEncryptor;
import org.jasypt.encryption.pbe.config.SimpleStringPBEConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.ulisesbocchio.jasyptspringboot.annotation.EnableEncryptableProperties;

@EnableEncryptableProperties
@Configuration
public class JasyptConfig {

	public static SimpleStringPBEConfig getSimpleStringPBEConfig() {
		final var pbeConfig = new SimpleStringPBEConfig();
		pbeConfig.setPassword("J@sypt3nCryp7P@55w0rd");
		pbeConfig.setAlgorithm("PBEWithMD5AndDES");
		pbeConfig.setKeyObtentionIterations("1000");
		pbeConfig.setPoolSize("1");
		pbeConfig.setProviderName("SunJCE");
		pbeConfig.setSaltGeneratorClassName("org.jasypt.salt.RandomSaltGenerator");
		pbeConfig.setStringOutputType("base64");
		return pbeConfig;
	}

	@Bean(name = "jasyptStringEncryptor")
	public StringEncryptor encryptor() {
		final var pbeStringEncryptor = new PooledPBEStringEncryptor();
		pbeStringEncryptor.setConfig(JasyptConfig.getSimpleStringPBEConfig());
		return pbeStringEncryptor;
	}

}
