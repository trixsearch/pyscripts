package com.jio.cwms_dataprovision.config;

import java.lang.reflect.InvocationTargetException;
import java.sql.Driver;

import javax.sql.DataSource;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.SimpleDriverDataSource;
import org.springframework.stereotype.Component;
import org.springframework.util.ClassUtils;

import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Component
public class ScrumJdbcTempalte {
	
	@Autowired
	private ApplicationConfig applicationConfig;
	
	public JdbcTemplate getScrumJdbcTemplate() throws InstantiationException, IllegalAccessException, IllegalArgumentException, InvocationTargetException {
		final String driverClassName = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
		 final String jdbcUrl = applicationConfig.getScrumApiFields().getDamserverIpUrl();
		 final String username = applicationConfig.getScrumApiFields().getDamUsername();
		 final String password = applicationConfig.getScrumApiFields().getDamPassword();
		 
	
	    final Class<?> driverClass = ClassUtils.resolveClassName(driverClassName, this.getClass().getClassLoader());
	    final Driver driver = (Driver) ClassUtils.getConstructorIfAvailable(driverClass).newInstance();
	    final DataSource dataSource = new SimpleDriverDataSource(driver, jdbcUrl, username, password);

	    return new JdbcTemplate(dataSource);
		
	}
	
	public JdbcTemplate getO2CJdbcTemplate() throws InstantiationException, IllegalAccessException, IllegalArgumentException, InvocationTargetException {
		final String driverClassName = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
		 final String jdbcUrl = applicationConfig.getO2cApiFields().getDamserverIpUrl();
		 final String username = applicationConfig.getO2cApiFields().getDamUsername();
		 final String password = applicationConfig.getO2cApiFields().getDamPassword();
		 
	
	    final Class<?> driverClass = ClassUtils.resolveClassName(driverClassName, this.getClass().getClassLoader());
	    final Driver driver = (Driver) ClassUtils.getConstructorIfAvailable(driverClass).newInstance();
	    final DataSource dataSource = new SimpleDriverDataSource(driver, jdbcUrl, username, password);

	    return new JdbcTemplate(dataSource);
		
	}
	
	public JdbcTemplate getO2CApprovalStatusTemplate() throws InstantiationException, IllegalAccessException, IllegalArgumentException, InvocationTargetException {
		final String driverClassName = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
		 final String jdbcUrl = applicationConfig.getO2cApp().getDamserverIpUrl();
		 final String username = applicationConfig.getO2cApp().getDamUsername();
		 final String password = applicationConfig.getO2cApp().getDamPassword();
		 
	
	    final Class<?> driverClass = ClassUtils.resolveClassName(driverClassName, this.getClass().getClassLoader());
	    final Driver driver = (Driver) ClassUtils.getConstructorIfAvailable(driverClass).newInstance();
	    final DataSource dataSource = new SimpleDriverDataSource(driver, jdbcUrl, username, password);

	    return new JdbcTemplate(dataSource);
	}
	
	public JdbcTemplate getSitDb() throws InstantiationException, IllegalAccessException, IllegalArgumentException, InvocationTargetException  {
		final String driverClassName = "com.mysql.cj.jdbc.Driver";
	    final String jdbcUrl = "jdbc:mysql://10.173.173.32:3306/dosbsit?autoReconnect=true";
	    final String username = "cwmssitrw";
	    final String password = "Cwmssitrw#2018";
	    
	    final Class<?> driverClass = ClassUtils.resolveClassName(driverClassName, this.getClass().getClassLoader());
	    final Driver driver = (Driver) ClassUtils.getConstructorIfAvailable(driverClass).newInstance();
	    final DataSource dataSource = new SimpleDriverDataSource(driver, jdbcUrl, username, password);

	    return new JdbcTemplate(dataSource);
		
	}
	
	public JdbcTemplate getO2CApprovalStatusTemplateMySql() throws InstantiationException, IllegalAccessException, IllegalArgumentException, InvocationTargetException {
		 
		 try {
			 JSONObject obj = new JSONObject(applicationConfig.getO2cApp().getDam_tablename());
			 
			 LogWrapper.info(getClass(), "Jdbc Url "+obj.getString("jdbcUrl") + " :: username "+obj.getString("username")  +
					 ":: password "+ obj.getString("password"));
				
				final String driverClassName = "com.mysql.cj.jdbc.Driver";
				 final String jdbcUrl = obj.getString("jdbcUrl");
				 final String username = obj.getString("username");
				 final String password = obj.getString("password");
	            Class.forName(driverClassName);
	            DataSource dataSource = new DriverManagerDataSource(jdbcUrl, username, password);
	            return new JdbcTemplate(dataSource);
	        } catch (ClassNotFoundException e) {
	            e.printStackTrace(); // Handle or log the exception appropriately
	            return null;
	        }

	}
}
