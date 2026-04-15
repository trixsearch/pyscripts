package com.jio.cwms.onboard.utils;

import java.util.List;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;

@Component
public class CDATAcreation {
	
	
	public String createCdata(List<Object> dataXml) throws Exception {
		
		String cdata = "";
		String cStart = "<NewDataSet>";
//		String cStart = "<![CDATA[<NewDataSet>";
//		String cEnd = "</NewDataSet>]]/>";
		String cEnd = "</NewDataSet>";
		String tStart = "<Table>";
		String tEnd = "</Table>";
		
		cdata += cStart;
		for (Object data : dataXml) {
			cdata += tStart;
			
			XmlMapper xmlMapper = new XmlMapper();
			String objXml = xmlMapper.writeValueAsString(data);
			String className = data.getClass().getName();
			className = className.substring(className.lastIndexOf('.') + 1);
			objXml = objXml.replaceAll("<" + className + ">", "").replaceAll("</" + className + ">", "");
			
			cdata += objXml + tEnd;
		}
		
		cdata += cEnd;
		
		
		cdata = cdata.replaceAll("<item>", "");
		cdata = cdata.replaceAll("<\\/item>", "");
		return cdata;
		
		
	}

}
