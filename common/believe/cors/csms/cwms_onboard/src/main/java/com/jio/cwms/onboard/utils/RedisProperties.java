package com.jio.cwms.onboard.utils;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "redis")
public class RedisProperties {

	private String sentinelPassword;
    private String sentinelMaster;
    private String sentinelNodes;
    
}
