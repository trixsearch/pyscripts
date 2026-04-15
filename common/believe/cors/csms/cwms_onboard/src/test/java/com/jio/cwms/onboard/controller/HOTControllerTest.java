package com.jio.cwms.onboard.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.MockedStatic.Verification;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.ws.soap.SoapHeaderElement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms.onboard.dto.response.TokenResponse;
import com.jio.cwms.onboard.exception.SoapUnauthorizedException;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.service.HOTServiceImpl;
import com.jio.cwms.onboard.service.TokenDecryptionService;
import com.jio.cwms.onboard.service.TokenGenerationService;
import com.jio.cwms.onboard.service.apis.ValidateXmlHeader;
import com.jio.cwms.onboard.utils.CDATAcreation;
import com.jio.cwms_soap.pojo.GetCandidateStatus;
import com.jio.cwms_soap.pojo.GetCandidateStatusResponse;
import com.jio.cwms_soap.pojo.GetDetails;
import com.jio.cwms_soap.pojo.GetDetailsResponse;
import com.jio.cwms_soap.pojo.GetPositionCount;
import com.jio.cwms_soap.pojo.GetPositionCountResponse;
import com.jio.cwms_soap.pojo.GetScrumDetails;
import com.jio.cwms_soap.pojo.GetToken;
import com.jio.cwms_soap.pojo.GetTokenResponse;
import com.jio.cwms_soap.pojo.ProcessCandidate;
import com.jio.cwms_soap.pojo.ProcessCandidateResult;
import com.jio.cwms_soap.pojo.UpdateDOJ;
import com.jio.cwms_soap.pojo.UpdateDOJResponse;
import com.jio.cwms_soap.pojo.UpdatePhoto;
import com.jio.cwms_soap.pojo.UpdatePhotoResponse;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Comprehensive Unit Tests for HOTController
 * 
 * Coverage includes:
 * - All public methods
 * - Token validation scenarios
 * - Exception handling
 * - Edge cases
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("HOTController Unit Tests")
class HOTControllerTest {

    @Mock
    private HOTServiceImpl hotService;

    @Mock
    private CDATAcreation cdataCreation;

    @Mock
    private TokenGenerationService tokenGenerationService;

    @Mock
    private ValidateXmlHeader validateXmlHeader;

    @Mock
    private TokenDecryptionService tokenDecryptionService;

    @Mock
    private SoapHeaderElement clientIdHeader;

    @Mock
    private ServletRequestAttributes servletRequestAttributes;

    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private HOTController hotController;

    private TokenResponse validTokenResponse;
    private TokenResponse invalidTokenResponse;
    private static final String VALID_CLIENT_ID = "JioQuickHire";
    private static final String VALID_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJKaW9RdWlja0hpcmUiLCJpYXQiOjE3NjcwMDI4NjR9._duiWyjVHhGQMkUNKRkRIW7MGhokICGw5odsgDDIqaA";
    private static final String CLIENT_IP = "7777";

    @BeforeEach
    void setUp() {
        // Initialize ObjectMapper
        ReflectionTestUtils.setField(hotController, "loggingResponseJson", new ObjectMapper());

        // Setup valid token response
        validTokenResponse = TokenResponse.builder()
                .tokenStatus(true)
                .message("Token is valid")
                .build();

        // Setup invalid token response
        invalidTokenResponse = TokenResponse.builder()
                .tokenStatus(false)
                .message("Token is expired")
                .build();

        // Setup RequestContextHolder mock - Reset first to ensure clean state
        RequestContextHolder.resetRequestAttributes();
        RequestContextHolder.setRequestAttributes(servletRequestAttributes);
        
        // Mock HttpServletRequest methods required by HttpRequestUtils.getRemoteIPAddress()
        // Using lenient() because these may not be called in all tests (e.g., when exception is thrown early)
        lenient().when(servletRequestAttributes.getRequest()).thenReturn(httpServletRequest);
        lenient().when(httpServletRequest.getHeader("X-FORWARDED-FOR")).thenReturn(CLIENT_IP);
        lenient().when(httpServletRequest.getRemoteAddr()).thenReturn(CLIENT_IP);
        
        // Mock getRequestURL() which is called by HttpRequestUtils
        StringBuffer requestURL = new StringBuffer("http://localhost:8080/test");
        lenient().when(httpServletRequest.getRequestURL()).thenReturn(requestURL);
    }

