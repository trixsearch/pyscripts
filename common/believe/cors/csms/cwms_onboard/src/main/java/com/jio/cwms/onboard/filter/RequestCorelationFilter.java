package com.jio.cwms.onboard.filter;

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import com.google.gson.Gson;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(2)
public class RequestCorelationFilter extends OncePerRequestFilter {

	@Autowired
	private Gson gson;

	@Override
	protected void doFilterInternal(final HttpServletRequest request, final HttpServletResponse response, final FilterChain filterChain) throws ServletException, IOException {
		try {
			logRequestDetails(request);
			filterChain.doFilter(request, response);
		} finally {
			MDC.remove("requestId");
		}
	}

	private void logRequestDetails(final HttpServletRequest request) {
		if (!logger.isDebugEnabled()) {
			return;
		}
		final HttpServletRequest cachedRequest = new ContentCachingRequestWrapper(request);
		final Map<String, Object> requestLog = new HashMap<>();
		requestLog.put("url", cachedRequest.getRequestURL());
		requestLog.put("method", cachedRequest.getMethod());
		requestLog.put("headers", getHeaders(cachedRequest));
		requestLog.put("body", getRequestBody(cachedRequest));
		logger.debug(requestLog);
	}

	private Object getRequestBody(final HttpServletRequest cachedRequest) {
		try {
			if (cachedRequest.getContentLength() < 4000) {
				return gson.fromJson(cachedRequest.getReader(), Map.class);
			}
			return "Request body character count exceeds max limit of 4000";
		} catch (final IOException e) {
			return "Unable to read the request body";
		}
	}

	private Map<String, String> getHeaders(final HttpServletRequest cachedRequest) {
		final Map<String, String> headerMap = new HashMap<>();
		final Enumeration<String> requestHeaderNames = cachedRequest.getHeaderNames();
		while (requestHeaderNames.hasMoreElements()) {
			final String headerName = requestHeaderNames.nextElement();
			headerMap.put(headerName, cachedRequest.getHeader(headerName));
		}
		return headerMap;
	}

}
