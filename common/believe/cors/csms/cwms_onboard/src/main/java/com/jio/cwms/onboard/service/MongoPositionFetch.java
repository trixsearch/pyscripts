package com.jio.cwms.onboard.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.config.MongoConnectionConfig;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.model.ApplicationMasterEntity;
import com.jio.cwms.onboard.model.ParameterMaster;
import com.jio.cwms.onboard.wrapper.LogWrapper;
import com.jio.cwms_soap.pojo.GetPositionCount;
import com.jio.cwms_soap.pojo.GetPositionCountResponse;
import com.mongodb.MongoException;
import com.mongodb.client.MongoCollection;

@Service
public class MongoPositionFetch {
	 
		@Autowired
		MongoConnectionConfig mongoConnectionConfig;
		
		public GetPositionCountResponse getCandidateOnboardPositionDetails(GetPositionCount getPositionCount) {
			
			ApplicationMasterEntity mongoConnectionDetails = ApplicationConfig.getMongoCollection();
			GetPositionCountResponse response = new GetPositionCountResponse();
			
			// Collection Name
			String collectionName = mongoConnectionDetails.getDam_tablename();
		
			LogWrapper.info(getClass(), "Fetching data from collection: " + collectionName);
			
			if (collectionName == null || collectionName.isBlank()) {
				LogWrapper.error(getClass(), "Collection name is null or empty");
				throw new SoapValidationException("Collection name is not configured");
			}
			
			StringBuilder xmlBuilder = new StringBuilder();
						  xmlBuilder.append("<NewDataSet>");
						  
			 	
			  int pageNumber = getPositionCount.getPaginationDetails().getPageNumber();
			  int pageSize = getPositionCount.getPaginationDetails().getPageSize();
			  
			try {
				// Validate MongoDB connection
				if (mongoConnectionConfig == null || mongoConnectionConfig.getMongoDatabase() == null) {
					LogWrapper.error(getClass(), "MongoDB connection not available");
					throw new SoapValidationException("MongoDB connection not available");
				}
				
				// Get the collection
				MongoCollection<Document> collection =  mongoConnectionConfig.getMongoDatabase().getCollection(collectionName);
				if (collection == null) {
					LogWrapper.error(getClass(), "MongoDB collection not found: " + collectionName);
					throw new SoapValidationException("MongoDB collection not found: " + collectionName);
				} 
				
				// Fetch data with optional date filtering (if filters are provided)
				List<Document> candidateOnboardPositionData = fetchFliteredData(collection, pageNumber, pageSize, getPositionCount);
			
				
				// Build XML from MongoDB documents
				// Build dynamic XML from MongoDB documents
				buildXmlFromDocuments(xmlBuilder, candidateOnboardPositionData);

				xmlBuilder.append("</NewDataSet>");

//				LogWrapper.info(getClass(), "Generated XML response from Mongo :: " + xmlBuilder.toString());
	 
	 
			} catch (MongoException e) {
				LogWrapper.error(getClass(), "Database connection failed. Not able to access data from Mongo :: " + e.getMessage());
				throw new SoapValidationException("Upstream API down. Please try again after sometime");
			} catch (SoapValidationException e) {
				LogWrapper.error(getClass(), "Validation error occurred while fetching data from Mongo :: " + e.getMessage());
				throw e;
			} catch (Exception e) {
				LogWrapper.error(getClass(), "Not able to access data from Mongo :: " + e.getMessage(), e);
				xmlBuilder = new StringBuilder("<NewDataSet><Error>Unable to fetch data from Mongo: " + e.getMessage() + "</Error></NewDataSet>");
			}
			
				response.setGetPositionCountResult(xmlBuilder.toString());
		    
			return response;
	 
		}
		

