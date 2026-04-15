package com.jio.cwms_dataprovision.service;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.config.ScrumJdbcTempalte;
import com.jio.cwms_dataprovision.constants.AppStatus;
import com.jio.cwms_dataprovision.constants.ServiceDataEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;
import com.jio.cwms_dataprovision.dto.Response;
import com.jio.cwms_dataprovision.dto.mHere.MHereO2CSiteList;
import com.jio.cwms_dataprovision.repository.JioRoleMasterRepository;
import com.jio.cwms_dataprovision.repository.O2CRoleMasterRepository;
import com.jio.cwms_dataprovision.repository.RelienceRetailsMasterRepositiry;

import jakarta.annotation.PostConstruct;

@Service
public class ConditionCheckService {

	@Autowired
	ExecutionService executionService;

	@Autowired
	PRMService prmService;

	@Autowired
	OIMService oimService;

	@Autowired
	ScrumJdbcTempalte jdbcTempalteConfig;

	@Autowired
	O2CRoleMasterRepository o2cRepo;

	@Autowired
	JioRoleMasterRepository jioRepo;

	@Autowired
	ScrumService scrumService;

	@Autowired
	RarsService rarsService;
	
	@Autowired
	MHereService mHereService;

	@Autowired
	JdbcTemplate jdbcTemp;

	@Autowired
	RelienceRetailsMasterRepositiry relienceRepo;

	@Autowired
	WCSService wcsService;

	@Autowired
	CUAService cuaService;

	@Autowired
	CUANewService cuanewService;
	
	@Autowired
	SLPService slpService;

	@Autowired
	ApplicationConfig appConfig;
	
//	@Autowired
//	GrcTerminationService grcTerminationService;
	
	@Autowired
	ObjectMapper objectMapper;

	private final LinkedHashMap<String, GeneralService> serviceMap = new LinkedHashMap<>();

	@PostConstruct
	public void loadCondition() {
		serviceMap.put(ServiceDataEnum.PRM.name(), prmService);
		serviceMap.put(ServiceDataEnum.OIM.name(), oimService);
		serviceMap.put(ServiceDataEnum.WCS.name(), wcsService);
		serviceMap.put(ServiceDataEnum.CUA.name(), cuaService);
		serviceMap.put(ServiceDataEnum.CUA_NEW.name(), cuanewService);
		serviceMap.put(ServiceDataEnum.RARS.name(), rarsService);
		serviceMap.put(ServiceDataEnum.SCRUM.name(), scrumService);
		serviceMap.put(ServiceDataEnum.MHERE.name(), mHereService);
		serviceMap.put(ServiceDataEnum.SLP.name(), slpService);
	}

	private static final List<String> rarsSiteList = List.of("JIO", "RR");

	public Response conditionCheckForServices(GeneralRequest request) throws Exception {

		if (!StringUtils.isEmpty(request.getResource_Details().getPermanent_Address())) {
			request.getResource_Details()
					.setPermanent_Address(request.getResource_Details().getPermanent_Address().replaceAll("'", " "));
		}
		if (!StringUtils.isEmpty(request.getResource_Details().getLocal_Address())) {
			request.getResource_Details()
					.setLocal_Address(request.getResource_Details().getLocal_Address().replaceAll("'", " "));
		}
		if (!StringUtils.isEmpty(request.getResource_Details().getDomicile_Address())) {
			request.getResource_Details()
					.setDomicile_Address(request.getResource_Details().getDomicile_Address().replaceAll("'", " "));
		}
		if (!StringUtils.isEmpty(request.getResource_Details().getTermination_Remark())) {
			request.getResource_Details()
					.setTermination_Remark(request.getResource_Details().getTermination_Remark().replaceAll("'", " "));
		}
		

		List<GeneralService> serviceList = new ArrayList<>();

		if (request.getServiceList() != null && !request.getServiceList().isEmpty()) {
			for (String service : request.getServiceList()) {
				serviceList.add(serviceMap.get(service.toUpperCase()));
			}
		}

		else {
			if (Arrays.asList(appConfig.getOrgList().getDamSiteService().split(","))
					.contains(request.getResource_Details().getOrganization())) {

				if (request.getResource_Details().getTransMode().contains("VEN")) {
					serviceList.add(oimService);
					return executionService.executeServices(serviceList, request);
				}

				serviceList.add(scrumService);
				if (request.getResource_Details().getApproval_Status().equals(AppStatus.APP.toString())) {

					if (rarsSiteList.contains(request.getResource_Details().getSiteID())) {
						serviceList.add(rarsService);
						serviceList.add(mHereService);
					}
					
					if(request.getResource_Details().getOrganization().equalsIgnoreCase("O2C"))
					{
						List<MHereO2CSiteList> matchingResults = checkO2CSitesCombinations(request.getResource_Details());
						if(matchingResults.size() != 0) {
							serviceList.add(mHereService);
							serviceList.add(oimService);
						}
					 }

//					if(request.getResource_Details().getSiteID().equalsIgnoreCase("JIO") && request.getResource_Details().getTransMode().equalsIgnoreCase("TER")) {
//						serviceList.add(grcTerminationService);
//					}


					if (request.getResource_Details().getSiteID().equalsIgnoreCase("RR")) {
						serviceList.add(cuanewService);
					}

					List<String> serviceData = validateSiteId(request);

					serviceData.forEach(serviceName -> serviceList
							.add(serviceMap.get(ServiceDataEnum.valueOf(serviceName).name())));
					if (request.getResource_Details().getSiteID().equalsIgnoreCase("RR")
							&& (!(serviceList.contains(prmService) || serviceList.contains(oimService)))) {
						serviceList.add(oimService);
					}
					
					if (request.getResource_Details().getSiteID().equalsIgnoreCase("JMD-SOLAR")) {
						serviceList.add(oimService);
					}
				}
			}
		}

		return executionService.executeServices(serviceList, request);

	}

