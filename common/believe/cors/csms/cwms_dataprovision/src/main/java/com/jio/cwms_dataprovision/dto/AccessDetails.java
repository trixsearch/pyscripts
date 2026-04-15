package com.jio.cwms_dataprovision.dto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class AccessDetails {
	
	private String system_ID;
	private String worker_Code;
	private String first_Name;
	private String last_Name;
	private String dob;
	private String doj;
	private String gender;
	private String blood_Group;
	private String id_Mark;
	private String height;
	private String work_Location;
	private String company_Code;
	private String company_Name;
	private String activation_Date;
	private String expiration_Date;
	private String card_No;
	private String card_Format;
	private String issue_Level;
	private String old_CardNo;
	private String old_CardFormat;
	private String old_IssueLevel;
	private String status;
	private String photo;
	private String signature;
	ArrayList<GateAccess> gate_Access = new ArrayList<>();
//	private String gateMode;

}
