package com.jio.cwms_dataprovision.dto.prm;

import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Agent {
	private String id;
	private String jobDescription;
	private String action;
	private String referenceNumber;
	private String role;
	private String isContactPrimary;
	private String gender;
	private String firstName;
	private String lastName;
	private String middleName;
	ContactInfo contactInfo = new ContactInfo();
	List<ProofIdentification> proofIdentification = List.of(new ProofIdentification());
	private String preferredLanguage;
	List<Relationship> relationships = List.of(new Relationship(), new Relationship());
	
	private List<Address> address = List.of(new Address());
	private List<Characteristic> characteristics = List.of(new Characteristic(), new Characteristic(), new Characteristic(), 
			new Characteristic(), new Characteristic(), new Characteristic(), new Characteristic());
}
