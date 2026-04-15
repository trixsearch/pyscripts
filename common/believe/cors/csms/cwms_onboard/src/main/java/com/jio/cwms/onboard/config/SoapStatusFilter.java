package com.jio.cwms.onboard.config;

import java.io.IOException;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filter that wraps the response to preserve custom HTTP status codes
 * for SOAP endpoints
 */
@Component
@Order(1)
public class SoapStatusFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
            FilterChain filterChain) throws ServletException, IOException {
        
        // Only apply to SOAP endpoints
        if (request.getRequestURI().contains("/candidateOperations")) {
            StatusPreservingResponseWrapper wrappedResponse = 
                new StatusPreservingResponseWrapper(response);
            filterChain.doFilter(request, wrappedResponse);
        } else {
            filterChain.doFilter(request, response);
        }
    }
}

