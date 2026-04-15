package com.jio.cwms.onboard.utils;

import java.net.InetAddress;
import java.net.UnknownHostException;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class HttpRequestUtils {

	private HttpRequestUtils() {
		/* Default constructor */
	}

	public static String getRemoteIPAddress(final HttpServletRequest request) {
		final var requestURL = request.getRequestURL().toString();

		String remoteAddress = null;

		try {

			remoteAddress = request.getHeader("X-FORWARDED-FOR");

			if ((remoteAddress == null) || "".equals(remoteAddress)) {
				remoteAddress = request.getRemoteAddr();
			}

		} catch (final Exception e) {

			HttpRequestUtils.log.error("Exception occurred while reading remote IP address in HTTP request | Exception: {} | Message: {} | Cause: {}",
					e.getClass().getCanonicalName(),
					ExceptionUtils.getMessage(e),
					ExceptionUtils.getRootCauseMessage(e)
					);
		}

		if (StringUtils.isEmpty(remoteAddress) || StringUtils.isBlank(remoteAddress)) {
			HttpRequestUtils.log.warn("No remote IP address found in request | Request URL: {}", requestURL);
			return StringUtils.EMPTY;
		}

		if ("0:0:0:0:0:0:0:1".equals(remoteAddress)) {
			try {
				remoteAddress = InetAddress.getLocalHost().getHostAddress();
			} catch (final UnknownHostException e) {

				HttpRequestUtils.log.error("Exception occurred while reading localhost IP address | Request URL: {} | Exception: {} | Message: {} | Cause: {}",
						requestURL,
						e.getClass().getCanonicalName(),
						ExceptionUtils.getMessage(e),
						ExceptionUtils.getRootCauseMessage(e)
						);
			}
		} else {
			remoteAddress = remoteAddress.split(",")[0];
			remoteAddress = remoteAddress.split(":")[0];
		}

		return remoteAddress;
	}

}