		// Create query filter with optional date filtering
			private List<Document> fetchFliteredData(MongoCollection<Document> collection, int pageNumber, int pageSize, GetPositionCount getPositionCount){
				ParameterMaster orgDetails = ApplicationConfig.getMongoParameterMaster();
				List<Document> candidateOnboardPositionData = new ArrayList<>();
				
				int skip = (pageNumber - 1) * pageSize;
				
				// Check if date filtering is needed
				boolean hasDateFilter = getPositionCount.getFilters() != null;
				Date startDateUTC = null;
				Date endDateUTC = null;
				
				if (hasDateFilter) {
					// Convert IST dates to UTC Date objects
					String startDateStr = getPositionCount.getFilters().getStartDate();
					String endDateStr = getPositionCount.getFilters().getEndDate();
					
					if (endDateStr == null || endDateStr.trim().isEmpty()) {
						// If endDate is not provided, range is from start of day (00:00:00 IST) to startDate
						DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
						LocalDateTime startDateTimeIST = LocalDateTime.parse(startDateStr.trim(), formatter);
						LocalDateTime startOfDayIST = startDateTimeIST.toLocalDate().atStartOfDay();
						
						// Convert start of day IST to UTC
						startDateUTC = convertISTToUTCDate(startOfDayIST.format(formatter));
						// Convert startDate IST to UTC (this is the end of the range)
						endDateUTC = convertISTToUTCDate(startDateStr);
						
						LogWrapper.info(getClass(), String.format("Only startDate provided. Range: %s (start of day IST) to %s (startDate IST)", 
								startOfDayIST.format(formatter), startDateTimeIST.format(formatter)));
					} else {
						startDateUTC = convertISTToUTCDate(startDateStr);
						endDateUTC = convertISTToUTCDate(endDateStr);
					}
					
					LogWrapper.info(getClass(), String.format("Date filtering: StartDate UTC: %s, EndDate UTC: %s", startDateUTC, endDateUTC));
				} else {
					LogWrapper.info(getClass(), "No date filters provided, using regular query");
				}
				
				List<Document> pipeline = new ArrayList<>();
				
				// Initial match for isActive and orgId
				pipeline.add(new Document("$match", new Document("isActive", true)
						.append("orgId", orgDetails.getValue())));
				
				// Add date filter stage if date filtering is enabled
				if (hasDateFilter) {
					pipeline.add(buildDateFilterStageForType2(startDateUTC, endDateUTC));
				}
				
				// Build lookup pipeline
				List<Document> lookupPipeline = new ArrayList<>();
				
				// Match conditions for lookup collection
				lookupPipeline.add(new Document("$match", new Document("$expr",
						new Document("$and", List.of(
								new Document("$eq", List.of("$positionsName", "$$posName")),
								new Document("$eq", List.of("$isActive", true)),
								new Document("$eq", List.of("$isAvailable", true)),
								new Document("$eq", List.of("$candidateId", "")),
								new Document("$eq", List.of("$employeeId", "")),
								new Document("$eq", List.of("$empId", ""))
						))
				)));
				
				// Add date filter stage for lookup collection if date filtering is enabled
				if (hasDateFilter) {
					lookupPipeline.add(buildDateFilterStageForLookup(startDateUTC, endDateUTC));
				}
				
				pipeline.add(new Document("$lookup", new Document()
						.append("from", "candidate_onboard_position_codes")
						.append("let", new Document("posName", "$positionsName"))
						.append("pipeline", lookupPipeline)
						.append("as", "positiondetail")));
				
				// Sort stage
				pipeline.add(new Document("$sort", new Document("createdOn", -1)));
				
				// Skip and limit stages
				pipeline.add(new Document("$skip", skip));
				pipeline.add(new Document("$limit", pageSize));
				
				List<Document> joinedDocuments = collection.aggregate(pipeline).into(new ArrayList<>());
				String logMessage = hasDateFilter ? 
						"Total documents fetched from date-filtered aggregation: " : 
						"Total documents fetched from aggregation: ";
				LogWrapper.info(getClass(), logMessage + joinedDocuments.size());
				
				// Log positionCodeId grouped by positionsName
				logPositionCodeIdsByPositionName(joinedDocuments);
				
				candidateOnboardPositionData.addAll(joinedDocuments);
				
				LogWrapper.info(getClass(), logMessage + candidateOnboardPositionData.size());
				return candidateOnboardPositionData;
			}
			
			private void buildXmlFromDocuments(StringBuilder xmlBuilder, List<Document> candidateOnboardPositionData) {
			   
			    for (Document doc : candidateOnboardPositionData) {
			        xmlBuilder.append("<Table>");
			        for (Map.Entry<String, Object> entry : doc.entrySet()) {
			            String key = entry.getKey();
			            Object value = entry.getValue();

			            if ("positiondetail".equals(key) && value instanceof List) {
			                for (Object item : (List<?>) value) {
			                    if (item instanceof Document) {
			                        xmlBuilder.append("<positiondetail>");
			                        appendNestedDocument(xmlBuilder, (Document) item);
			                        xmlBuilder.append("</positiondetail>");
			                    }
			                }
			            } else if (value instanceof Document) {
			                xmlBuilder.append("<").append(key).append(">");
			                appendNestedDocument(xmlBuilder, (Document) value);
			                xmlBuilder.append("</").append(key).append(">");
			            } else {
			                xmlBuilder.append("<").append(key).append(">")
			                          .append(value != null ? value.toString() : "")
			                          .append("</").append(key).append(">");
			            }
			        }
			        xmlBuilder.append("</Table>");
			    }
			}

			
			private void appendNestedDocument(StringBuilder xmlBuilder, Document doc) {
			    for (Map.Entry<String, Object> entry : doc.entrySet()) {
			        String key = entry.getKey();
			        Object value = entry.getValue();
			        xmlBuilder.append("<").append(key).append(">")
			                  .append(value != null ? value.toString() : "")
			                  .append("</").append(key).append(">");
			    }
			}
			
