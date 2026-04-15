package com.jio.cwms_dataprovision.dto.cua;


import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jio.cwms_dataprovision.dto.GeneralRequest;
import com.jio.cwms_dataprovision.dto.ResourceDetails;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class OfficialData {

	@JsonProperty("sch:PERNR")
	private String pernr;
	@JsonProperty("sch:ZZFULL_NAME")
	private String fullName;
	@JsonProperty("sch:BUKRS")
	private String bukrs;
	@JsonProperty("sch:BUTXT")
	private String butxt;
	@JsonProperty("sch:ZBCCODE")
	private String zbcCode;
	@JsonProperty("sch:ZBCDESC")
	private String zbcDesc;
	@JsonProperty("sch:ZBUCODE")
	private String zbuCode;
	@JsonProperty("sch:ZBUDESC")
	private String zbuDesc;
	@JsonProperty("sch:ZBSCODE")
	private String zbsCode;
	@JsonProperty("sch:ZBSDESC")
	private String zbsDesc;
	@JsonProperty("sch:PLANS")
	private String plans;
	@JsonProperty("sch:PLSTX")
	private String plstx;
	@JsonProperty("sch:GBDAT")
	private String gbdat;
	@JsonProperty("sch:EMAILID")
	private String email;
	@JsonProperty("sch:MOBILENO")
	private String mobile;
	@JsonProperty("sch:EXTNNO")
	private String extnNo;
	@JsonProperty("sch:L1_PERNR")
	private String l1pernr;
	@JsonProperty("sch:L1_ENAME")
	private String l1ename;
	@JsonProperty("sch:L1_EMAIL")
	private String l1email;
	@JsonProperty("sch:VORNA")
	private String vorna;
	@JsonProperty("sch:NACHN")
	private String nachn;
	@JsonProperty("sch:TEXT1")
	private String text1;
	@JsonProperty("sch:UNAME")
	private String uname;
	@JsonProperty("sch:AEDTM")
	private String aedtm;
	@JsonProperty("sch:STATE")
	private String state;
	@JsonProperty("sch:DAT01")
	private String dat01;
	@JsonProperty("sch:ZSTORECODE")
	private String zstorecode;
	@JsonProperty("sch:STLTX")
	private String stltx;
	@JsonProperty("sch:STELL")
	private String stell;
	@JsonProperty("sch:ZBECODE")
	private String zbeCode;
	@JsonProperty("sch:ZBEDESC")
	private String zbedesc;
	@JsonProperty("sch:ZL1RECDT")
	private String zl1recdt;
	@JsonProperty("sch:ZCITY_DES")
	private String zcity;
	@JsonProperty("sch:TELNR")
	private String telnr;

	public void fromGeneralRequest(GeneralRequest request, String username) {
		
		ResourceDetails resourceDetails = request.getResource_Details();
		
		// Need to Discuss
		this.pernr = resourceDetails.getWorkerCode().substring(4);
		this.fullName  = resourceDetails.getFull_Name() != null && resourceDetails.getFull_Name().length() > 60 ? resourceDetails.getFull_Name().substring(0, 60): resourceDetails.getFull_Name();
		String contractorCode = resourceDetails.getContractor_Code().replaceFirst("^0*", "");
		this.bukrs = contractorCode.length() > 4 ? contractorCode.substring(0, 4) : contractorCode;
		this.butxt = "";
		this.zbcCode = "0";
		this.zbcDesc = "Retail Business";
		this.zbuCode = "0";
		this.zbuDesc = "0";
		this.zbsCode = "0";
		this.zbsDesc = "Footprint DC";
		this.plans = "0";
		this.plstx = "Manager";
		this.gbdat = resourceDetails.getDate_of_Birth().replaceAll("-", "");
		this.email = resourceDetails.getEmail_ID();
		this.mobile = resourceDetails.getPhone_Self().replaceAll("\\+91","");
		this.extnNo = "";
		String managerECNO = StringUtils.isEmpty( resourceDetails.getManager_ECNO())? "" :resourceDetails.getManager_ECNO().replaceFirst("P", "");
		this.l1pernr = managerECNO.length() >= 8 ? managerECNO.substring(managerECNO.length()-8, managerECNO.length()) : managerECNO;
		this.l1ename = resourceDetails.getContractor_Name()!= null && resourceDetails.getContractor_Name().length() > 40 ? resourceDetails.getContractor_Name().substring(0, 40) : resourceDetails.getContractor_Name();
		/// Not Available
		this.l1email = "";
		this.vorna = resourceDetails.getFirst_Name();
		this.nachn = resourceDetails.getLast_Name();
		this.text1 = "Active";
		this.uname =  username;
		//changes made(11-20)
		this.aedtm = resourceDetails.getDate_of_Joining().replaceAll("-", "");
		this.state = resourceDetails.getState();
		// this.state = "maharashtra";
		this.dat01 = resourceDetails.getDate_of_Joining().replaceAll("-", "");
		this.zstorecode = resourceDetails.getSite_Code();
		this.stltx = "Loader";
		//// Need to discuss
		this.stell = this.pernr;
		this.zbeCode = "0";
		this.zbedesc = "Off Role";
		this.zcity = "Off Role";
		this.telnr = resourceDetails.getPhone_Self().replaceAll("\\+91","");
	}

}
