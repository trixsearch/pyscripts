package com.jio.cwms_dataprovision.wrapper;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class LogWrapper  {
	 private static  Logger logger = LogManager.getLogger(LogWrapper.class);
	 
	public LogWrapper() {
	}
	public static Logger getLogger(Class clazz){
		return LogManager.getLogger(clazz);
	}
	
	public static void error(Class clazz, String msg) {
        log("Error", clazz, msg, null);
    }

	public static void error(Class clazz, String msg, Throwable throwable) {
        log("Error", clazz, msg, throwable);
    }
 
    public static void fatal(Class clazz, String msg) {
        log("Fatal", clazz, msg, null);
    }

    public static void info(Class clazz, String msg) {
        log("Info", clazz, msg, null);
    }

 
    public static void warn(Class clazz, String msg, Throwable throwable) {
        log("Warn", clazz, msg, throwable);
    }
    
    public static void debug(Class clazz, String msg, Throwable throwable) {
        log("Debug", clazz, msg, throwable);
    }
    public static void warn(Class clazz, String msg) {
        log("Warn", clazz, msg, null);
    }
    
    public static void debug(Class clazz, String msg) {
        log("Debug", clazz, msg, null);
    }
    public static void trace(Class clazz, String msg) {
        log("Debug", clazz, msg, null);
    }

	
	  private static void log(String level, Class clazz, String msg, Throwable throwable) {
		  logger = LogManager.getLogger(clazz);
	        String message = String.format("[%s] : %s", clazz, msg);
	        switch (level) {
	            case "Info":
	                logger.info(message, throwable);
	                break;
	            case "Warn":
	                logger.warn(message, throwable);
	                break;
	            case "Error":
	                logger.error(message, throwable);
	                break;
	            case "Fatal":
	                logger.fatal(message, throwable);
	                break;
	            case "Trace":
	                logger.fatal(message, throwable);
	                break;
	            default:
	            case "Debug":
	                logger.debug(message, throwable);
	        }
	    }
	
}
