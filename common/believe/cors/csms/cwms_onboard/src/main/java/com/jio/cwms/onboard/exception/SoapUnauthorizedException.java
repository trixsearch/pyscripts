package com.jio.cwms.onboard.exception;

/**
 * Exception class for SOAP unauthorized errors that should return 401 Unauthorized
 */
public class SoapUnauthorizedException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    public SoapUnauthorizedException(String message) {
        super(message);
    }
    
    public SoapUnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}

