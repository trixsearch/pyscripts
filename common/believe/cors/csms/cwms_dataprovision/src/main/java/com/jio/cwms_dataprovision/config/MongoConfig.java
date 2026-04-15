package com.jio.cwms_dataprovision.config;

import static com.mongodb.client.model.Filters.eq;

import java.util.List;

import org.bson.Document;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

@Configuration
public class MongoConfig {

	@Autowired
	private ApplicationConfig applicationConfig;

	@Autowired
	ObjectMapper objectMapper;

	public String getSiteIdFromMongo(String uuid) {
		JSONObject obj = new JSONObject(applicationConfig.getO2cApp().getDamSiteService());
		// Connection String
		String mongoUrl = obj.getString("mongoUrl");

		// Database Name
		String databaseName = obj.getString("databaseName");

		// Collection Name
		String collectionName = obj.getString("collectionName");
		
		LogWrapper.info(getClass(), "Mongo url : "+mongoUrl+" : Database : "+databaseName+" : Collection : "+collectionName);

		String name = "";

		try (MongoClient mongoClient = MongoClients.create(mongoUrl)) {
			// Get the database
			MongoDatabase database = mongoClient.getDatabase(databaseName);

			// Get the collection
			MongoCollection<Document> collection = database.getCollection(collectionName);

			// Example ObjectId for searching
			// ObjectId objectId = new ObjectId(uuid);


			// Find document by ID
			Document document = collection.find(eq("uuid", uuid)).first();
			
			String documentString = objectMapper.writeValueAsString(document);

			LogWrapper.info(getClass(), "Fetched document from Mongo :: " + documentString);

			// name = document.getString("name");

			JSONObject jsonObject = new JSONObject(documentString);
	        JSONArray jsonArray = jsonObject.getJSONArray("parents");
	        
			for (int i = 0; i < jsonArray.length(); i++) {
				JSONObject json = jsonArray.getJSONObject(i);
				if (json.getString("type").equals("Mfg Site")) {
					name = json.getString("name");
					LogWrapper.info(getClass(), "Site Id fetched from Mongo :: "+name);
					break;
				}
			}

			mongoClient.close();

		} catch (Exception e) {
			LogWrapper.error(getClass(), "Not able to access data from Mongo :: "+e.getMessage());
		}
		
	    return name;

	}
}