		private Date convertISTToUTCDate(String istDateTimeStr) {
			DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
			LocalDateTime localDateTime = LocalDateTime.parse(istDateTimeStr.trim(), formatter);
			
			ZoneId istZone = ZoneId.of("Asia/Kolkata");
			ZoneId utcZone = ZoneId.of("UTC");
			ZonedDateTime istZoned = localDateTime.atZone(istZone);
			ZonedDateTime utcZoned = istZoned.withZoneSameInstant(utcZone);
			
			return Date.from(utcZoned.toInstant());
		}
		
		private Document buildDateFilterStageForType2(Date startDateUTC, Date endDateUTC) {
			// Build date filter that checks both createdOn and updatedOn Date fields
			
			List<Document> dateConditions = new ArrayList<>();
			
			// Condition for createdOn field
			Document createdOnCondition = new Document("$and", List.of(
					new Document("createdOn", new Document("$exists", true)),
					new Document("createdOn", new Document("$gte", startDateUTC).append("$lte", endDateUTC))
			));
			
			dateConditions.add(createdOnCondition);
			
			// Condition for updatedOn field
			Document updatedOnCondition = new Document("$and", List.of(
					new Document("updatedOn", new Document("$exists", true)),
					new Document("updatedOn", new Document("$gte", startDateUTC).append("$lte", endDateUTC))
			));
			
			dateConditions.add(updatedOnCondition);
			
			// Return match stage with $or condition (either createdOn OR updatedOn matches)
			return new Document("$match", new Document("$or", dateConditions));
		}
		
		private Document buildDateFilterStageForLookup(Date startDateUTC, Date endDateUTC) {
			// Build date filter for lookup collection (candidate_onboard_position_codes)
			// Checks both createdOn and updatedOn Date fields
			
			List<Document> dateConditions = new ArrayList<>();
			
			// Condition for createdOn field
			Document createdOnCondition = new Document("$and", List.of(
					new Document("createdOn", new Document("$exists", true)),
					new Document("createdOn", new Document("$gte", startDateUTC).append("$lte", endDateUTC))
			));
			
			dateConditions.add(createdOnCondition);
			
			// Condition for updatedOn field
			Document updatedOnCondition = new Document("$and", List.of(
					new Document("updatedOn", new Document("$exists", true)),
					new Document("updatedOn", new Document("$gte", startDateUTC).append("$lte", endDateUTC))
			));
			
			dateConditions.add(updatedOnCondition);
			
			// Return match stage with $or condition (either createdOn OR updatedOn matches)
			return new Document("$match", new Document("$or", dateConditions));
		}
		
		private void logPositionCodeIdsByPositionName(List<Document> joinedDocuments) {
			// Map to store positionCodeIds grouped by positionsName
			Map<String, List<String>> positionCodeMap = new HashMap<>();
			
			for (Document doc : joinedDocuments) {
				String positionsName = doc.getString("positionsName");
				if (positionsName == null) {
					positionsName = "null";
				}
				
				// Get positiondetail array
				Object positionDetailObj = doc.get("positiondetail");
				if (positionDetailObj instanceof List) {
					@SuppressWarnings("unchecked")
					List<Document> positionDetails = (List<Document>) positionDetailObj;
					
					for (Document positionDetail : positionDetails) {
						String positionCodeId = positionDetail.getString("positionCodeId");
						if (positionCodeId != null) {
							positionCodeMap.computeIfAbsent(positionsName, k -> new ArrayList<>()).add(positionCodeId);
						}
					}
				}
			}
			
			// Log the grouped positionCodeIds
			if (positionCodeMap.isEmpty()) {
				LogWrapper.info(getClass(), "No positionCodeIds found in the results");
				System.out.println("No positionCodeIds found in the results");
			} else {
				StringBuilder logMessage = new StringBuilder("PositionCodeIds grouped by PositionsName:\n");
				
				for (Map.Entry<String, List<String>> entry : positionCodeMap.entrySet()) {
					String positionsName = entry.getKey();
					List<String> positionCodeIds = entry.getValue();
					
					logMessage.append("  PositionsName: ").append(positionsName)
							.append(" -> PositionCodeIds: ").append(String.join(", ", positionCodeIds))
							.append(" (Count: ").append(positionCodeIds.size()).append(")\n");
					
				}
				
				 LogWrapper.info(getClass(), logMessage.toString());
			}
		}
			
	}
