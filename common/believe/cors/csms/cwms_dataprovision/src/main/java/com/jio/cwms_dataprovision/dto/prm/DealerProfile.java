package com.jio.cwms_dataprovision.dto.prm;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;

import com.jio.cwms_dataprovision.constants.PRMActionEnum;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class DealerProfile {

	private ControlInfo controlInfo = new ControlInfo();
	private String transactionReferenceNumber;
	private Transaction transaction = new Transaction();
	private Organization organization = new Organization();
	
	
	public void fromGeneralRequest(GeneralRequest request, String transMode, Map<String, String> characterMap) {
		this.controlInfo.setChannel("Z4");
		this.transactionReferenceNumber = uniqueCode();
		
		this.organization.setAction("NONE");
		this.organization.setId(request.getResource_Details().getSite_Code());
		
		this.organization.location.setAction("NONE");
		this.organization.location.setId(request.getResource_Details().getSite_Code());
		
		ResourceDetails resourceDetails = request.getResource_Details();
		List<Agent> agentList = new ArrayList<>();
		
		Agent agent = new Agent();
		agent.setId(resourceDetails.getTransMode().equalsIgnoreCase("ADD") ? "" : resourceDetails.getPrmID());
		agent.setJobDescription(resourceDetails.getJob_Code());
		/// Need to be Discussed
		agent.setAction(PRMActionEnum.valueOf(transMode).getValue());
		agent.setReferenceNumber(resourceDetails.getWorkerCode());
		agent.setRole(resourceDetails.getRole_Position_Code());
		// agent.setRole("X4");
		agent.setIsContactPrimary("N");
		agent.setGender(resourceDetails.getGender().equalsIgnoreCase("female") ? "F" : "M");
		agent.setFirstName(resourceDetails.getFirst_Name());
		agent.setLastName(resourceDetails.getLast_Name());
		agent.setMiddleName(StringUtils.isEmpty(resourceDetails.getMiddle_Name()) || resourceDetails.getMiddle_Name().equalsIgnoreCase("na") ? "" : resourceDetails.getMiddle_Name());
		
		agent.contactInfo.setContactNo(resourceDetails.getPhone_Self());
		agent.contactInfo.setEmailId(resourceDetails.getEmail_ID());
		
		agent.proofIdentification.get(0).setIdentifier("POI");
		// Need To discuss Z00005 – For Aadhar Z00001 – For PAN (Static Value)
		agent.proofIdentification.get(0).setIdProofType("Z00005");
		agent.proofIdentification.get(0).setDocumentNumber(resourceDetails.getId_Proof_No());
	
		agent.setPreferredLanguage("EN");
		
		agent.getRelationships().get(0).setId(resourceDetails.getManager_ECNO().replaceFirst("P", "").replaceFirst("p", ""));
		agent.getRelationships().get(0).setRelationshipType("MA");
		
		agent.getRelationships().get(1).setId(resourceDetails.getContractor_Code_PRM());
		agent.getRelationships().get(1).setRelationshipType("VE");

		if (resourceDetails.getContractor_Code_PRM() == null || resourceDetails.getContractor_Code_PRM().isEmpty()) {
			agent.setRelationships(List.of(agent.getRelationships().get(0)));
		}
		
		agent.getAddress().get(0).setAddressType("XXDEFAULT");
		agent.getAddress().get(0).setCountry("IN");
		
//	 if (!request.getResource_Details().getTransMode().equalsIgnoreCase("MOVE") && !request.getResource_Details().getTransMode().equalsIgnoreCase("MOD")) {
//		agent.getCharacteristics().get(0).setName("ZAADNM");
//		agent.getCharacteristics().get(0).setValue(resourceDetails.getName_as_per_Aadhar());
//		
//		if(request.getResource_Details().getOrganization().equalsIgnoreCase("RR")) {
//			agent.getCharacteristics().get(1).setName("ZAGBUS");
//			agent.getCharacteristics().get(1).setValue(resourceDetails.getBusiness_Code());
//			
//			agent.getCharacteristics().get(2).setName("ZAGSEG");
//			agent.getCharacteristics().get(2).setValue(resourceDetails.getSegment_Code());
//			
//			agent.getCharacteristics().get(3).setName("ZAGFAM");
//			agent.getCharacteristics().get(3).setValue(resourceDetails.getFamily_Code());
//			
//			agent.getCharacteristics().get(4).setName("ZADCLS");
//			agent.getCharacteristics().get(4).setValue(resourceDetails.getClass_Code());
//			
//			agent.getCharacteristics().get(5).setName("ZAGROLE");
//			agent.getCharacteristics().get(5).setValue(resourceDetails.getJob_Code());
//			
//			agent.getCharacteristics().get(6).setName("ZAGZCODE");
//			agent.getCharacteristics().get(6).setValue(resourceDetails.getZ5Code());
//		}
//	  }
		
		characterMap.put("ZAADNM", resourceDetails.getName_as_per_Aadhar());
		if (request.getResource_Details().getOrganization().equalsIgnoreCase("RR")) {
			characterMap.put("ZAGBUS", resourceDetails.getBusiness_Code());
			characterMap.put("ZAGSEG", resourceDetails.getSegment_Code());
			characterMap.put("ZAGFAM", resourceDetails.getFamily_Code());
			characterMap.put("ZADCLS", resourceDetails.getClass_Code());
			characterMap.put("ZAGROLE", resourceDetails.getJob_Code());
			characterMap.put("ZAGZCODE", resourceDetails.getZ5Code());
		}
		List<Characteristic> charList = new ArrayList<Characteristic>();
		agent.setCharacteristics(charList);
		
		characterMap.keySet().forEach(character ->{
			Characteristic singleCharacteristic = new Characteristic();
			singleCharacteristic.setName(character);
			singleCharacteristic.setValue(characterMap.get(character));
			charList.add(singleCharacteristic);
		});

		List<Characteristic> charachter  = agent.getCharacteristics().stream().filter(c -> c.getName() != null || c.getValue() != null)
				.collect(Collectors.toCollection(ArrayList::new));
   
		agent.setCharacteristics(charachter);
		agentList.add(agent);

		
		this.organization.getLocation().setAgent(agentList);
	}
	
	private String uniqueCode() {
		Random random = new Random();
		DateTimeFormatter format = DateTimeFormatter.ofPattern("HHmmssSSS");
		int randomnumber = random.nextInt(9999);
		char randomLetter = (char) ('A' + random.nextInt(26));
		String code =  "Z4"+LocalDateTime.now().format(format)+randomnumber+randomLetter;
		return code;
		}
	
	

}
