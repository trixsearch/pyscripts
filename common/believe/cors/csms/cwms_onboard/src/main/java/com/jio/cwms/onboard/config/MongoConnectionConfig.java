package com.jio.cwms.onboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.jio.cwms.onboard.model.ApplicationMasterEntity;
import com.jio.cwms.onboard.wrapper.LogWrapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

@Configuration
public class MongoConnectionConfig {
	
	private MongoClient mongoClient;
	
	@Bean
    public MongoClient getMongoClient() {
        if (mongoClient == null) {
            ApplicationMasterEntity mongoConnectionDetails = ApplicationConfig.getMongoCollection();
            String mongoUrl = mongoConnectionDetails.getDamserverIpUrl();
            
            LogWrapper.info(getClass(), "Initializing Mongo Client with URL: " + mongoUrl);
            
            mongoClient = MongoClients.create(mongoUrl);
        }
        return mongoClient;
    }
	
		// Get the database
	 	@Bean
	    public MongoDatabase getMongoDatabase() {
	        ApplicationMasterEntity mongoConnectionDetails = ApplicationConfig.getMongoCollection();
	        String databaseName = mongoConnectionDetails.getDamDbname(); //"prod-ril-integration-service-db"; "sit-ril-integration-service-db";  
	        
	        LogWrapper.info(getClass(), "Connecting to Database: " + databaseName);
	     
	        return getMongoClient().getDatabase(databaseName);
	    }

}
