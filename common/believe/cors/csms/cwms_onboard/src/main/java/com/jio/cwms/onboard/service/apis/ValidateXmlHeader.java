package com.jio.cwms.onboard.service.apis;

import javax.xml.transform.Source;
import javax.xml.transform.dom.DOMSource;

import org.springframework.stereotype.Service;
import org.springframework.ws.soap.SoapHeaderElement;
import org.w3c.dom.Node;

import com.jio.cwms.onboard.wrapper.LogWrapper;

@Service
public class ValidateXmlHeader {
	
	public String validateHeader(SoapHeaderElement clientIdHeader) throws Exception {
		String  clientId=null;
		
		if (clientIdHeader != null) {
	        try {
	            Source source = clientIdHeader.getSource();
	            DOMSource domSource = (DOMSource) source;
	            Node node = domSource.getNode();
	            clientId = node.getTextContent();
	            LogWrapper.info(getClass(), "clientId from header: " + clientId);
	        } catch (Exception e) {
	            throw new Exception("Error parsing clientId header", e);
	        }
	    } else {
	        throw new Exception("Missing required SOAP header: clientId");
	    }
		
		return clientId;
		
	}

}
