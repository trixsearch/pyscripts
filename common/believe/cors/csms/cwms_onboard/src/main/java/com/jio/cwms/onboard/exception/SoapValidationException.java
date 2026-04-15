package com.jio.cwms.onboard.exception;

/**
 * Exception class for SOAP validation errors that should return 400 Bad Request
 */
public class SoapValidationException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    public SoapValidationException(String message) {
        super(message);
    }
    
    public SoapValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}

