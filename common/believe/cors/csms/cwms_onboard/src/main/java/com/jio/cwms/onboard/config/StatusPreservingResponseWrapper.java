package com.jio.cwms.onboard.config;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

/**
 * Response wrapper that preserves custom HTTP status codes
 * and prevents them from being overridden to 500
 */
public class StatusPreservingResponseWrapper extends HttpServletResponseWrapper {
    
    private Integer customStatus = null;
    private boolean statusSet = false;
    
    public StatusPreservingResponseWrapper(HttpServletResponse response) {
        super(response);
    }
    
    @Override
    public void setStatus(int sc) {
        // If status is 401 or 400, preserve it
        if (sc == HttpServletResponse.SC_UNAUTHORIZED || 
            sc == HttpServletResponse.SC_BAD_REQUEST) {
            customStatus = sc;
            statusSet = true;
            super.setStatus(sc);
        // } else if (sc == HttpServletResponse.SC_SERVICE_UNAVAILABLE) {
        //     customStatus = sc;
        //     statusSet = true;
        //     super.setStatus(sc);
        } else if (!statusSet || sc == HttpServletResponse.SC_INTERNAL_SERVER_ERROR) {
            // Don't allow 500 to override our custom status
            if (customStatus != null) {
                super.setStatus(customStatus);
            } else {
                super.setStatus(sc);
            }
        } else {
            super.setStatus(sc);
        }
    }
    
    @Override
    public void sendError(int sc) throws java.io.IOException {
        // Preserve 401/400 status codes
        if (sc == HttpServletResponse.SC_UNAUTHORIZED || 
            sc == HttpServletResponse.SC_BAD_REQUEST) {
            customStatus = sc;
            statusSet = true;
        }
        super.sendError(sc);
    }
    
    @Override
    public void sendError(int sc, String msg) throws java.io.IOException {
        // Preserve 401/400 status codes
        if (sc == HttpServletResponse.SC_UNAUTHORIZED || 
            sc == HttpServletResponse.SC_BAD_REQUEST) {
            customStatus = sc;
            statusSet = true;
        }
        super.sendError(sc, msg);
    }
}