    @AfterEach
    void tearDown() {
        // Clean up RequestContextHolder after each test
        RequestContextHolder.resetRequestAttributes();
    }

    // ==================== getToken() Tests ====================

    @Test
    @DisplayName("getToken - Should successfully generate token")
    void testGetToken_Success() throws Exception {
        // Arrange
        GetToken request = new GetToken();
        GetTokenResponse expectedResponse = new GetTokenResponse();
        when(tokenGenerationService.GenerateToken(any(GetToken.class))).thenReturn(expectedResponse);

        // Act
        GetTokenResponse result = hotController.getToken(request);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(tokenGenerationService, times(1)).GenerateToken(any(GetToken.class));
    }

    @Test
    @DisplayName("getToken - Should handle service exception")
    void testGetToken_ServiceException() throws Exception {
        // Arrange
        GetToken request = new GetToken();
        when(tokenGenerationService.GenerateToken(any(GetToken.class)))
                .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> hotController.getToken(request));
        verify(tokenGenerationService, times(1)).GenerateToken(any(GetToken.class));
    }

    // ==================== GetPositionCount() Tests ====================

    @Test
    @DisplayName("GetPositionCount - Should successfully get position count with typecode 1")
    void testGetPositionCount_Typecode1_Success() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);
        request.setTypecode("1");
        GetPositionCountResponse expectedResponse = new GetPositionCountResponse();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.getPositionCount(any(GetPositionCount.class))).thenReturn(expectedResponse);

        // Act
        GetPositionCountResponse result = hotController.GetPositionCount(request, clientIdHeader);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(validateXmlHeader, times(1)).validateHeader(any(SoapHeaderElement.class));
        verify(tokenDecryptionService, times(1)).tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString());
        verify(hotService, times(1)).getPositionCount(any(GetPositionCount.class));
        verify(hotService, never()).getPositionCountFromMongo(any(GetPositionCount.class));
    }

    @Test
    @DisplayName("GetPositionCount - Should successfully get position count with typecode 2")
    void testGetPositionCount_Typecode2_Success() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);
        request.setTypecode("2");
        GetPositionCountResponse expectedResponse = new GetPositionCountResponse();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.getPositionCountFromMongo(any(GetPositionCount.class))).thenReturn(expectedResponse);

        // Act
        GetPositionCountResponse result = hotController.GetPositionCount(request, clientIdHeader);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(hotService, never()).getPositionCount(any(GetPositionCount.class));
        verify(hotService, times(1)).getPositionCountFromMongo(any(GetPositionCount.class));
    }

    @Test
    @DisplayName("GetPositionCount - Should throw SoapValidationException for invalid typecode")
    void testGetPositionCount_InvalidTypecode() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);
        request.setTypecode("3"); // Invalid typecode

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);

        // Act & Assert
        SoapValidationException exception = assertThrows(SoapValidationException.class,
                () -> hotController.GetPositionCount(request, clientIdHeader));
        assertTrue(exception.getMessage().contains("Invalid typecode"));
        verify(hotService, never()).getPositionCount(any(GetPositionCount.class));
        verify(hotService, never()).getPositionCountFromMongo(any(GetPositionCount.class));
    }

    @Test
    @DisplayName("GetPositionCount - Should throw SoapUnauthorizedException for empty token")
    void testGetPositionCount_EmptyToken() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(""); // Empty token

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.GetPositionCount(request, clientIdHeader));
        assertEquals("Invalid Token", exception.getMessage());
        verify(tokenDecryptionService, never()).tokenValidation1(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("GetPositionCount - Should throw SoapUnauthorizedException for null token")
    void testGetPositionCount_NullToken() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(null); // Null token

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.GetPositionCount(request, clientIdHeader));
        assertEquals("Invalid Token", exception.getMessage());
    }

    @Test
    @DisplayName("GetPositionCount - Should throw SoapUnauthorizedException for expired token")
    void testGetPositionCount_ExpiredToken() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);
        request.setTypecode("1");

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(invalidTokenResponse);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.GetPositionCount(request, clientIdHeader));
        assertEquals("Token Expired", exception.getMessage());
        verify(hotService, never()).getPositionCount(any(GetPositionCount.class));
    }

    // ==================== GetCandidateStatus() Tests ====================

    @Test
    @DisplayName("GetCandidateStatus - Should successfully get candidate status")
    void testGetCandidateStatus_Success() throws Exception {
        // Arrange
        GetCandidateStatus request = new GetCandidateStatus();
        request.setToken(VALID_TOKEN);
        GetCandidateStatusResponse expectedResponse = new GetCandidateStatusResponse();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.CandidateStatusRequest(any(GetCandidateStatus.class))).thenReturn(expectedResponse);

        // Act
        GetCandidateStatusResponse result = hotController.GetCandidateStatus(request, clientIdHeader);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(hotService, times(1)).CandidateStatusRequest(any(GetCandidateStatus.class));
    }

    @Test
    @DisplayName("GetCandidateStatus - Should throw SoapUnauthorizedException for empty token")
    void testGetCandidateStatus_EmptyToken() throws Exception {
        // Arrange
        GetCandidateStatus request = new GetCandidateStatus();
        request.setToken("");

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.GetCandidateStatus(request, clientIdHeader));
        assertEquals("Invalid Token", exception.getMessage());
    }

    @Test
    @DisplayName("GetCandidateStatus - Should throw SoapUnauthorizedException for expired token")
    void testGetCandidateStatus_ExpiredToken() throws Exception {
        // Arrange
        GetCandidateStatus request = new GetCandidateStatus();
        request.setToken(VALID_TOKEN);

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(invalidTokenResponse);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.GetCandidateStatus(request, clientIdHeader));
        assertEquals("Token Expired", exception.getMessage());
    }

    // ==================== ProcessCandidate() Tests ====================

    @Test
    @DisplayName("ProcessCandidate - Should successfully process candidate")
    void testProcessCandidate_Success() throws Exception {
        // Arrange
        ProcessCandidate request = new ProcessCandidate();
        request.setToken(VALID_TOKEN);
        ProcessCandidateResult expectedResponse = new ProcessCandidateResult();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.processCandidate(any(ProcessCandidate.class))).thenReturn(expectedResponse);

        // Act
        ProcessCandidateResult result = hotController.ProcessCandidate(request, clientIdHeader);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(hotService, times(1)).processCandidate(any(ProcessCandidate.class));
    }

    @Test
    @DisplayName("ProcessCandidate - Should throw SoapUnauthorizedException for empty token")
    void testProcessCandidate_EmptyToken() throws Exception {
        // Arrange
        ProcessCandidate request = new ProcessCandidate();
        request.setToken("");

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.ProcessCandidate(request, clientIdHeader));
        assertEquals("Invalid Token", exception.getMessage());
    }

    @Test
    @DisplayName("ProcessCandidate - Should throw SoapUnauthorizedException for expired token")
    void testProcessCandidate_ExpiredToken() throws Exception {
        // Arrange
        ProcessCandidate request = new ProcessCandidate();
        request.setToken(VALID_TOKEN);

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(invalidTokenResponse);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.ProcessCandidate(request, clientIdHeader));
        assertEquals("Token Expired", exception.getMessage());
    }

    // ==================== getDetails() Tests ====================

    @Test
    @DisplayName("getDetails - Should successfully get candidate details")
    void testGetDetails_Success() throws Exception {
        // Arrange
        GetDetails request = new GetDetails();
        request.setToken(VALID_TOKEN);
        GetDetailsResponse expectedResponse = new GetDetailsResponse();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.getCandidateDetailsRequest(any(GetDetails.class))).thenReturn(expectedResponse);

        // Act
        GetDetailsResponse result = hotController.getDetails(request, clientIdHeader);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(hotService, times(1)).getCandidateDetailsRequest(any(GetDetails.class));
    }

    @Test
    @DisplayName("getDetails - Should throw SoapUnauthorizedException for empty token")
    void testGetDetails_EmptyToken() throws Exception {
        // Arrange
        GetDetails request = new GetDetails();
        request.setToken("");

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.getDetails(request, clientIdHeader));
        assertEquals("Invalid Token", exception.getMessage());
    }

    @Test
    @DisplayName("getDetails - Should throw SoapUnauthorizedException for expired token")
    void testGetDetails_ExpiredToken() throws Exception {
        // Arrange
        GetDetails request = new GetDetails();
        request.setToken(VALID_TOKEN);

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(invalidTokenResponse);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.getDetails(request, clientIdHeader));
        assertEquals("Token Expired", exception.getMessage());
    }

    // ==================== updateDOJ() Tests ====================

    @Test
    @DisplayName("updateDOJ - Should successfully update DOJ")
    void testUpdateDOJ_Success() throws Exception {
        // Arrange
        UpdateDOJ request = new UpdateDOJ();
        request.setToken(VALID_TOKEN);
        UpdateDOJResponse expectedResponse = new UpdateDOJResponse();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.updateDOJResp(any(UpdateDOJ.class))).thenReturn(expectedResponse);

        // Act
        UpdateDOJResponse result = hotController.updateDOJ(request, clientIdHeader);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(hotService, times(1)).updateDOJResp(any(UpdateDOJ.class));
    }

    @Test
    @DisplayName("updateDOJ - Should throw SoapUnauthorizedException for empty token")
    void testUpdateDOJ_EmptyToken() throws Exception {
        // Arrange
        UpdateDOJ request = new UpdateDOJ();
        request.setToken("");

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.updateDOJ(request, clientIdHeader));
        assertEquals("Invalid Token", exception.getMessage());
    }

    @Test
    @DisplayName("updateDOJ - Should throw SoapUnauthorizedException for expired token")
    void testUpdateDOJ_ExpiredToken() throws Exception {
        // Arrange
        UpdateDOJ request = new UpdateDOJ();
        request.setToken(VALID_TOKEN);

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(invalidTokenResponse);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.updateDOJ(request, clientIdHeader));
        assertEquals("Token Expired", exception.getMessage());
    }

    // ==================== updatePhoto() Tests ====================

    @Test
    @DisplayName("updatePhoto - Should successfully update photo")
    void testUpdatePhoto_Success() throws Exception {
        // Arrange
        UpdatePhoto request = new UpdatePhoto();
        request.setToken(VALID_TOKEN);
        UpdatePhotoResponse expectedResponse = new UpdatePhotoResponse();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.updatePhotoResp(any(UpdatePhoto.class))).thenReturn(expectedResponse);

        // Act
        UpdatePhotoResponse result = hotController.updatePhoto(request, clientIdHeader);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(hotService, times(1)).updatePhotoResp(any(UpdatePhoto.class));
    }

    @Test
    @DisplayName("updatePhoto - Should throw SoapUnauthorizedException for empty token")
    void testUpdatePhoto_EmptyToken() throws Exception {
        // Arrange
        UpdatePhoto request = new UpdatePhoto();
        request.setToken("");

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.updatePhoto(request, clientIdHeader));
        assertEquals("Invalid Token", exception.getMessage());
    }

    @Test
    @DisplayName("updatePhoto - Should throw SoapUnauthorizedException for expired token")
    void testUpdatePhoto_ExpiredToken() throws Exception {
        // Arrange
        UpdatePhoto request = new UpdatePhoto();
        request.setToken(VALID_TOKEN);

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(invalidTokenResponse);

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.updatePhoto(request, clientIdHeader));
        assertEquals("Token Expired", exception.getMessage());
    }

    // ==================== getScrumDetails() Tests ====================

    @Test
    @DisplayName("getScrumDetails - Should successfully get Scrum details without token")
    void testGetScrumDetails_Success() throws Exception {
        // Arrange
        GetScrumDetails request = new GetScrumDetails();
        GetDetailsResponse expectedResponse = new GetDetailsResponse();

        when(hotService.getScrumCandidateDetailsRequest(any(GetScrumDetails.class))).thenReturn(expectedResponse);

        // Act
        GetDetailsResponse result = hotController.getScrumDetails(request);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(hotService, times(1)).getScrumCandidateDetailsRequest(any(GetScrumDetails.class));
        // Verify no token validation is called
        verify(tokenDecryptionService, never()).tokenValidation1(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("getScrumDetails - Should handle service exception")
    void testGetScrumDetails_ServiceException() throws Exception {
        // Arrange
        GetScrumDetails request = new GetScrumDetails();
        when(hotService.getScrumCandidateDetailsRequest(any(GetScrumDetails.class)))
                .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> hotController.getScrumDetails(request));
    }

    // ==================== fetchClientIP() Tests ====================

    @Test
    @DisplayName("fetchClientIP - Should return IP address when request attributes are available")
    void testFetchClientIP_Success() throws Exception {
        // Arrange - Already set up in @BeforeEach

        // Act - fetchClientIP is called internally by other methods
        // We can verify it works by checking that token validation receives the IP
        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);
        request.setTypecode("1");
        GetPositionCountResponse expectedResponse = new GetPositionCountResponse();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.getPositionCount(any(GetPositionCount.class))).thenReturn(expectedResponse);

        // Act
        hotController.GetPositionCount(request, clientIdHeader);

        // Assert - Verify IP was passed to token validation
        verify(tokenDecryptionService, times(1)).tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString());
    }

    @Test
    @DisplayName("fetchClientIP - Should return empty string when request attributes are null")
    void testFetchClientIP_NullRequestAttributes() throws Exception {
        // Arrange
        RequestContextHolder.resetRequestAttributes(); // Clear request attributes

        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);
        request.setTypecode("1");
        GetPositionCountResponse expectedResponse = new GetPositionCountResponse();

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), eq("")))
                .thenReturn(validTokenResponse);
        when(hotService.getPositionCount(any(GetPositionCount.class))).thenReturn(expectedResponse);

        try {
            // Act
            hotController.GetPositionCount(request, clientIdHeader);

            // Assert - Verify empty string was passed when request attributes are null
            verify(tokenDecryptionService, times(1)).tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), eq(""));
        } finally {
            // Restore request attributes for other tests
            RequestContextHolder.setRequestAttributes(servletRequestAttributes);
        }
    }
    
    @Test
    @DisplayName("fetchClientIP - Should handle exception thrown by static getRequestAttributes method")
    void testFetchClientIP_NullRequestAttributes1() throws Exception {
        // Arrange
        RequestContextHolder.resetRequestAttributes(); // Clear request attributes

        // Mock static - force getRequestAttributes to throw an exception
        try (MockedStatic<RequestContextHolder> mockedStatic = Mockito.mockStatic(RequestContextHolder.class)) {
            mockedStatic.when(RequestContextHolder::getRequestAttributes)
                    .thenThrow(new RuntimeException("Failed to fetch request attributes"));

            GetPositionCount request = new GetPositionCount();
            request.setToken(VALID_TOKEN);
            request.setTypecode("1");
            GetPositionCountResponse expectedResponse = new GetPositionCountResponse();

            when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
            when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), eq("")))
                    .thenReturn(validTokenResponse);
            when(hotService.getPositionCount(any(GetPositionCount.class))).thenReturn(expectedResponse);

            try {
                // Act
                hotController.GetPositionCount(request, clientIdHeader);

                // Assert - Should still pass empty string as IP if exception occurs
                verify(tokenDecryptionService, times(1)).tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), eq(""));
            } finally {
                // Restore request attributes for other tests
                RequestContextHolder.setRequestAttributes(servletRequestAttributes);
            }
        }
    }

    // ==================== Exception Handling Tests ====================

    @Test
    @DisplayName("GetPositionCount - Should handle ValidateXmlHeader exception")
    void testGetPositionCount_ValidateHeaderException() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class)))
                .thenThrow(new Exception("Invalid header"));

        // Act & Assert
        assertThrows(Exception.class, () -> hotController.GetPositionCount(request, clientIdHeader));
        verify(tokenDecryptionService, never()).tokenValidation1(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("GetPositionCount - Should handle TokenDecryptionService exception")
    void testGetPositionCount_TokenValidationException() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenThrow(new SoapUnauthorizedException("Token validation failed"));

        // Act & Assert
        SoapUnauthorizedException exception = assertThrows(SoapUnauthorizedException.class,
                () -> hotController.GetPositionCount(request, clientIdHeader));
        assertTrue(exception.getMessage().contains("Token validation failed"));
    }

    @Test
    @DisplayName("GetPositionCount - Should handle service layer exception")
    void testGetPositionCount_ServiceException() throws Exception {
        // Arrange
        GetPositionCount request = new GetPositionCount();
        request.setToken(VALID_TOKEN);
        request.setTypecode("1");

        when(validateXmlHeader.validateHeader(any(SoapHeaderElement.class))).thenReturn(VALID_CLIENT_ID);
        when(tokenDecryptionService.tokenValidation1(eq(VALID_CLIENT_ID), eq(VALID_TOKEN), anyString()))
                .thenReturn(validTokenResponse);
        when(hotService.getPositionCount(any(GetPositionCount.class)))
                .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> hotController.GetPositionCount(request, clientIdHeader));
    }
}

