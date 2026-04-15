package com.jio.cwms.onboard.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.config.MongoConnectionConfig;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.model.ApplicationMasterEntity;
import com.jio.cwms.onboard.model.ParameterMaster;
import com.jio.cwms_soap.pojo.GetPositionCount;
import com.mongodb.MongoException;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.AggregateIterable;

/**
 * Comprehensive Unit Tests for MongoPositionFetch
 * 
 * Coverage includes:
 * - getCandidateOnboardPositionDetails() method
 * - All validation scenarios
 * - All exception scenarios
 * - Edge cases
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MongoPositionFetch Unit Tests")
class MongoPositionFetchTest {

    @Mock
    private MongoConnectionConfig mongoConnectionConfig;

    @Mock
    private MongoDatabase mongoDatabase;

    @Mock
    private MongoCollection<Document> mongoCollection;

    @Mock
    private AggregateIterable<Document> aggregateIterable;

    @InjectMocks
    private MongoPositionFetch mongoPositionFetch;

    private GetPositionCount getPositionCount;
    private ApplicationMasterEntity applicationMasterEntity;
    private ParameterMaster parameterMaster;

    @BeforeEach
    void setUp() {
        // Setup GetPositionCount with pagination
        getPositionCount = new GetPositionCount();
        GetPositionCount.PaginationDetails paginationDetails = new GetPositionCount.PaginationDetails();
        paginationDetails.setPageNumber(1);
        paginationDetails.setPageSize(10);
        getPositionCount.setPaginationDetails(paginationDetails);

        // Setup ApplicationMasterEntity
        applicationMasterEntity = new ApplicationMasterEntity();
        applicationMasterEntity.setDam_tablename("test_collection");

        // Setup ParameterMaster
        parameterMaster = new ParameterMaster();
        parameterMaster.setValue("test_org_id");
    }

    // ==================== getCandidateOnboardPositionDetails() Tests ====================

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should successfully fetch position details")
    void testGetCandidateOnboardPositionDetails_Success() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);

            List<Document> mockDocuments = new ArrayList<>();
            Document doc = new Document("positionName", "Test Position");
            mockDocuments.add(doc);

            when(mongoCollection.aggregate(anyList())).thenReturn(aggregateIterable);
            when(aggregateIterable.into(anyList())).thenAnswer(invocation -> {
                List<Document> list = invocation.getArgument(0);
                list.addAll(mockDocuments);
                return list;
            });

            // Act
            var result = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getGetPositionCountResult());
            assertTrue(result.getGetPositionCountResult().contains("<NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("</NewDataSet>"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should throw SoapValidationException for null collection name")
    void testGetCandidateOnboardPositionDetails_NullCollectionName() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            ApplicationMasterEntity entityWithNullName = new ApplicationMasterEntity();
            entityWithNullName.setDam_tablename(null);
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(entityWithNullName);

            // Act & Assert
            SoapValidationException exception = assertThrows(SoapValidationException.class,
                    () -> mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount));
            assertTrue(exception.getMessage().contains("Collection name is not configured"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should throw SoapValidationException for empty collection name")
    void testGetCandidateOnboardPositionDetails_EmptyCollectionName() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            ApplicationMasterEntity entityWithEmptyName = new ApplicationMasterEntity();
            entityWithEmptyName.setDam_tablename("");
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(entityWithEmptyName);

            // Act & Assert
            SoapValidationException exception = assertThrows(SoapValidationException.class,
                    () -> mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount));
            assertTrue(exception.getMessage().contains("Collection name is not configured"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should throw SoapValidationException for blank collection name")
    void testGetCandidateOnboardPositionDetails_BlankCollectionName() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            ApplicationMasterEntity entityWithBlankName = new ApplicationMasterEntity();
            entityWithBlankName.setDam_tablename("   ");
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(entityWithBlankName);

            // Act & Assert
            SoapValidationException exception = assertThrows(SoapValidationException.class,
                    () -> mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount));
            assertTrue(exception.getMessage().contains("Collection name is not configured"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should throw SoapValidationException for null mongoConnectionConfig")
    void testGetCandidateOnboardPositionDetails_NullMongoConnectionConfig() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);

            // Use ReflectionTestUtils to set mongoConnectionConfig to null
            org.springframework.test.util.ReflectionTestUtils.setField(mongoPositionFetch, "mongoConnectionConfig", null);

            // Act & Assert
            SoapValidationException exception = assertThrows(SoapValidationException.class,
                    () -> mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount));
            assertTrue(exception.getMessage().contains("MongoDB connection not available"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should throw SoapValidationException for null mongoDatabase")
    void testGetCandidateOnboardPositionDetails_NullMongoDatabase() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(null);

            // Act & Assert
            SoapValidationException exception = assertThrows(SoapValidationException.class,
                    () -> mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount));
            assertTrue(exception.getMessage().contains("MongoDB connection not available"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should throw SoapValidationException for null collection")
    void testGetCandidateOnboardPositionDetails_NullCollection() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(null);

            // Act & Assert
            SoapValidationException exception = assertThrows(SoapValidationException.class,
                    () -> mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount));
            assertTrue(exception.getMessage().contains("MongoDB collection not found"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should throw SoapValidationException for MongoException")
    void testGetCandidateOnboardPositionDetails_MongoException() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);
            when(mongoCollection.aggregate(anyList())).thenThrow(new MongoException("Database connection failed"));

            // Act & Assert
            SoapValidationException exception = assertThrows(SoapValidationException.class,
                    () -> mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount));
            assertTrue(exception.getMessage().contains("Upstream API down"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should rethrow SoapValidationException")
    void testGetCandidateOnboardPositionDetails_RethrowSoapValidationException() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);
            
            SoapValidationException validationException = new SoapValidationException("Validation error");
            when(mongoCollection.aggregate(anyList())).thenThrow(validationException);

            // Act & Assert
            SoapValidationException exception = assertThrows(SoapValidationException.class,
                    () -> mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount));
            assertEquals("Validation error", exception.getMessage());
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should handle generic exception and return error XML")
    void testGetCandidateOnboardPositionDetails_GenericException() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);
            when(mongoCollection.aggregate(anyList())).thenThrow(new RuntimeException("Unexpected error"));

            // Act
            var result = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getGetPositionCountResult());
            assertTrue(result.getGetPositionCountResult().contains("<Error>"));
            assertTrue(result.getGetPositionCountResult().contains("Unable to fetch data from Mongo"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should handle empty result set")
    void testGetCandidateOnboardPositionDetails_EmptyResultSet() {
        // Arrange
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);

            List<Document> emptyDocuments = new ArrayList<>();
            when(mongoCollection.aggregate(anyList())).thenReturn(aggregateIterable);
            when(aggregateIterable.into(anyList())).thenAnswer(invocation -> {
                List<Document> list = invocation.getArgument(0);
                list.addAll(emptyDocuments);
                return list;
            });

            // Act
            var result = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getGetPositionCountResult());
            assertTrue(result.getGetPositionCountResult().contains("<NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("</NewDataSet>"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should handle document with positiondetail List")
    void testGetCandidateOnboardPositionDetails_WithPositionDetailList() {
        // Arrange - Covers lines 170-177 (positiondetail key with List value)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);

            List<Document> mockDocuments = new ArrayList<>();
            Document positionDetailDoc = new Document("positionCode", "PC001")
                    .append("positionName", "Test Position")
                    .append("isActive", true);
            
            List<Document> positionDetailList = new ArrayList<>();
            positionDetailList.add(positionDetailDoc);
            
            Document doc = new Document("positionName", "Main Position")
                    .append("positiondetail", positionDetailList);
            mockDocuments.add(doc);

            when(mongoCollection.aggregate(anyList())).thenReturn(aggregateIterable);
            when(aggregateIterable.into(anyList())).thenAnswer(invocation -> {
                List<Document> list = invocation.getArgument(0);
                list.addAll(mockDocuments);
                return list;
            });

            // Act
            var result = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getGetPositionCountResult());
            assertTrue(result.getGetPositionCountResult().contains("<NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("</NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("<positiondetail>"));
            assertTrue(result.getGetPositionCountResult().contains("</positiondetail>"));
            assertTrue(result.getGetPositionCountResult().contains("positionCode"));
            assertTrue(result.getGetPositionCountResult().contains("PC001"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should handle document with nested Document value")
    void testGetCandidateOnboardPositionDetails_WithNestedDocument() {
        // Arrange - Covers lines 178-181 (value is Document) and lines 193-201 (appendNestedDocument)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);

            List<Document> mockDocuments = new ArrayList<>();
            Document nestedDoc = new Document("nestedKey1", "nestedValue1")
                    .append("nestedKey2", "nestedValue2");
            
            Document doc = new Document("positionName", "Test Position")
                    .append("nestedData", nestedDoc)
                    .append("simpleField", "simpleValue");
            mockDocuments.add(doc);

            when(mongoCollection.aggregate(anyList())).thenReturn(aggregateIterable);
            when(aggregateIterable.into(anyList())).thenAnswer(invocation -> {
                List<Document> list = invocation.getArgument(0);
                list.addAll(mockDocuments);
                return list;
            });

            // Act
            var result = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getGetPositionCountResult());
            assertTrue(result.getGetPositionCountResult().contains("<NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("</NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("<nestedData>"));
            assertTrue(result.getGetPositionCountResult().contains("</nestedData>"));
            assertTrue(result.getGetPositionCountResult().contains("nestedKey1"));
            assertTrue(result.getGetPositionCountResult().contains("nestedValue1"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should handle document with simple value types")
    void testGetCandidateOnboardPositionDetails_WithSimpleValues() {
        // Arrange - Covers lines 182-186 (else branch - simple value types)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);

            List<Document> mockDocuments = new ArrayList<>();
            Document doc = new Document("positionName", "Test Position")
                    .append("positionCode", "PC001")
                    .append("count", 10)
                    .append("isActive", true)
                    .append("nullField", null)
                    .append("emptyString", "");
            mockDocuments.add(doc);

            when(mongoCollection.aggregate(anyList())).thenReturn(aggregateIterable);
            when(aggregateIterable.into(anyList())).thenAnswer(invocation -> {
                List<Document> list = invocation.getArgument(0);
                list.addAll(mockDocuments);
                return list;
            });

            // Act
            var result = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getGetPositionCountResult());
            assertTrue(result.getGetPositionCountResult().contains("<NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("</NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("<positionName>"));
            assertTrue(result.getGetPositionCountResult().contains("Test Position"));
            assertTrue(result.getGetPositionCountResult().contains("<positionCode>"));
            assertTrue(result.getGetPositionCountResult().contains("PC001"));
            assertTrue(result.getGetPositionCountResult().contains("<count>"));
            assertTrue(result.getGetPositionCountResult().contains("10"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should handle document with mixed value types")
    void testGetCandidateOnboardPositionDetails_WithMixedValueTypes() {
        // Arrange - Covers all branches: positiondetail List, nested Document, and simple values
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);

            List<Document> mockDocuments = new ArrayList<>();
            
            // Create positiondetail list
            Document positionDetailDoc1 = new Document("code", "PD001").append("name", "Detail 1");
            Document positionDetailDoc2 = new Document("code", "PD002").append("name", "Detail 2");
            List<Document> positionDetailList = new ArrayList<>();
            positionDetailList.add(positionDetailDoc1);
            positionDetailList.add(positionDetailDoc2);
            
            // Create nested document
            Document nestedDoc = new Document("nestedKey", "nestedValue");
            
            // Create main document with all types
            Document doc = new Document("positionName", "Test Position")
                    .append("positiondetail", positionDetailList)  // List value
                    .append("nestedData", nestedDoc)                // Document value
                    .append("simpleString", "simpleValue")          // Simple value
                    .append("simpleNumber", 100)                    // Simple value
                    .append("nullValue", null);                     // Null value
            mockDocuments.add(doc);

            when(mongoCollection.aggregate(anyList())).thenReturn(aggregateIterable);
            when(aggregateIterable.into(anyList())).thenAnswer(invocation -> {
                List<Document> list = invocation.getArgument(0);
                list.addAll(mockDocuments);
                return list;
            });

            // Act
            var result = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getGetPositionCountResult());
            assertTrue(result.getGetPositionCountResult().contains("<NewDataSet>"));
            assertTrue(result.getGetPositionCountResult().contains("</NewDataSet>"));
            // Verify positiondetail List is processed
            assertTrue(result.getGetPositionCountResult().contains("<positiondetail>"));
            assertTrue(result.getGetPositionCountResult().contains("PD001"));
            assertTrue(result.getGetPositionCountResult().contains("PD002"));
            // Verify nested Document is processed
            assertTrue(result.getGetPositionCountResult().contains("<nestedData>"));
            assertTrue(result.getGetPositionCountResult().contains("nestedKey"));
            // Verify simple values are processed
            assertTrue(result.getGetPositionCountResult().contains("<simpleString>"));
            assertTrue(result.getGetPositionCountResult().contains("simpleValue"));
            assertTrue(result.getGetPositionCountResult().contains("<simpleNumber>"));
            assertTrue(result.getGetPositionCountResult().contains("100"));
        }
    }

    @Test
    @DisplayName("getCandidateOnboardPositionDetails - Should handle positiondetail List with non-Document items")
    void testGetCandidateOnboardPositionDetails_PositionDetailListWithNonDocumentItems() {
        // Arrange - Tests the case where positiondetail List contains non-Document items (line 172 check)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getMongoCollection).thenReturn(applicationMasterEntity);
            mockedApplicationConfig.when(ApplicationConfig::getMongoParameterMaster).thenReturn(parameterMaster);

            when(mongoConnectionConfig.getMongoDatabase()).thenReturn(mongoDatabase);
            when(mongoDatabase.getCollection(anyString())).thenReturn(mongoCollection);

            List<Document> mockDocuments = new ArrayList<>();
            
            // Create positiondetail list with mixed types (Document and String)
            Document positionDetailDoc = new Document("code", "PD001");
            List<Object> positionDetailList = new ArrayList<>();
            positionDetailList.add(positionDetailDoc);  // Document item
            positionDetailList.add("StringItem");       // Non-Document item (should be skipped)
            positionDetailList.add(123);                // Non-Document item (should be skipped)
            
            Document doc = new Document("positionName", "Test Position")
                    .append("positiondetail", positionDetailList);
            mockDocuments.add(doc);

            when(mongoCollection.aggregate(anyList())).thenReturn(aggregateIterable);
            when(aggregateIterable.into(anyList())).thenAnswer(invocation -> {
                List<Document> list = invocation.getArgument(0);
                list.addAll(mockDocuments);
                return list;
            });

            // Act
            var result = mongoPositionFetch.getCandidateOnboardPositionDetails(getPositionCount);

            // Assert
            assertNotNull(result);
            assertNotNull(result.getGetPositionCountResult());
            assertTrue(result.getGetPositionCountResult().contains("<positiondetail>"));
            assertTrue(result.getGetPositionCountResult().contains("PD001"));
            // Non-Document items should not appear in XML
            assertFalse(result.getGetPositionCountResult().contains("StringItem"));
        }
    }
}
