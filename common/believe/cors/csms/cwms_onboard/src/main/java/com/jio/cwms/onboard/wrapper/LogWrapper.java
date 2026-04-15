package com.jio.cwms.onboard.wrapper;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class LogWrapper {

	private static final String INFO    =  "Info";
	private static final String DEBUG   =  "Debug";
	private static final String WARN    =  "Warn";
	private static final String ERROR   =  "Error";
	private static final String TRACE   =  "Trace";
	private static final String FATAL   =  "Fatal";

	private LogWrapper() {
		/* Default constructor */
	}

	public static Logger getLogger(Class<?> clazz){
		return LogManager.getLogger(clazz);
	}

	public static void error(Class<?> clazz, String msg) {
		log(ERROR, clazz, msg, null);
	}

	public static void error(Class<?> clazz, String msg, Throwable throwable) {
		log(ERROR, clazz, msg, throwable);
	}

	public static void fatal(Class<?> clazz, String msg) {
		log(FATAL, clazz, msg, null);
	}

	public static void info(Class<?> clazz, String msg) {
		log(INFO, clazz, msg, null);
	}

	public static void warn(Class<?> clazz, String msg, Throwable throwable) {
		log(WARN, clazz, msg, throwable);
	}

	public static void debug(Class<?> clazz, String msg, Throwable throwable) {
		log(DEBUG, clazz, msg, throwable);
	}
	public static void warn(Class<?> clazz, String msg) {
		log(WARN, clazz, msg, null);
	}

	public static void debug(Class<?> clazz, String msg) {
		log(DEBUG, clazz, msg, null);
	}

	public static void trace(Class<?> clazz, String msg) {
		log(DEBUG, clazz, msg, null);
	}

	private static void log(String level, Class<?> clazz, String msg, Throwable throwable) {
		final var logger = LogManager.getLogger(LogWrapper.class);
		var message = String.format("[%s] : %s", clazz, msg);
		switch (level) {
		case INFO:
			logger.info(message, throwable);
			break;
		case WARN:
			logger.warn(message, throwable);
			break;
		case ERROR:
			logger.error(message, throwable);
			break;
		case FATAL:
			logger.fatal(message, throwable);
			break;
		case TRACE:
			logger.fatal(message, throwable);
			break;
		default:
		case DEBUG:
			logger.debug(message, throwable);
		}
	}

}
