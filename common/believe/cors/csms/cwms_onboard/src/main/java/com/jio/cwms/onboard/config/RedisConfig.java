package com.jio.cwms.onboard.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisClusterConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisNode;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.jio.cwms.onboard.utils.RedisProperties;


@Configuration
@EnableTransactionManagement
@PropertySource(value = { "classpath:application.properties" })
@EnableConfigurationProperties(RedisProperties.class)
public class RedisConfig {
	
	@Value("${spring.redis.lettuce.pool.max-active}")
	private int maxactive;

	@Value("${spring.redis.lettuce.pool.max-wait}")
	private int maxwait;
	
	@Value("${spring.redis.lettuce.pool.max-idle}")
	private int maxidle;
	
	@Value("${spring.redis.lettuce.pool.min-idle}")
	private int minidle;

	@Value("${spring.redis.lettuce.pool.test-while-idle}")
	private boolean testwhileidle;

	@Value("${spring.redis.lettuce.pool.time-between-eviction-runs-millis}")
	private int timebetweenevictionrunsmillis;

	@Value("${spring.redis.lettuce.pool.min-evictable-idle-time-millis}")
	private int minevictableidletimemillis;
	
	@Autowired
	private RedisProperties redisProperties;
	
	
	@Bean
	public RedisCacheConfiguration cacheConfiguration() {
		RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
				.entryTtl(Duration.ofSeconds(600)).disableCachingNullValues();
		return cacheConfig;
	}
	
	@Bean
	public RedisCacheManager cacheManager() {
		RedisCacheManager rcm = RedisCacheManager.builder(redisConnectionFactory()).cacheDefaults(cacheConfiguration())
				.transactionAware().build();
		return rcm;
	}
	
	private RedisClusterConfiguration clusterConfig() {
		RedisClusterConfiguration clusterConfig = new RedisClusterConfiguration();
		String[] sentinels = redisProperties.getSentinelNodes().toString().split("\\|");
		List<RedisNode> list = new ArrayList<RedisNode>();
		for (String sentinel : sentinels) {
			String[] nodes = sentinel.split(":");
			list.add(new RedisNode(nodes[0], Integer.parseInt(nodes[1])));
		}
		clusterConfig.setClusterNodes(list);
		clusterConfig.setPassword(RedisPassword.of(redisProperties.getSentinelPassword()));
		return clusterConfig;
	}
	
	
	@SuppressWarnings("deprecation")
	@Bean
	public LettuceConnectionFactory redisConnectionFactory() {
		
		
		GenericObjectPoolConfig genericObjectPoolConfig = new GenericObjectPoolConfig();
		genericObjectPoolConfig.setMaxIdle(maxidle);
		genericObjectPoolConfig.setMinIdle(minidle);
		genericObjectPoolConfig.setMaxTotal(maxactive);
		genericObjectPoolConfig.setMaxWaitMillis(maxwait);
		genericObjectPoolConfig.setTestWhileIdle(testwhileidle);
		genericObjectPoolConfig.setMinEvictableIdleTimeMillis(minevictableidletimemillis);
		genericObjectPoolConfig.setTimeBetweenEvictionRunsMillis(timebetweenevictionrunsmillis);
//		LettuceClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
//			   								   	.clientName("notification")
//			   								   	.commandTimeout(Duration.ofMillis(6000))
//			   								   	.poolConfig(genericObjectPoolConfig)
//			   								   	.build();
		LettuceConnectionFactory redisConf = new LettuceConnectionFactory(clusterConfig());
		redisConf.setShareNativeConnection(false);
		return redisConf;
	}
	
	@Bean
	@ConditionalOnMissingBean(name = "redisTemplate")
	@Primary
	public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
		RedisTemplate<Object, Object> template = new RedisTemplate<Object, Object>();
		template.setConnectionFactory(redisConnectionFactory);
		template.setConnectionFactory(redisConnectionFactory);
		template.setKeySerializer(new StringRedisSerializer());
		template.setValueSerializer(new StringRedisSerializer());
		template.setHashValueSerializer(new StringRedisSerializer());
		template.setHashKeySerializer(new StringRedisSerializer());
		return template;
	}
}
