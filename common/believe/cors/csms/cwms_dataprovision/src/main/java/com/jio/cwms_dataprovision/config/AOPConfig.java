package com.jio.cwms_dataprovision.config;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Aspect
@Component
public class AOPConfig {
	
	@Before(value = "execution(* com.jio.cwms_dataprovision.controller.*.*(..))")
	public void beforeAdviceController(JoinPoint joinPoint) {
		LogWrapper.info(joinPoint.getSignature().getDeclaringType() , "Execution Started for controller method : " + joinPoint.getSignature().getName());
	}
	
	@After(value = "execution(* com.jio.cwms_dataprovision.controller.*.*(..))")
	public void afterAdviceController(JoinPoint joinPoint) {
		LogWrapper.info(joinPoint.getSignature().getDeclaringType() , "Execution Ended for controller method : " + joinPoint.getSignature().getName());
	}
	
	@Before(value = "execution(* com.jio.cwms_dataprovision.service.*.*(..))")
	public void beforeAdviceService(JoinPoint joinPoint) {
		LogWrapper.info(joinPoint.getSignature().getDeclaringType() , "Execution Started for service method : " + joinPoint.getSignature().getName());
	}
	
	@After(value = "execution(* com.jio.cwms_dataprovision.service.*.*(..))")
	public void afterAdviceService(JoinPoint joinPoint) {
		LogWrapper.info(joinPoint.getSignature().getDeclaringType() , "Execution Ended for service method : " + joinPoint.getSignature().getName());
	}

}
