package com.jio.cwms.onboard.dto.request;

import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResourceDetails {

	////@JsonProperty("organization")
	private String organization;

	////@JsonProperty("siteID")
	private String siteID;

	////@JsonProperty("approval_Status")
	private String approval_Status;

	////@JsonProperty("transMode")
	private String transMode;

	//@JsonProperty("contractor_Name")
	private String contractor_Name;

	//@JsonProperty("contractor_Code")
	private String contractor_Code;

	//@JsonProperty("contractor_Code_PRM")
	private String contractor_Code_PRM;

	//@JsonProperty("work_Order_Date")
	private String work_Order_Date;

	//@JsonProperty("work_Order_From")
	private String work_Order_From;

	//@JsonProperty("work_Order_To")
	private String work_Order_To;

	//@JsonProperty("workerCode")
	private String workerCode;

	//@JsonProperty("gender")
	private String gender;

	//@JsonProperty("nationality")
	private String nationality;

	//@JsonProperty("full_Name")
	private String full_Name;

	//@JsonProperty("first_Name")
	private String first_Name;

	//@JsonProperty("middle_Name")
	private String middle_Name;

	//@JsonProperty("last_Name")
	private String last_Name;

	//@JsonProperty("name_as_per_Aadhar")
	private String name_as_per_Aadhar;

	//@JsonProperty("son_Daughter_Wife_Of")
	private String son_Daughter_Wife_Of;

	//@JsonProperty("mother_Tounge")
	private String mother_Tounge;

	//@JsonProperty("sector")
	private String sector;

	//@JsonProperty("plant")
	private String plant;

	//@JsonProperty("department")
	private String department;

	//@JsonProperty("trade")
	private String trade;

	//@JsonProperty("workSkill")
	private String workSkill;

	//@JsonProperty("eic")
	private String eic;

	//@JsonProperty("eic_EC_No")
	private String eic_EC_No;

	//@JsonProperty("activity")
	private String activity;

	//@JsonProperty("card_Type")
	private String card_Type;

	//@JsonProperty("card_Category")
	private String card_Category;

	//@JsonProperty("area_of_Movement")
	private String area_of_Movement;

	//@JsonProperty("religion")
	private String religion;

	//@JsonProperty("category")
	private String category;

	//@JsonProperty("caste")
	private String caste;

	//@JsonProperty("permanent_Address")
	private String permanent_Address;

	//@JsonProperty("permanent_State")
	private String permanent_State;

	//@JsonProperty("permanent_District")
	private String permanent_District;

	//@JsonProperty("permanent_Taluka")
	private String permanent_Taluka;

	//@JsonProperty("permanent_Village")
	private String permanent_Village;

	//@JsonProperty("permanent_Police_Station")
	private String permanent_Police_Station;

	//@JsonProperty("permanent_PinCode")
	private String permanent_PinCode;

	//@JsonProperty("domicile_Address")
	private String domicile_Address;

	//@JsonProperty("domicile_State")
	private String domicile_State;

	//@JsonProperty("domicile_District")
	private String domicile_District;

	//@JsonProperty("domicile_Taluka")
	private String domicile_Taluka;

	//@JsonProperty("domicile_Village")
	private String domicile_Village;

	//@JsonProperty("domicile_Police_Station")
	private String domicile_Police_Station;

	//@JsonProperty("domicile_PinCode")
	private String domicile_PinCode;

	//@JsonProperty("local_Address")
	private String local_Address;

	//@JsonProperty("local_State")
	private String local_State;

	//@JsonProperty("local_District")
	private String local_District;

	//@JsonProperty("local_Taluka")
	private String local_Taluka;

	//@JsonProperty("local_Village")
	private String local_Village;

	//@JsonProperty("local_Police_Station")
	private String local_Police_Station;

	//@JsonProperty("local_PinCode")
	private String local_PinCode;

	//@JsonProperty("phone_Self")
	private String phone_Self;

	//@JsonProperty("emergency_Contact_No")
	private String emergency_Contact_No;

	//@JsonProperty("date_of_Birth")
	private String date_of_Birth;

	//@JsonProperty("date_of_Joining")
	private String date_of_Joining;

	//@JsonProperty("validity_Date")
	private String validity_Date;

	//@JsonProperty("experience")
	private String experience;

	//@JsonProperty("pf_No")
	private String pf_No;

	//@JsonProperty("uan_No")
	private String uan_No;

	//@JsonProperty("wc_Policy_No")
	private String wc_Policy_No;

	//@JsonProperty("wc_Policy_Date")
	private String wc_Policy_Date;

	//@JsonProperty("isESIC")
	private String isESIC;

	//@JsonProperty("esic_No")
	private String esic_No;

	//@JsonProperty("license_No")
	private String license_No;

	//@JsonProperty("license_Date")
	private String license_Date;

	//@JsonProperty("card_Creation_Remark")
	private String card_Creation_Remark;

	//@JsonProperty("isMarried")
	private String isMarried;

	//@JsonProperty("marriage_Date")
	private String marriage_Date;

	//@JsonProperty("male_Child")
	private String male_Child;

	//@JsonProperty("female_Child")
	private String female_Child;

	//@JsonProperty("physically_Handicapped")
	private String physically_Handicapped;

	//@JsonProperty("handicapped_Details")
	private String handicapped_Details;

	//@JsonProperty("reference_1_Name")
	private String reference_1_Name;

	//@JsonProperty("reference_1_Contact_No")
	private String reference_1_Contact_No;

	//@JsonProperty("reference_1_Address")
	private String reference_1_Address;

	//@JsonProperty("reference_2_Name")
	private String reference_2_Name;

	//@JsonProperty("reference_2_Contact_No")
	private String reference_2_Contact_No;

	//@JsonProperty("reference_2_Address")
	private String reference_2_Address;

	//@JsonProperty("is_Relative_Working_in_RIL")
	private String is_Relative_Working_in_RIL;

	//@JsonProperty("relative_Details")
	private String relative_Details;

	//@JsonProperty("bank_Name")
	private String bank_Name;

	//@JsonProperty("bank_Account_no")
	private String bank_Account_no;

	//@JsonProperty("ifsc_Code")
	private String ifsc_Code;

	//@JsonProperty("core_NonCore")
	private String core_NonCore;

	//@JsonProperty("bus_Func")
	private String bus_Func;

	//@JsonProperty("segment")
	private String segment;

	//@JsonProperty("site_Desc")
	private String site_Desc;

	//@JsonProperty("tenure_in_Reliance")
	private String tenure_in_Reliance;

	//@JsonProperty("demography")
	private String demography;

	//@JsonProperty("spec_Category")
	private String spec_Category;

	//@JsonProperty("entity_Code")
	private String entity_Code;

	//@JsonProperty("ouCode")
	private String ouCode;

	//@JsonProperty("basic_Incl_Spl_Allow")
	private String basic_Incl_Spl_Allow;

	//@JsonProperty("hra")
	private String hra;

	//@JsonProperty("washing_Allow")
	private String washing_Allow;

	//@JsonProperty("transportor_Conv_Allow")
	private String transportor_Conv_Allow;

	//@JsonProperty("performance_Allow")
	private String performance_Allow;

	//@JsonProperty("balance_Allow")
	private String balance_Allow;

	//@JsonProperty("pfEmployer_Contribution")
	private String pfEmployer_Contribution;

	//@JsonProperty("esiEmployer_Contribution")
	private String esiEmployer_Contribution;

	//@JsonProperty("statutory_Bonus")
	private String statutory_Bonus;

	//@JsonProperty("location_Code")
	private String location_Code;

	//@JsonProperty("now_Code")
	private String now_Code;

	//@JsonProperty("now_Text")
	private String now_Text;

	//@JsonProperty("business_PL_Code")
	private String business_PL_Code;

	//@JsonProperty("business_PL_Text")
	private String business_PL_Text;

	//@JsonProperty("value_Stream_Code")
	private String value_Stream_Code;

	//@JsonProperty("value_Stream_Text")
	private String value_Stream_Text;

	//@JsonProperty("work_Responsibilty_Code")
	private String work_Responsibilty_Code;

	//@JsonProperty("work_Responsibilty_Text")
	private String work_Responsibilty_Text;

	//@JsonProperty("work_Group_Code")
	private String work_Group_Code;

	//@JsonProperty("work_Group_Text")
	private String work_Group_Text;

	//@JsonProperty("segment_Code")
	private String segment_Code;

	//@JsonProperty("segment_Text")
	private String segment_Text;

	//@JsonProperty("new_Site_Business_Code")
	private String new_Site_Business_Code;

	//@JsonProperty("new_Site_Business_Text")
	private String new_Site_Business_Text;

	//@JsonProperty("new_Value_Stream_Code")
	private String new_Value_Stream_Code;

	//@JsonProperty("new_Value_Stream_Text")
	private String new_Value_Stream_Text;

	//@JsonProperty("email_ID")
	private String email_ID;

	//@JsonProperty("qualification")
	private String qualification;

	//@JsonProperty("blood_Group")
	private String blood_Group;

	//@JsonProperty("height")
	private String height;

	//@JsonProperty("weight")
	private String weight;

	//@JsonProperty("id_Mark")
	private String id_Mark;

	//@JsonProperty("contract_End_Date")
	private String contract_End_Date;

	//@JsonProperty("vertical")
	private String vertical;

	//@JsonProperty("work_Area_Business")
	private String work_Area_Business;

	//@JsonProperty("business_Code")
	private String business_Code;

	//@JsonProperty("work_Stream_Segment")
	private String work_Stream_Segment;

	//@JsonProperty("work_Stream_Segment_Code")
	private String work_Stream_Segment_Code;

	//@JsonProperty("role_Position")
	private String role_Position;

	//@JsonProperty("role_Position_Code")
	private String role_Position_Code;

	//@JsonProperty("role_Code_SAP")
	private String role_Code_SAP;

	//@JsonProperty("department_Family")
	private String department_Family;

	//@JsonProperty("family_Code")
	private String family_Code;

	//@JsonProperty("card_Type_Class")
	private String card_Type_Class;

	//@JsonProperty("class_Code")
	private String class_Code;

	//@JsonProperty("area_of_Movement_Jobkey")
	private String area_of_Movement_Jobkey;

	//@JsonProperty("job_Code")
	private String job_Code;

	//@JsonProperty("level")
	private String level;

	//@JsonProperty("region")
	private String region;

	//@JsonProperty("state")
	private String state;

	//@JsonProperty("area")
	private String area;

	//@JsonProperty("r4g_State")
	private String r4g_State;

	//@JsonProperty("state_Short_Code")
	private String state_Short_Code;

	//@JsonProperty("state_Geo_Short_Code")
	private String state_Geo_Short_Code;

	//@JsonProperty("mp")
	private String mp;

	//@JsonProperty("jio_Location")
	private String jio_Location;

	//@JsonProperty("build_ID")
	private String build_ID;

	//@JsonProperty("site_Code")
	private String site_Code;

	//@JsonProperty("manager_Name")
	private String manager_Name;

	//@JsonProperty("manager_ECNO")
	private String manager_ECNO;

	//@JsonProperty("location_Type")
	private String location_Type;

	//@JsonProperty("location_Type_Code")
	private String location_Type_Code;

	//@JsonProperty("agency_EMP_ID")
	private String agency_EMP_ID;

	//@JsonProperty("domain_ID")
	private String domain_ID;

	//@JsonProperty("is_Differently_Abled")
	private String is_Differently_Abled;

	//@JsonProperty("differently_Abled_Type")
	private String differently_Abled_Type;

	//@JsonProperty("sub_Type")
	private String sub_Type;

	//@JsonProperty("differently_Abled_Status")
	private String differently_Abled_Status;

	//@JsonProperty("degree_Percent")
	private String degree_Percent;

	//@JsonProperty("issuing_Authority")
	private String issuing_Authority;

	//@JsonProperty("issuing_Agency")
	private String issuing_Agency;

	//@JsonProperty("ref_Number")
	private String ref_Number;

	//@JsonProperty("issue_Date")
	private String issue_Date;

	//@JsonProperty("id_Proof_Type")
	private String id_Proof_Type;

	//@JsonProperty("id_Proof_No")
	private String id_Proof_No;

	//@JsonProperty("additional_ID_Proof_Type")
	private String additional_ID_Proof_Type;

	//@JsonProperty("additional_ID_Proof_No")
	private String additional_ID_Proof_No;

	//@JsonProperty("vaccination_Status")
	private String vaccination_Status;

	//@JsonProperty("vaccination_Dose")
	private String vaccination_Dose;

	//@JsonProperty("mobile_No")
	private String mobile_No;

	//@JsonProperty("beneficiary_ID")
	private String beneficiary_ID;

	//@JsonProperty("dose_1_Date")
	private String dose_1_Date;

	//@JsonProperty("dose_2_Date")
	private String dose_2_Date;

	//@JsonProperty("booster_Dose_Date")
	private String booster_Dose_Date;

	//@JsonProperty("vaccination_Remarks")
	private String vaccination_Remarks;

	//@JsonProperty("ctc")
	private String ctc;

	//@JsonProperty("gross_Salary")
	private String gross_Salary;

	//@JsonProperty("workorder_No")
	private String workorder_No;

	//@JsonProperty("wo_Company_Code")
	private String wo_Company_Code;

	//@JsonProperty("wo_Company_Name")
	private String wo_Company_Name;

	//@JsonProperty("wo_Company_City")
	private String wo_Company_City;

	//@JsonProperty("prmID")
	private String prmID;

	//@JsonProperty("aom_Code")
	private String aom_Code;

	//@JsonProperty("aom_ColorCode")
	private String aom_ColorCode;

	//@JsonProperty("termination_Date")
	private String termination_Date;

	//@JsonProperty("termination_Remark")
	private String termination_Remark;

	//@JsonProperty("pass_Not_Deposited")
	private String pass_Not_Deposited;

	//@JsonProperty("debit_Note_Raised")
	private String debit_Note_Raised;

	//@JsonProperty("z5Code")
	private String z5Code;

	//@JsonProperty("rarsFlag")
	private String rarsFlag;
	
	private String repNo;
	private String rep_exp_date;
	private String rep_mapped_count;
	private String multiSite;

}