	private List<String> validateSiteId(GeneralRequest request) {
		ResourceDetails resourceDetails = request.getResource_Details();
		switch (resourceDetails.getSiteID().toUpperCase()) {
		case "RR": {
			return relienceRepo.getMatrixTypeList(resourceDetails.getBusiness_Code(), resourceDetails.getSegment_Code(),
					resourceDetails.getFamily_Code(), resourceDetails.getClass_Code(), resourceDetails.getJob_Code());
		}
		case "JIO": {
			return jioRepo.getMatrixTypeList(resourceDetails.getVertical(), resourceDetails.getWork_Area_Business(),
					resourceDetails.getWork_Stream_Segment(), resourceDetails.getRole_Position_Code());
		}
		case "PMDPT":
		case "PMDPY":
			return o2cRepo.getMatrixTypeList(resourceDetails.getSector(), resourceDetails.getPlant(),
					resourceDetails.getDepartment(), resourceDetails.getTrade());
		}
		return List.of();

	}

	public ResourceDetails changeStringtoDecimal(ResourceDetails request)
			throws NoSuchFieldException, SecurityException, IllegalArgumentException, IllegalAccessException {
		String fieldName = "basic_Incl_Spl_Allow,hra,washing_Allow,transportor_Conv_Allow,performance_Allow,balance_Allow,pfEmployer_Contribution,esiEmployer_Contribution,statutory_Bonus,ctc,gross_Salary";
		List<String> listOfField = Arrays.asList(fieldName.split(","));
		for (String requestfield : listOfField) {

			Field field = request.getClass().getDeclaredField(requestfield);
			field.setAccessible(true);
			String fieldValue = (String) field.get(request);

			if (fieldValue == null || fieldValue.isBlank()) {
				field.set(request, "0.0");
			}
		}
		return request;
	}
	
	List<MHereO2CSiteList> checkO2CSitesCombinations(ResourceDetails request) throws JsonMappingException, JsonProcessingException 
	{
		List<MHereO2CSiteList> checkO2cSites = new ArrayList<>();
		
		Map<String, List<MHereO2CSiteList>> siteDataMap = objectMapper.readValue(
		        appConfig.getMHereFields().getDamSiteService(),
		        new TypeReference<Map<String, List<MHereO2CSiteList>>>() {}
		    );
		
		List<MHereO2CSiteList> o2cSiteLists = siteDataMap.getOrDefault(request.getSiteID(), new ArrayList<>());
		if(o2cSiteLists.size() != 0)
		{
			checkO2cSites = o2cSiteLists.stream()
					.filter(req -> req.getSector().equalsIgnoreCase(request.getSector()))
					.filter(req -> req.getPlant().equalsIgnoreCase(request.getPlant()))
					.filter(req -> req.getDepartment().equalsIgnoreCase(request.getDepartment()))
					.filter(req -> req.getTrade().equalsIgnoreCase(request.getTrade()))
					.collect(Collectors.toList());
		}
		
		return checkO2cSites;
	}

}
