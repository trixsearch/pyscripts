package com.jio.cwms.onboard.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class AccessDetails {

	//@JsonProperty("system_ID")
	private String system_ID;

	//@JsonProperty("worker_Code")
	private String worker_Code;

	//@JsonProperty("first_Name")
	private String first_Name;

	//@JsonProperty("last_Name")
	private String last_Name;

	//@JsonProperty("dob")
	private String dob;

	//@JsonProperty("doj")
	private String doj;

	//@JsonProperty("gender")
	private String gender;

	//@JsonProperty("blood_Group")
	private String blood_Group;

	//@JsonProperty("id_Mark")
	private String id_Mark;

	//@JsonProperty("height")
	private String height;

	//@JsonProperty("work_Location")
	private String work_Location;

	//@JsonProperty("company_Code")
	private String company_Code;

	//@JsonProperty("company_Name")
	private String company_Name;

	//@JsonProperty("activation_Date")
	private String activation_Date;

	//@JsonProperty("expiration_Date")
	private String expiration_Date;

	//@JsonProperty("card_No")
	private String card_No;

	//@JsonProperty("issue_Level")
	private String issue_Level;

	//@JsonProperty("card_Format")
	private String card_Format;

	//@JsonProperty("status")
	private String status;

	//@JsonProperty("photo")
	private String photo;

	//@JsonProperty("signature")
	private String signature;

	//@JsonProperty("old_CardNo")
	private String old_CardNo;

	//@JsonProperty("old_CardFormat")
	private String old_CardFormat;

	//@JsonProperty("old_IssueLevel")
	private String old_IssueLevel;

	//@JsonProperty("gateMode")
	private String gateMode;

	//@JsonProperty("gate_Access")
	private List<GateAccess> gate_Access;

}
