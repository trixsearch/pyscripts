package com.jio.cwms.onboard;

import org.springframework.boot.Banner.Mode;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.web.context.request.RequestContextListener;

@SpringBootApplication
@EnableDiscoveryClient
public class CWMSOnboardApplication {

	public static void main(final String[] args) {
		final var app = new SpringApplication(CWMSOnboardApplication.class);
		app.setAddCommandLineProperties(true);
		app.setAllowBeanDefinitionOverriding(false);
		app.setBannerMode(Mode.CONSOLE);
		app.run(args);
	}
	
	@Bean
    public RequestContextListener requestContextListener() {
        return new RequestContextListener();
    }

}
