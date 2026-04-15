package com.jio.cwms.onboard.utils;

public class RegexUtils {

	/**
	 * 
	 * Default constructor made private to restrict 
	 * class instantiation because all methods 
	 * are intended to be accessed statically
	 * 
	 */
	private RegexUtils() {
		/* Default Constructor */
	}

	public static final String MOBILE_NUMBER_VAL_REGEX = "^[6-9]\\d{9}$";

	public static final String IMEI_VAL_REGEX = "^[a-zA-Z0-9]{15,16}$";

	public static final String OTP_KEY_VAL_REGEX = "^[a-zA-Z0-9]{16}$";

	public static final String SECO_AUTH_TOKEN_VAL_REGEX = "^[a-zA-Z0-9-_ ]{36,46}$";
	
	public static final String IP_VAL_REGEX = "(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])";

	public static final String EMPTY_REGEX = "";

}