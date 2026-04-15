package com.jio.cwms.onboard.config;

import org.springframework.util.Assert;
import org.springframework.ws.wsdl.wsdl11.provider.SuffixBasedMessagesProvider;
import org.w3c.dom.Element;


public class MySuffixBasedMessagesProvider extends SuffixBasedMessagesProvider {

    protected String requestSuffix = DEFAULT_REQUEST_SUFFIX;

    public String getRequestSuffix() {
        return this.requestSuffix;
    }

    public void setRequestSuffix(String requestSuffix) {
        this.requestSuffix = requestSuffix;
    }

    @Override
    protected boolean isMessageElement(Element element) {
        if (isMessageElement0(element)) {
            String elementName = getElementName(element);
            Assert.hasText(elementName, "Element has no name");
            return elementName.endsWith(getResponseSuffix()) || elementName.endsWith("Result")
                    || (getRequestSuffix().isEmpty() ? true : elementName.endsWith(getRequestSuffix()))
                    || elementName.endsWith(getFaultSuffix());
        }
        return false;
    }

    protected boolean isMessageElement0(Element element) {
        return "element".equals(element.getLocalName())
                && "http://www.w3.org/2001/XMLSchema".equals(element.getNamespaceURI());
    }
}