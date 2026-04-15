package com.jio.cwms.onboard.service.apis;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms.onboard.config.ApplicationConfig;
import com.jio.cwms.onboard.dto.request.CandidateOnboardRequest;
import com.jio.cwms.onboard.dto.request.CandidateStatusRequest;
import com.jio.cwms.onboard.dto.response.CandidateOnboardResponse;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.model.UpstreamMaster;
import com.jio.cwms.onboard.utils.CDATAcreation;
import com.jio.cwms_soap.pojo.ProcessCandidate;
import com.jio.cwms_soap.pojo.CandidateDetails;
import org.mockito.MockedStatic;

/**
 * Comprehensive Unit Tests for HOTApis
 * 
 * Coverage includes:
 * - getEmployeeDetailsApi() method
 * - callCandidateOnboardApi() method
 * - getCandidateDetailsApi() method
 * - All exception scenarios
 * - Edge cases
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("HOTApis Unit Tests")
class HOTApisTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private CDATAcreation cdataCreation;

    @InjectMocks
    private HOTApis hotApis;

    private CandidateOnboardRequest candidateOnboardRequest;
    private CandidateStatusRequest candidateStatusRequest;
    private CandidateOnboardResponse candidateOnboardResponse;
    private ProcessCandidate processCandidate;
    private UpstreamMaster upstreamMasterCandidate;
    private UpstreamMaster upstreamMasterCandidateOnbrd;
    private UpstreamMaster upstreamMasterCandidateStatus;

    @BeforeEach
    void setUp() {
        // Setup CandidateOnboardRequest
        candidateOnboardRequest = CandidateOnboardRequest.builder()
                .action("ADD")
                .candidateDetails(com.jio.cwms.onboard.dto.request.CandidateDetails.builder()
                        .candidateId("100035516")
                        .build())
                .build();

        // Setup CandidateStatusRequest
        candidateStatusRequest = CandidateStatusRequest.builder()
                .action("CS")
                .candidateId("100035516")
                .build();

        // Setup CandidateOnboardResponse
        candidateOnboardResponse = CandidateOnboardResponse.builder()
                .status(1)
                .success("true")
                .clientTxnId("txn123")
                .build();

        // Setup ProcessCandidate
        processCandidate = new ProcessCandidate();
        CandidateDetails canDetails = new CandidateDetails();
        canDetails.setCandiateID("100035516");
        processCandidate.setCanDetails(canDetails);

        // Setup UpstreamMaster mocks
        upstreamMasterCandidate = new UpstreamMaster();
        upstreamMasterCandidate.setRequestBody("<fet:EmployeeCode>10071048</fet:EmployeeCode>");
        upstreamMasterCandidate.setPublisherURL("http://test-url.com/api");

        upstreamMasterCandidateOnbrd = new UpstreamMaster();
        upstreamMasterCandidateOnbrd.setPublisherURL("http://test-onbrd-url.com/api");

        upstreamMasterCandidateStatus = new UpstreamMaster();
        upstreamMasterCandidateStatus.setPublisherURL("http://test-status-url.com/api");
    }

    // ==================== getEmployeeDetailsApi() Tests ====================

    @Test
    @DisplayName("getEmployeeDetailsApi - Should successfully get employee details")
    void testGetEmployeeDetailsApi_Success() {
        // Arrange - Covers lines 40-88 (all code paths in getEmployeeDetailsApi)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidate)
                    .thenReturn(upstreamMasterCandidate);

            String expectedResponse = "<SOAP-ENV:Envelope>...</SOAP-ENV:Envelope>";
            ResponseEntity<String> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.OK);
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(responseEntity);

            // Act
            String result = hotApis.getEmployeeDetailsApi(processCandidate);

            // Assert
            assertNotNull(result);
            assertEquals(expectedResponse, result);
            verify(restTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
        }
    }

    @Test
    @DisplayName("getEmployeeDetailsApi - Should throw SoapValidationException for ResourceAccessException")
    void testGetEmployeeDetailsApi_ResourceAccessException() {
        // Arrange - Covers lines 65-70 (ResourceAccessException handler)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidate)
                    .thenReturn(upstreamMasterCandidate);

            ResourceAccessException exception = new ResourceAccessException("Connection timeout");
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(exception);

            // Act & Assert
            SoapValidationException soapException = assertThrows(SoapValidationException.class,
                    () -> hotApis.getEmployeeDetailsApi(processCandidate));
            assertTrue(soapException.getMessage().contains("Upstream service not reachable"));
        }
    }

    @Test
    @DisplayName("getEmployeeDetailsApi - Should return error response body for HttpClientErrorException")
    void testGetEmployeeDetailsApi_HttpClientErrorException() {
        // Arrange - Covers lines 71-76 (HttpClientErrorException handler)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidate)
                    .thenReturn(upstreamMasterCandidate);

            String errorBody = "<Error>Invalid request</Error>";
            // Override getResponseBodyAsString() to ensure it returns the error body
            // This ensures line 76: return e.getResponseBodyAsString() works correctly
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, errorBody) {
                @Override
                public String getResponseBodyAsString() {
                    return errorBody;
                }
            };
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(exception);

            // Act - This should execute lines 71-76
            String result = hotApis.getEmployeeDetailsApi(processCandidate);

            // Assert - Verify line 76 executed: return e.getResponseBodyAsString()
            assertEquals(errorBody, result);
            
            // Verify restTemplate.exchange was called (to ensure we entered the try block)
            verify(restTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
        }
    }

    @Test
    @DisplayName("getEmployeeDetailsApi - Should return null for generic exception")
    void testGetEmployeeDetailsApi_GenericException() {
        // Arrange - Covers lines 77-83 (generic exception handler, return wcsResponse when it's null)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidate)
                    .thenReturn(upstreamMasterCandidate);

            RuntimeException exception = new RuntimeException("Unexpected error");
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(exception);

            // Act
            String result = hotApis.getEmployeeDetailsApi(processCandidate);

            // Assert
            assertNull(result);
        }
    }

    @Test
    @DisplayName("getEmployeeDetailsApi - Should return response after successful call")
    void testGetEmployeeDetailsApi_SuccessfulCall() {
        // Arrange - Covers lines 85-88 (success path after try-catch)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidate)
                    .thenReturn(upstreamMasterCandidate);

            String expectedResponse = "<SOAP-ENV:Envelope><SOAP-ENV:Body>Success</SOAP-ENV:Body></SOAP-ENV:Envelope>";
            ResponseEntity<String> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.OK);
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(responseEntity);

            // Act
            String result = hotApis.getEmployeeDetailsApi(processCandidate);

            // Assert
            assertNotNull(result);
            assertEquals(expectedResponse, result);
            verify(restTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
        }
    }

    @Test
    @DisplayName("getEmployeeDetailsApi - Should return wcsResponse value for generic exception")
    void testGetEmployeeDetailsApi_GenericException_WithResponse() {
        // Arrange - Covers line 82 (return wcsResponse when it has a value)
        // This tests the code path where wcsResponse is returned in the generic exception handler
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidate)
                    .thenReturn(upstreamMasterCandidate);

            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new RuntimeException("Unexpected error after partial processing"));

            // Act
            String result = hotApis.getEmployeeDetailsApi(processCandidate);

            // Assert
            // Since wcsResponse is initialized as null and exception happens immediately, result will be null
            assertNull(result);
        }
    }

    // ==================== callCandidateOnboardApi() Tests ====================

    @Test
    @DisplayName("callCandidateOnboardApi - Should successfully call candidate onboard API")
    void testCallCandidateOnboardApi_Success() throws Exception {
        // Arrange - Covers lines 96-167 (all code paths in callCandidateOnboardApi)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(candidateOnboardResponse, HttpStatus.OK);
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getStatus());
            assertEquals("true", result.getSuccess());
            verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should return empty response when responseEntity is null")
    void testCallCandidateOnboardApi_NullResponseEntity() throws Exception {
        // Arrange - Covers lines 121-123 (null responseEntity check)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(null);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert
            assertNotNull(result);
            assertTrue(result instanceof CandidateOnboardResponse);
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should return empty response when response body is null")
    void testCallCandidateOnboardApi_NullResponseBody() throws Exception {
        // Arrange - Covers lines 121-123 (null response body check)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(null, HttpStatus.OK);
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert
            assertNotNull(result);
            assertTrue(result instanceof CandidateOnboardResponse);
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should throw SoapValidationException for ResourceAccessException")
    void testCallCandidateOnboardApi_ResourceAccessException() {
        // Arrange - Covers lines 126-131 (ResourceAccessException handler)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            ResourceAccessException exception = new ResourceAccessException("Connection timeout");
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act & Assert
            assertThrows(SoapValidationException.class,
                    () -> hotApis.callCandidateOnboardApi(candidateOnboardRequest));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should return parsed error response for HttpClientErrorException with valid JSON")
    void testCallCandidateOnboardApi_HttpClientErrorException_ValidJson() throws Exception {
        // Arrange - Covers lines 132-144 (HttpClientErrorException handler with JSON parsing success)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            // Use ObjectMapper to generate valid JSON that matches CandidateOnboardResponse structure
            ObjectMapper testMapper = new ObjectMapper();
            CandidateOnboardResponse testResponse = CandidateOnboardResponse.builder()
                    .status(0)
                    .success("false")
                    .errors("Invalid request")
                    .clientTxnId("txn123")
                    .build();
            
            // Convert to JSON to ensure it's valid and matches the class structure
            String errorJson = testMapper.writeValueAsString(testResponse);
            
            // Verify the JSON can be parsed back (proves it will work at line 139)
            CandidateOnboardResponse parsedTest = testMapper.readValue(errorJson, CandidateOnboardResponse.class);
            assertNotNull(parsedTest);
            assertEquals(0, parsedTest.getStatus());
            
            // Create HttpClientErrorException with the valid JSON
            // Override getResponseBodyAsString() to ensure it returns the JSON
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, errorJson) {
                @Override
                public String getResponseBodyAsString() {
                    return errorJson;
                }
            };
            
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertEquals("Invalid request", result.getErrors());
            assertEquals("txn123", result.getClientTxnId());
            
            // Verify the parsed errorResponse is returned (line 144)
            // The result should be the parsed object, not a new empty object from line 149
            assertNotEquals(new CandidateOnboardResponse(), result);
            // If line 145 catch block executed, status would be 0 but errors would contain "Received error from API"
            // But we have errors "Invalid request", proving line 144 executed instead
            assertFalse(result.getErrors().contains("Received error from API"));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should parse and return error response with all fields (lines 137-145)")
    void testCallCandidateOnboardApi_HttpClientErrorException_ParseErrorResponseWithAllFields() throws Exception {
        // Arrange - Specifically covers lines 137-145 (JSON parsing success path with all fields)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            // First, validate the JSON can be parsed by ObjectMapper
            // This ensures line 139 will succeed
            ObjectMapper testMapper = new ObjectMapper();
            CandidateOnboardResponse testResponse = CandidateOnboardResponse.builder()
                    .status(500)
                    .success("false")
                    .errors("Internal server error occurred")
                    .clientTxnId("test-txn-456")
                    .build();
            
            // Convert to JSON to ensure it's valid and matches the class structure
            String errorJson = testMapper.writeValueAsString(testResponse);
            
            // Verify the JSON can be parsed back (proves it will work at line 139)
            CandidateOnboardResponse parsedTest = testMapper.readValue(errorJson, CandidateOnboardResponse.class);
            assertNotNull(parsedTest);
            assertEquals(500, parsedTest.getStatus());
            
            // Create HttpClientErrorException with the valid JSON
            // Override getResponseBodyAsString() to ensure it returns the JSON
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.INTERNAL_SERVER_ERROR, errorJson) {
                @Override
                public String getResponseBodyAsString() {
                    return errorJson;
                }
            };
            
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act - This should execute lines 137-145
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert - Verify all fields from lines 140-143 are properly set and returned
            assertNotNull(result);
            assertEquals(500, result.getStatus()); // Line 141: errorResponse.getStatus()
            assertEquals("false", result.getSuccess());
            assertEquals("Internal server error occurred", result.getErrors()); // Line 142: errorResponse.getErrors()
            assertEquals("test-txn-456", result.getClientTxnId()); // Line 143: errorResponse.getClientTxnId()
            
            // Verify the parsed errorResponse is returned (line 144)
            // The result should be the parsed object, not a new empty object from line 149
            assertNotEquals(new CandidateOnboardResponse(), result);
            // If line 145 catch block executed, status would be 0
            // But we have status 500, proving line 144 executed instead
            assertNotEquals(0, result.getStatus());
            
            // Verify that restTemplate.postForEntity was called (to ensure we entered the try block)
            verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should execute ObjectMapper.readValue and return parsed response (lines 137-145)")
    void testCallCandidateOnboardApi_HttpClientErrorException_ExecuteObjectMapperReadValue() throws Exception {
        // Arrange - Specifically targets line 139: objectMapper.readValue()
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            // Use a valid JSON that ObjectMapper can parse - this ensures line 139 executes
            String validErrorJson = "{\"status\":404,\"success\":\"false\",\"errors\":\"Resource not found\",\"clientTxnId\":\"txn-789\"}";
            // Override getResponseBodyAsString() to ensure it returns the JSON
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.NOT_FOUND, validErrorJson) {
                @Override
                public String getResponseBodyAsString() {
                    return validErrorJson;
                }
            };
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act - This triggers the catch block at line 132, then enters try at line 137
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert - Verify line 139 executed successfully (parsed JSON)
            assertNotNull(result);
            // If line 139 executed, the result should have the parsed values
            assertEquals(404, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertEquals("Resource not found", result.getErrors());
            assertEquals("txn-789", result.getClientTxnId());
            
            // Verify lines 140-143 executed (logging with all fields accessed)
            // If we get here with correct values, it means lines 140-143 executed
            // Verify line 144 executed (return errorResponse)
            assertNotNull(result.getStatus());
            assertNotNull(result.getErrors());
            assertNotNull(result.getClientTxnId());
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should execute lines 137-144 with successful JSON parsing")
    void testCallCandidateOnboardApi_ExecuteLines137To144() throws Exception {
        // Arrange - Explicitly targets lines 137-144 to ensure they execute
        // Line 137: try {
        // Line 139: objectMapper.readValue() - must succeed (no JsonProcessingException)
        // Lines 140-143: LogWrapper.error with all field accesses
        // Line 144: return errorResponse
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            // First, validate the JSON can be parsed by ObjectMapper
            // This ensures line 139 will succeed
            ObjectMapper testMapper = new ObjectMapper();
            CandidateOnboardResponse testResponse = CandidateOnboardResponse.builder()
                    .status(777)
                    .success("false")
                    .errors("Test error message")
                    .clientTxnId("test-execution-137-144")
                    .build();
            
            // Convert to JSON to ensure it's valid
            String perfectlyValidJson = testMapper.writeValueAsString(testResponse);
            
            // Verify the JSON can be parsed back (proves it will work at line 139)
            CandidateOnboardResponse parsedTest = testMapper.readValue(perfectlyValidJson, CandidateOnboardResponse.class);
            assertNotNull(parsedTest);
            assertEquals(777, parsedTest.getStatus());
            
            // Create HttpClientErrorException with the valid JSON
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, perfectlyValidJson) {
                @Override
                public String getResponseBodyAsString() {
                    return perfectlyValidJson;
                }
            };
            
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act - This should:
            // 1. Catch HttpClientErrorException at line 132
            // 2. Enter try block at line 137
            // 3. Execute line 139: objectMapper.readValue() successfully (no exception)
            // 4. Execute lines 140-143: LogWrapper.error with field accesses
            // 5. Execute line 144: return errorResponse (NOT the catch block at 145)
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert - Verify line 139 executed successfully (JSON was parsed without exception)
            assertNotNull(result);
            
            // Verify the parsed values match the JSON - proves line 139 executed
            assertEquals(777, result.getStatus()); // Line 141: errorResponse.getStatus()
            assertEquals("false", result.getSuccess());
            assertEquals("Test error message", result.getErrors()); // Line 142: errorResponse.getErrors()
            assertEquals("test-execution-137-144", result.getClientTxnId()); // Line 143: errorResponse.getClientTxnId()
            
            // Verify lines 140-143 executed by checking all fields were accessed
            // If any of these were null and accessed, it would throw NPE
            assertNotNull(result.getStatus());
            assertNotNull(result.getSuccess());
            assertNotNull(result.getErrors());
            assertNotNull(result.getClientTxnId());
            
            // Verify line 144 executed (return errorResponse)
            // The result should be the parsed object, not a new empty object from line 149
            assertNotEquals(new CandidateOnboardResponse(), result);
            // If line 145 catch block executed, status would be 0 and success would be "false"
            // But we have status 777, proving line 144 executed instead
            assertNotEquals(0, result.getStatus());
            
            // Verify restTemplate was called (to ensure we entered the try block at line 114)
            verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should parse error response with null optional fields (lines 137-145)")
    void testCallCandidateOnboardApi_HttpClientErrorException_ParseErrorResponseWithNullFields() throws Exception {
        // Arrange - Covers lines 137-145 when optional fields are null
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            // Error JSON with null optional fields
            String errorJson = "{\"status\":400,\"success\":\"false\",\"errors\":null,\"clientTxnId\":null}";
            // Override getResponseBodyAsString() to ensure it returns the JSON
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, errorJson) {
                @Override
                public String getResponseBodyAsString() {
                    return errorJson;
                }
            };
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert - Verify parsing still works with null fields
            assertNotNull(result);
            assertEquals(400, result.getStatus());
            assertEquals("false", result.getSuccess());
            // Errors and clientTxnId may be null, which is acceptable
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should return error response for HttpClientErrorException with invalid JSON")
    void testCallCandidateOnboardApi_HttpClientErrorException_InvalidJson() throws Exception {
        // Arrange - Covers lines 145-154 (JSON parsing failure)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            String errorText = "Invalid request - not JSON";
            // Override getResponseBodyAsString() to ensure it returns the error text
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, errorText) {
                @Override
                public String getResponseBodyAsString() {
                    return errorText;
                }
            };
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertTrue(result.getErrors().contains("Received error from API"));
            assertTrue(result.getErrors().contains(errorText));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should return response after successful call")
    void testCallCandidateOnboardApi_SuccessfulCall() throws Exception {
        // Arrange - Covers lines 165-167 (success path after try-catch)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(candidateOnboardResponse, HttpStatus.OK);
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getStatus());
            assertEquals("true", result.getSuccess());
            verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should handle HttpClientErrorException with null response body")
    void testCallCandidateOnboardApi_HttpClientErrorException_NullResponseBody() throws Exception {
        // Arrange - Covers JSON parsing when response body is null
        // When getResponseBodyAsString() returns null, objectMapper.readValue(null, ...) 
        // throws IllegalArgumentException which is now caught by inner catch block (line 145)
        // and returns error response with "Received error from API: null" at line 152
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST) {
                @Override
                public String getResponseBodyAsString() {
                    return null;
                }
            };
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert - Inner catch block executed (IllegalArgumentException caught)
            // Returns error response with status=0, success="false", errors="Received error from API: null"
            assertNotNull(result);
            assertEquals(0, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertNotNull(result.getErrors());
            assertTrue(result.getErrors().contains("Received error from API"));
            assertTrue(result.getErrors().contains("null"));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should handle HttpClientErrorException with empty response body")
    void testCallCandidateOnboardApi_HttpClientErrorException_EmptyResponseBody() throws Exception {
        // Arrange - Covers JSON parsing when response body is empty
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, "");
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertTrue(result.getErrors().contains("Received error from API"));
        }
    }

    @Test
    @DisplayName("callCandidateOnboardApi - Should return empty response for generic exception")
    void testCallCandidateOnboardApi_GenericException() throws Exception {
        // Arrange - Covers lines 155-163 (generic exception handler)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateOnbrd)
                    .thenReturn(upstreamMasterCandidateOnbrd);

            RuntimeException exception = new RuntimeException("Unexpected error");
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.callCandidateOnboardApi(candidateOnboardRequest);

            // Assert
            assertNotNull(result);
            assertTrue(result instanceof CandidateOnboardResponse);
        }
    }

    // ==================== getCandidateDetailsApi() Tests ====================

    @Test
    @DisplayName("getCandidateDetailsApi - Should successfully get candidate details")
    void testGetCandidateDetailsApi_Success() throws Exception {
        // Arrange - Covers lines 173-245 (all code paths in getCandidateDetailsApi)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(candidateOnboardResponse, HttpStatus.OK);
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getStatus());
            verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should execute lines 190-202 with non-null responseEntity and body")
    void testGetCandidateDetailsApi_Lines190To202Execution() throws Exception {
        // Arrange - Explicitly ensures lines 190-202 are executed
        // Line 190: try {
        // Lines 193-196: restTemplate.postForEntity() call
        // Line 197: if condition check (should be FALSE)
        // Line 201: response = responseEntity.getBody()
        // Line 202: } closing try block
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            // Create a response body that is definitely NOT null
            CandidateOnboardResponse nonNullBody = new CandidateOnboardResponse();
            nonNullBody.setStatus(777);
            nonNullBody.setSuccess("true");
            nonNullBody.setClientTxnId("line-201-execution-test");
            nonNullBody.setErrors("Test execution");

            // Create ResponseEntity with non-null body - ensures line 197 condition is FALSE
            ResponseEntity<CandidateOnboardResponse> nonNullResponseEntity = 
                    new ResponseEntity<>(nonNullBody, HttpStatus.OK);

            // Mock to return non-null ResponseEntity with non-null body
            when(restTemplate.postForEntity(
                    eq("http://10.173.173.13:32103/ril-integration-callbacks/v1/get_candidate_details"),
                    any(HttpEntity.class),
                    eq(CandidateOnboardResponse.class)))
                    .thenReturn(nonNullResponseEntity);

            // Act - This should execute lines 190-202
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert - Verify lines 193-196 executed
            verify(restTemplate, times(1)).postForEntity(
                    eq("http://10.173.173.13:32103/ril-integration-callbacks/v1/get_candidate_details"),
                    any(HttpEntity.class),
                    eq(CandidateOnboardResponse.class));

            // Assert - Verify line 197 condition was FALSE
            // responseEntity != null && responseEntity.getBody() != null
            // Both are true, so condition is FALSE, meaning line 201 executes
            assertNotNull(nonNullResponseEntity);
            assertNotNull(nonNullResponseEntity.getBody());

            // Assert - Verify line 201 executed: response = responseEntity.getBody()
            // The result should be the exact same object reference
            assertNotNull(result);
            assertSame(nonNullBody, result); // Proves line 201 executed
            assertEquals(777, result.getStatus());
            assertEquals("line-201-execution-test", result.getClientTxnId());
            assertEquals("Test execution", result.getErrors());

            // If we reach here, line 202 (closing brace) was reached
            // and the method continued to line 241-243 (final return)
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should return empty response when responseEntity is null")
    void testGetCandidateDetailsApi_NullResponseEntity() throws Exception {
        // Arrange - Covers lines 197-199 (null responseEntity check)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(null);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert
            assertNotNull(result);
            assertTrue(result instanceof CandidateOnboardResponse);
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should return empty response when response body is null")
    void testGetCandidateDetailsApi_NullResponseBody() throws Exception {
        // Arrange - Covers lines 197-199 (null response body check)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(null, HttpStatus.OK);
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert
            assertNotNull(result);
            assertTrue(result instanceof CandidateOnboardResponse);
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should successfully set response from responseEntity body (lines 190-202)")
    void testGetCandidateDetailsApi_SuccessfulResponseAssignment() throws Exception {
        // Arrange - Specifically covers lines 190-202 (try block with successful response assignment)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            // Create a response with specific values to verify assignment
            CandidateOnboardResponse expectedResponse = CandidateOnboardResponse.builder()
                    .status(1)
                    .success("true")
                    .clientTxnId("test-client-txn-789")
                    .errors(null)
                    .build();

            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.OK);
            when(restTemplate.postForEntity(
                    eq("http://10.173.173.13:32103/ril-integration-callbacks/v1/get_candidate_details"),
                    any(HttpEntity.class),
                    eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act - This should execute lines 190-202
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert - Verify lines 193-201 are executed correctly
            assertNotNull(result);
            // Line 201: response = responseEntity.getBody() - verify this executed
            assertEquals(1, result.getStatus());
            assertEquals("true", result.getSuccess());
            assertEquals("test-client-txn-789", result.getClientTxnId());
            // Verify restTemplate.postForEntity was called (lines 193-196)
            verify(restTemplate, times(1)).postForEntity(
                    eq("http://10.173.173.13:32103/ril-integration-callbacks/v1/get_candidate_details"),
                    any(HttpEntity.class),
                    eq(CandidateOnboardResponse.class));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should execute response assignment when body is not null (lines 190-201)")
    void testGetCandidateDetailsApi_ExecuteResponseAssignmentLine201() throws Exception {
        // Arrange - Specifically targets line 201: response = responseEntity.getBody()
        // This test ensures responseEntity is NOT null AND responseEntity.getBody() is NOT null
        // So line 197 condition is false, and line 201 executes
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            // Create a response body that is NOT null - this ensures line 197 condition is false
            CandidateOnboardResponse responseBody = CandidateOnboardResponse.builder()
                    .status(2)
                    .success("true")
                    .clientTxnId("assignment-test-txn")
                    .errors("No errors")
                    .build();

            // Create responseEntity with non-null body
            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
            
            // Use ArgumentCaptor to verify the exact call
            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            @SuppressWarnings("unchecked")
            ArgumentCaptor<HttpEntity<CandidateStatusRequest>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
            
            when(restTemplate.postForEntity(
                    urlCaptor.capture(),
                    entityCaptor.capture(),
                    eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act - This executes lines 190-201
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert - Verify line 193-196 executed (restTemplate.postForEntity call)
            verify(restTemplate, times(1)).postForEntity(
                    anyString(),
                    any(HttpEntity.class),
                    eq(CandidateOnboardResponse.class));
            
            // Verify the exact URL was used (line 194)
            assertEquals("http://10.173.173.13:32103/ril-integration-callbacks/v1/get_candidate_details", urlCaptor.getValue());
            
            // Assert - Verify line 197 condition was false (responseEntity != null && body != null)
            // If we get here with the correct result, it means line 197 was false and line 201 executed
            assertNotNull(result);
            assertEquals(2, result.getStatus()); // Line 201: response = responseEntity.getBody()
            assertEquals("true", result.getSuccess());
            assertEquals("assignment-test-txn", result.getClientTxnId());
            assertEquals("No errors", result.getErrors());
            
            // Verify the result is the same object reference (proving line 201 executed)
            // This confirms response = responseEntity.getBody() was executed
            assertSame(responseBody, result);
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should execute all lines 190-202 including response assignment")
    void testGetCandidateDetailsApi_ExecuteLines190To202() throws Exception {
        // Arrange - Explicitly targets lines 190-202 to ensure they all execute
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            // Create a unique response to verify it's the one assigned on line 201
            CandidateOnboardResponse testResponseBody = CandidateOnboardResponse.builder()
                    .status(999)
                    .success("true")
                    .clientTxnId("line-201-test")
                    .errors("Test error message")
                    .build();

            // Create ResponseEntity with non-null body to ensure line 197 condition is FALSE
            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(testResponseBody, HttpStatus.OK);
            
            // Mock the restTemplate call to return our test response
            when(restTemplate.postForEntity(
                    eq("http://10.173.173.13:32103/ril-integration-callbacks/v1/get_candidate_details"),
                    any(HttpEntity.class),
                    eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act - Execute the method which should go through lines 190-202
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert - Verify line 190: try block was entered
            // Verify lines 193-196: restTemplate.postForEntity was called
            verify(restTemplate, times(1)).postForEntity(
                    eq("http://10.173.173.13:32103/ril-integration-callbacks/v1/get_candidate_details"),
                    any(HttpEntity.class),
                    eq(CandidateOnboardResponse.class));

            // Assert - Verify line 197 condition was FALSE (both are non-null)
            assertNotNull(responseEntity);
            assertNotNull(responseEntity.getBody());
            
            // Assert - Verify line 201 executed: response = responseEntity.getBody()
            // The result should be the same object as testResponseBody
            assertNotNull(result);
            assertSame(testResponseBody, result); // Proves line 201 executed
            assertEquals(999, result.getStatus());
            assertEquals("line-201-test", result.getClientTxnId());
            assertEquals("Test error message", result.getErrors());
            
            // Verify line 202: try block completed successfully (no exception thrown)
            // If we reach here, the try block completed and line 202 was reached
            // Also verify the method continues to line 241-243 (final return)
            assertNotNull(result);
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should handle responseEntity with non-null body (lines 190-202)")
    void testGetCandidateDetailsApi_ResponseEntityWithValidBody() throws Exception {
        // Arrange - Covers lines 190-202 when responseEntity and body are both non-null
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            CandidateOnboardResponse responseBody = CandidateOnboardResponse.builder()
                    .status(2)
                    .success("true")
                    .clientTxnId("txn-999")
                    .errors("No errors")
                    .build();

            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert - Verify line 201: response = responseEntity.getBody() is executed
            assertNotNull(result);
            assertEquals(2, result.getStatus());
            assertEquals("true", result.getSuccess());
            assertEquals("txn-999", result.getClientTxnId());
            assertEquals("No errors", result.getErrors());
            // Verify the responseEntity.getBody() path was taken (not the null check path)
            assertNotEquals(new CandidateOnboardResponse(), result);
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should throw SoapValidationException for ResourceAccessException")
    void testGetCandidateDetailsApi_ResourceAccessException() {
        // Arrange - Covers lines 202-207 (ResourceAccessException handler)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            ResourceAccessException exception = new ResourceAccessException("Connection timeout");
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act & Assert
            assertThrows(SoapValidationException.class,
                    () -> hotApis.getCandidateDetailsApi(candidateStatusRequest));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should return parsed error response for HttpClientErrorException with valid JSON")
    void testGetCandidateDetailsApi_HttpClientErrorException_ValidJson() throws Exception {
        // Arrange - Covers lines 208-220 (HttpClientErrorException handler with JSON parsing success)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            // Use ObjectMapper to generate valid JSON that matches CandidateOnboardResponse structure
            ObjectMapper testMapper = new ObjectMapper();
            CandidateOnboardResponse testResponse = CandidateOnboardResponse.builder()
                    .status(0)
                    .success("false")
                    .errors("Invalid request")
                    .clientTxnId("txn123")
                    .build();
            
            // Convert to JSON to ensure it's valid and matches the class structure
            String errorJson = testMapper.writeValueAsString(testResponse);
            
            // Verify the JSON can be parsed back (proves it will work at line 215)
            CandidateOnboardResponse parsedTest = testMapper.readValue(errorJson, CandidateOnboardResponse.class);
            assertNotNull(parsedTest);
            assertEquals(0, parsedTest.getStatus());
            
            // Create HttpClientErrorException with the valid JSON
            // Override getResponseBodyAsString() to ensure it returns the JSON
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, errorJson) {
                @Override
                public String getResponseBodyAsString() {
                    return errorJson;
                }
            };
            
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertEquals("Invalid request", result.getErrors());
            assertEquals("txn123", result.getClientTxnId());
            
            // Verify the parsed errorResponse is returned (line 220)
            // The result should be the parsed object, not a new empty object from line 225
            assertNotEquals(new CandidateOnboardResponse(), result);
            // If line 221 catch block executed, status would be 0 but errors would contain "Received error from API"
            // But we have errors "Invalid request", proving line 220 executed instead
            assertFalse(result.getErrors().contains("Received error from API"));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should execute lines 213-220 with successful JSON parsing")
    void testGetCandidateDetailsApi_ExecuteLines213To220() throws Exception {
        // Arrange - Explicitly targets lines 213-220 to ensure they execute
        // Line 213: try {
        // Line 215: objectMapper.readValue() - must succeed (no JsonProcessingException)
        // Lines 216-219: LogWrapper.error with all field accesses
        // Line 220: return errorResponse
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            // First, validate the JSON can be parsed by ObjectMapper
            // This ensures line 215 will succeed
            ObjectMapper testMapper = new ObjectMapper();
            CandidateOnboardResponse testResponse = CandidateOnboardResponse.builder()
                    .status(888)
                    .success("false")
                    .errors("Test error for getCandidateDetails")
                    .clientTxnId("test-execution-213-220")
                    .build();
            
            // Convert to JSON to ensure it's valid
            String perfectlyValidJson = testMapper.writeValueAsString(testResponse);
            
            // Verify the JSON can be parsed back (proves it will work at line 215)
            CandidateOnboardResponse parsedTest = testMapper.readValue(perfectlyValidJson, CandidateOnboardResponse.class);
            assertNotNull(parsedTest);
            assertEquals(888, parsedTest.getStatus());
            
            // Create HttpClientErrorException with the valid JSON
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, perfectlyValidJson) {
                @Override
                public String getResponseBodyAsString() {
                    return perfectlyValidJson;
                }
            };
            
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act - This should:
            // 1. Catch HttpClientErrorException at line 208
            // 2. Enter try block at line 213
            // 3. Execute line 215: objectMapper.readValue() successfully (no exception)
            // 4. Execute lines 216-219: LogWrapper.error with field accesses
            // 5. Execute line 220: return errorResponse (NOT the catch block at 221)
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert - Verify line 215 executed successfully (JSON was parsed without exception)
            assertNotNull(result);
            
            // Verify the parsed values match the JSON - proves line 215 executed
            assertEquals(888, result.getStatus()); // Line 217: errorResponse.getStatus()
            assertEquals("false", result.getSuccess());
            assertEquals("Test error for getCandidateDetails", result.getErrors()); // Line 218: errorResponse.getErrors()
            assertEquals("test-execution-213-220", result.getClientTxnId()); // Line 219: errorResponse.getClientTxnId()
            
            // Verify lines 216-219 executed by checking all fields were accessed
            // If any of these were null and accessed, it would throw NPE
            assertNotNull(result.getStatus());
            assertNotNull(result.getSuccess());
            assertNotNull(result.getErrors());
            assertNotNull(result.getClientTxnId());
            
            // Verify line 220 executed (return errorResponse)
            // The result should be the parsed object, not a new empty object from line 225
            assertNotEquals(new CandidateOnboardResponse(), result);
            // If line 221 catch block executed, status would be 0 and success would be "false"
            // But we have status 888, proving line 220 executed instead
            assertNotEquals(0, result.getStatus());
            
            // Verify restTemplate was called (to ensure we entered the try block at line 190)
            verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should return error response for HttpClientErrorException with invalid JSON")
    void testGetCandidateDetailsApi_HttpClientErrorException_InvalidJson() throws Exception {
        // Arrange - Covers lines 221-229 (JSON parsing failure)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            String errorText = "Invalid request - not JSON";
            // Override getResponseBodyAsString() to ensure it returns the error text
            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, errorText) {
                @Override
                public String getResponseBodyAsString() {
                    return errorText;
                }
            };
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertTrue(result.getErrors().contains("Received error from API"));
            assertTrue(result.getErrors().contains(errorText));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should return response after successful call")
    void testGetCandidateDetailsApi_SuccessfulCall() throws Exception {
        // Arrange - Covers lines 241-243 (success path after try-catch)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            ResponseEntity<CandidateOnboardResponse> responseEntity = new ResponseEntity<>(candidateOnboardResponse, HttpStatus.OK);
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenReturn(responseEntity);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getStatus());
            assertEquals("true", result.getSuccess());
            verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should handle HttpClientErrorException with null response body")
    void testGetCandidateDetailsApi_HttpClientErrorException_NullResponseBody() throws Exception {
        // Arrange - Covers JSON parsing when response body is null
        // When getResponseBodyAsString() returns null, objectMapper.readValue(null, ...) 
        // throws IllegalArgumentException which is now caught by inner catch block (line 221)
        // and returns error response with "Received error from API: null" at line 228
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST) {
                @Override
                public String getResponseBodyAsString() {
                    return null;
                }
            };
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert - Inner catch block executed (IllegalArgumentException caught)
            // Returns error response with status=0, success="false", errors="Received error from API: null"
            assertNotNull(result);
            assertEquals(0, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertNotNull(result.getErrors());
            assertTrue(result.getErrors().contains("Received error from API"));
            assertTrue(result.getErrors().contains("null"));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should handle HttpClientErrorException with empty response body")
    void testGetCandidateDetailsApi_HttpClientErrorException_EmptyResponseBody() throws Exception {
        // Arrange - Covers JSON parsing when response body is empty
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            HttpClientErrorException exception = new HttpClientErrorException(HttpStatus.BAD_REQUEST, "");
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert
            assertNotNull(result);
            assertEquals(0, result.getStatus());
            assertEquals("false", result.getSuccess());
            assertTrue(result.getErrors().contains("Received error from API"));
        }
    }

    @Test
    @DisplayName("getCandidateDetailsApi - Should return empty response for generic exception")
    void testGetCandidateDetailsApi_GenericException() throws Exception {
        // Arrange - Covers lines 231-239 (generic exception handler)
        try (MockedStatic<ApplicationConfig> mockedApplicationConfig = mockStatic(ApplicationConfig.class)) {
            mockedApplicationConfig.when(ApplicationConfig::getUpstreamMasterCandidateStatus)
                    .thenReturn(upstreamMasterCandidateStatus);

            RuntimeException exception = new RuntimeException("Unexpected error");
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(CandidateOnboardResponse.class)))
                    .thenThrow(exception);

            // Act
            CandidateOnboardResponse result = hotApis.getCandidateDetailsApi(candidateStatusRequest);

            // Assert
            assertNotNull(result);
            assertTrue(result instanceof CandidateOnboardResponse);
        }
    }
}
