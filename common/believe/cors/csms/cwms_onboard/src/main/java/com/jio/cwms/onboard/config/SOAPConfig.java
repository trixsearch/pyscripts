package com.jio.cwms.onboard.config;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.Properties;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.ws.config.annotation.EnableWs;
import org.springframework.ws.config.annotation.WsConfigurerAdapter;
import org.springframework.ws.soap.saaj.SaajSoapMessageFactory;
import org.springframework.ws.soap.server.endpoint.SoapFaultDefinition;
import org.springframework.ws.transport.http.MessageDispatcherServlet;
import org.springframework.ws.wsdl.wsdl11.Wsdl11Definition;
import org.springframework.xml.xsd.SimpleXsdSchema;
import org.springframework.xml.xsd.XsdSchema;
import com.jio.cwms.onboard.controller.HOTController;
import com.jio.cwms.onboard.exception.SoapUnauthorizedException;
import com.jio.cwms.onboard.exception.SoapValidationException;
import jakarta.xml.soap.MessageFactory;
import jakarta.xml.soap.MimeHeaders;
import jakarta.xml.soap.SOAPConstants;
import jakarta.xml.soap.SOAPException;
import jakarta.xml.soap.SOAPMessage;

@EnableWs
@Configuration
public class SOAPConfig extends WsConfigurerAdapter {
	@Bean
	public ServletRegistrationBean<MessageDispatcherServlet> messageDispatcherServlet(ApplicationContext applicationContext) {
		MessageDispatcherServlet servlet = new MessageDispatcherServlet();
		servlet.setApplicationContext(applicationContext);
		servlet.setTransformWsdlLocations(false);
		return new ServletRegistrationBean<>(servlet, "/candidateOperations/*");
	}


	@Bean(name = "hot")
	public Wsdl11Definition defaultWsdl11Definition(XsdSchema hotSchema) {
		MyWsdl11Definition wsdl11Definition = new MyWsdl11Definition();
		wsdl11Definition.setPortTypeName("Service1");
		wsdl11Definition.setTargetNamespace("http://tempuri.org/");
		Properties soapActions = new Properties();
	    for (Method method : HOTController.class.getMethods() ) {
	        soapActions.setProperty(method.getName(), "http://tempuri.org/" + method.getName());
	    }
	    wsdl11Definition.setSoapActions(soapActions);
	    wsdl11Definition.setRequestSuffix("");
		wsdl11Definition.setSchema(hotSchema);
		wsdl11Definition.setCreateSoap11Binding(true);
		wsdl11Definition.setCreateSoap12Binding(true);
		wsdl11Definition.setLocationUri("https://cwms-admin.ril.com/onboard/candidateOperations");
		return wsdl11Definition;
	}

	@Bean
	public XsdSchema hotSchema() {
		return new SimpleXsdSchema(new ClassPathResource("hot.xsd"));
	}
	
	@Bean
	  public SaajSoapMessageFactory messageFactory() throws SOAPException {
	    MessageFactory messageFactorySoap11 =
	        MessageFactory.newInstance(SOAPConstants.SOAP_1_1_PROTOCOL);
	    MessageFactory messageFactorySoap12 =
	        MessageFactory.newInstance(SOAPConstants.SOAP_1_2_PROTOCOL);
	    ThreadLocal<MessageFactory> appropriateMessageFactory = new ThreadLocal<>();
	    MessageFactory messageFactoryWrapper =
	        new MessageFactory() {
	          @Override
	          public SOAPMessage createMessage() throws SOAPException {
	            return appropriateMessageFactory.get().createMessage();
	          }

	          @Override
	          public SOAPMessage createMessage(MimeHeaders headers, InputStream in)
	              throws IOException, SOAPException {
	            String[] header = headers.getHeader(HttpHeaders.CONTENT_TYPE);
	            boolean isSoap12 =
	                (header != null
	                    && header[0] != null
	                    && (header[0].toLowerCase()).startsWith("application/soap+xml"));
	            appropriateMessageFactory.set(isSoap12 ? messageFactorySoap12 : messageFactorySoap11);
	            return appropriateMessageFactory.get().createMessage(headers, in);
	          }
	        };
	    return new SaajSoapMessageFactory(messageFactoryWrapper);
	  }
	
	@Bean
	public SoapFaultExceptionResolver exceptionResolver() {
		SoapFaultExceptionResolver resolver = new SoapFaultExceptionResolver();
		Properties mappings = new Properties();
    	mappings.put(SoapValidationException.class.getName(), SoapFaultDefinition.CLIENT.toString());
		mappings.put(SoapUnauthorizedException.class.getName(), SoapFaultDefinition.CLIENT.toString());
		mappings.put(Exception.class.getName(), SoapFaultDefinition.CLIENT.toString());
		resolver.setExceptionMappings(mappings);
		resolver.setOrder(0);
		return resolver;
	}

}
