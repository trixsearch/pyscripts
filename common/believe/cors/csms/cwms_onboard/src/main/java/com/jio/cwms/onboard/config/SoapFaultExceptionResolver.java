package com.jio.cwms.onboard.config;

import javax.xml.namespace.QName;
import org.springframework.ws.soap.SoapFault;
import org.springframework.ws.soap.SoapFaultDetail;
import org.springframework.ws.soap.server.endpoint.SoapFaultDefinition;
import org.springframework.ws.soap.server.endpoint.SoapFaultMappingExceptionResolver;
import org.springframework.ws.transport.context.TransportContext;
import org.springframework.ws.transport.context.TransportContextHolder;
import org.springframework.ws.transport.http.HttpServletConnection;
import com.jio.cwms.onboard.exception.SoapUnauthorizedException;
import com.jio.cwms.onboard.exception.SoapValidationException;
import com.jio.cwms.onboard.wrapper.LogWrapper;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Custom SOAP exception resolver that maps validation exceptions to SOAP faults
 * with appropriate HTTP status codes (400 for validation errors, 401 for unauthorized)
 */
public class SoapFaultExceptionResolver extends SoapFaultMappingExceptionResolver {

    @Override
    protected SoapFaultDefinition getFaultDefinition(Object endpoint, Exception ex) {
        // Set HTTP status code BEFORE creating the fault definition
        if (ex instanceof SoapUnauthorizedException) {
            setHttpStatus(HttpServletResponse.SC_UNAUTHORIZED);
        } else if (ex instanceof SoapValidationException) {
            setHttpStatus(HttpServletResponse.SC_BAD_REQUEST);
        }else if (ex instanceof Exception) {
            setHttpStatus(HttpServletResponse.SC_BAD_REQUEST);
        }
        
        // Now create the fault definition
        if (ex instanceof SoapUnauthorizedException) {
            // Map unauthorized exceptions to Client fault (results in 401 Unauthorized)
            SoapFaultDefinition faultDefinition = new SoapFaultDefinition();
            faultDefinition.setFaultCode(SoapFaultDefinition.CLIENT);
            faultDefinition.setFaultStringOrReason(ex.getMessage() != null ? ex.getMessage() : "Unauthorized");
            return faultDefinition;
        }
         else if (ex instanceof SoapValidationException) {
            // Map validation exceptions to Client fault (results in 400 Bad Request)
            SoapFaultDefinition faultDefinition = new SoapFaultDefinition();
            faultDefinition.setFaultCode(SoapFaultDefinition.CLIENT);
            faultDefinition.setFaultStringOrReason(ex.getMessage() != null ? ex.getMessage() : "Bad Request");
            return faultDefinition;
        }
        
         else if (ex instanceof Exception) {
            SoapFaultDefinition faultDefinition = new SoapFaultDefinition();
            faultDefinition.setFaultCode(SoapFaultDefinition.CLIENT);
            faultDefinition.setFaultStringOrReason(ex.getMessage() != null ? ex.getMessage() : "Internal Error");
            return faultDefinition;
        }
        // For other exceptions, use default Server fault (500)
        return super.getFaultDefinition(endpoint, ex);
    }
    
    private void setHttpStatus(int statusCode) {
        try {
            TransportContext context = TransportContextHolder.getTransportContext();
            if (context != null && context.getConnection() instanceof HttpServletConnection) {
                HttpServletConnection connection = (HttpServletConnection) context.getConnection();
                HttpServletResponse response = connection.getHttpServletResponse();
                if (response != null) {
                    boolean committed = response.isCommitted();
                    LogWrapper.info(getClass(), "Setting HTTP status to " + statusCode + ", response committed: " + committed);
                    if (!committed) {
                        // Set status code - the wrapper will preserve it
                        response.setStatus(statusCode);
                        // Also set as response header to ensure it's preserved
                        response.setHeader("X-SOAP-Status-Code", String.valueOf(statusCode));
                        // Store in request attribute as backup
                        if (connection.getHttpServletRequest() != null) {
                            connection.getHttpServletRequest().setAttribute("SOAP_HTTP_STATUS", statusCode);
                        }
                        LogWrapper.info(getClass(), "HTTP status set to " + statusCode);
                    } else {
                        LogWrapper.warn(getClass(), "Cannot set HTTP status - response already committed");
                    }
                }
            } else {
                LogWrapper.warn(getClass(), "TransportContext or connection is null");
            }
        } catch (Exception e) {
            LogWrapper.error(getClass(), "Error setting HTTP status: " + e.getMessage(), e);
        }
    }

    @Override
    protected void customizeFault(Object endpoint, Exception ex, SoapFault fault) {
        if (ex instanceof SoapUnauthorizedException) {
            // Set HTTP status code to 401 for unauthorized errors
            try {
                TransportContext context = TransportContextHolder.getTransportContext();
                if (context != null && context.getConnection() instanceof HttpServletConnection) {
                    HttpServletConnection connection = (HttpServletConnection) context.getConnection();
                HttpServletResponse response = connection.getHttpServletResponse();
                if (response != null && !response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                }
                }
            } catch (Exception e) {
                // If we can't set the status, the fault code should still work
            }
            
            // Add detail if available
//            try {
//                SoapFaultDetail detail = fault.addFaultDetail();
//                QName validationErrorQName = new QName("http://tempuri.org/", "ValidationError");
//                detail.addFaultDetailElement(validationErrorQName)
//                    .addText(ex.getMessage() != null ? ex.getMessage() : "Unauthorized");
//            } catch (Exception e) {
//                // If detail cannot be added, the fault definition will still be set correctly
//            }
        } else if (ex instanceof SoapValidationException) {
            // Set HTTP status code to 400 for validation errors
            try {
                TransportContext context = TransportContextHolder.getTransportContext();
                if (context != null && context.getConnection() instanceof HttpServletConnection) {
                    HttpServletConnection connection = (HttpServletConnection) context.getConnection();
                HttpServletResponse response = connection.getHttpServletResponse();
                if (response != null && !response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                }
                }
            } catch (Exception e) {
                // If we can't set the status, the fault code should still work
            }
            
            // Add detail if available
//            try {
//                SoapFaultDetail detail = fault.addFaultDetail();
//                QName validationErrorQName = new QName("http://tempuri.org/", "ValidationError");
//                detail.addFaultDetailElement(validationErrorQName)
//                    .addText(ex.getMessage() != null ? ex.getMessage() : "Bad Request");
//            } catch (Exception e) {
//                // If detail cannot be added, the fault definition will still be set correctly
//            }
        }
        
        else if (ex instanceof Exception) {
            // Set HTTP status code to 401 for unauthorized errors
            try {
                TransportContext context = TransportContextHolder.getTransportContext();
                if (context != null && context.getConnection() instanceof HttpServletConnection) {
                    HttpServletConnection connection = (HttpServletConnection) context.getConnection();
                HttpServletResponse response = connection.getHttpServletResponse();
                if (response != null && !response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                }
                }
            } catch (Exception e) {
                // If we can't set the status, the fault code should still work
            }
            
            // Add detail if available
//            try {
//                SoapFaultDetail detail = fault.addFaultDetail();
//                QName validationErrorQName = new QName("http://tempuri.org/", "ValidationError");
//                detail.addFaultDetailElement(validationErrorQName)
//                    .addText(ex.getMessage() != null ? ex.getMessage() : "Unauthorized");
//            } catch (Exception e) {
//                // If detail cannot be added, the fault definition will still be set correctly
//            }
        } 
    }
}

