package com.jio.cwms_dataprovision.service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.jio.cwms_dataprovision.config.ApplicationConfig;
import com.jio.cwms_dataprovision.config.MongoConfig;
import com.jio.cwms_dataprovision.config.ScrumJdbcTempalte;
import com.jio.cwms_dataprovision.dto.bp_fields.Approval;
import com.jio.cwms_dataprovision.dto.bp_fields.ApprovalInfo;
import com.jio.cwms_dataprovision.dto.bp_fields.Data;
import com.jio.cwms_dataprovision.dto.bp_fields.Root;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class O2CFieldsMappingService {
	
	@Autowired
	private ApplicationConfig applicationConfig;

	@Autowired
	ScrumJdbcTempalte jdbcTemplateConfig;
	
	@Autowired
	MongoConfig mongoConfig;
	
	static String  storedProcedure = "CALL sp_Insert_BP_Approvals_Data_cwms(?,?,?,?,?,?,?,@OUT_Status,@OUT_StatusMsg)";
	
	public void O2CFieldsMapping(Root root) {
		
		String scrumInsert = applicationConfig.getO2cApp().getDam_requestHeader();
		
		LogWrapper.info(getClass(), "Approval Method started ");
		
		String selectQuery = "SELECT * FROM tbl_BP_Approvals_Data WHERE WorkerCode in ('workerFromDb')";
		
		Data data = root.getData();
		

		LogWrapper.info(getClass(), "Root data :: "+root);
		
		if(!StringUtils.isEmpty(root.getAction()) && !StringUtils.isEmpty(root.getDomainName()) && root.getData() != null && !StringUtils.isEmpty(root.getData().getOrgId())) {
			LogWrapper.info(getClass(), "Org Id :: "+root.getData().getOrgId());

			
			LogWrapper.info(getClass(),"org id from db :: "+  applicationConfig.getO2cApp().getDamHeaders());

			if(root.getAction().equalsIgnoreCase("UPDATE") && root.getDomainName().equalsIgnoreCase("Employee") && data.getOrgId().equals(applicationConfig.getO2cApp().getDamHeaders())) {
				
				LogWrapper.info(getClass(), "O2C Approval Data function :: Start");
				
				LogWrapper.info(getClass(), "Default Location id :: "+data.getDefaultLocation());
				
				
				String siteID = mongoConfig.getSiteIdFromMongo(data.getDefaultLocation());

				//String siteID =getSiteDetail(data.getEmployeeId());

				LogWrapper.info(getClass(), "Fetching Data from Mongo :: Site :: "+siteID);
						
					if(data.getApproval() != null) {
						
						List<ApprovalInfo> approvalInfo = new ArrayList<ApprovalInfo>();
						try {
							selectQuery = selectQuery.replace("workerFromDb", data.getEmployeeId());
							
							LogWrapper.info(getClass(), "Fetching Data from Scrum :: Site :: "+siteID  +":: Query :: "+selectQuery);
							
							approvalInfo = jdbcTemplateConfig.getO2CApprovalStatusTemplate().query(selectQuery,
									new BeanPropertyRowMapper<ApprovalInfo>(ApprovalInfo.class));
							
							LogWrapper.info(getClass(), "Fetched Data from Scrum :: Site :: "+siteID  +":: Data :: "+approvalInfo);
						}catch(Exception e) {
							LogWrapper.error(getClass(), "Getting an error while fetching the data from Scrum"+e.getMessage());
						}
						
						if(data.getApproval().getMedical() != null) {
							getMedicalDetails(data, scrumInsert, approvalInfo, siteID);
					    }
						
						if(data.getApproval().getEic() != null) {
							getEicDetails(data, scrumInsert, approvalInfo, siteID);
					    }
						
						if(data.getApproval().getSafetyTraining() != null) {
							getSafetyTrainingDetails(data, scrumInsert, approvalInfo, siteID);
					    }
						
						if(data.getApproval().getIr() != null) {
							getIrDetails(data, scrumInsert, approvalInfo, siteID);
					    }
						
						if(data.getApproval().getVigilance() != null) {
							getVigilanceDetails(data, scrumInsert, approvalInfo, siteID);
					    }
						
						if(data.getApproval().getAccessCard() != null) {
							getAccessCardDetails(data, scrumInsert);
					    }
						if(data.getApproval().getBribs() != null) {
							getBribsDetails(data, scrumInsert, approvalInfo, siteID);
					    }
					
				    }
				}
			}
		
    }

	private void getBribsDetails(Data data, String scrumInsert, List<ApprovalInfo> approvalInfo, String siteID) {
		try {
			LogWrapper.info(getClass(), "BribsDetails :: Site :: "+siteID);
			Approval approval = data.getApproval();
			
			String status = "";
			if(approval.getBribs().get(0).getStatus().equalsIgnoreCase("APPROVED")) {
				status = "A";
			}
			else if(approval.getBribs().get(0).getStatus().equalsIgnoreCase("REJECTED")) {
				status = "R";
			}
			
			String inputDate = approval.getBribs().get(0).getSystemCheck();
			SimpleDateFormat inputFormat = new SimpleDateFormat("dd/MM/yyyy hh:mm:ss a");
	        SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");

	        Date date = inputFormat.parse(inputDate);
            String outputDate = outputFormat.format(date);
            String remarks = StringUtils.isEmpty(approval.getBribs().get(0).getSystemStatus()) ? "":approval.getBribs().get(0).getSystemStatus();
            remarks = remarks.replaceAll("'", " ");

			String queryString = "'"+ siteID +"',"
					+"'"+ data.getEmployeeId() +"',"
			        +"'"+ "BRIBS" +"',"
			        +"'"+ status +"',"
			        +"'"+ outputDate +"',"
			        +"'"+ "" +"',"
			        +"'"+ remarks +"'";
			
			
			String scrum = scrumInsert.replace("<<queryData>>", queryString);
			LogWrapper.info(getClass(), "Insert statement :: Bribs Data :: "+scrum);
			
			

			try {
				
				String appDateDb = "";
				if(!approvalInfo.isEmpty()) {
					for(ApprovalInfo approvalData: approvalInfo) {
						if(approvalData.getApp_Type().equals("BRIBS")) {
							appDateDb = approvalData.getApp_Date().substring(0, 10);
							break;
						}
					}
				}
				
				LogWrapper.info(getClass(), "App date from medical :: " + outputDate + " :: app date from db " + appDateDb );
			//	LogWrapper.info(getClass(), "Validity date from medical :: " + validUpTo + " :: Validity date from db " + validityDateDb);
				
				if(!outputDate.equals(appDateDb)) {
					LogWrapper.info(getClass(),"Query for inserting data in ScrumDB :: "+ scrum);
					List<String> result = jdbcTemplateConfig.getO2CApprovalStatusTemplate().query(scrum,
							new BeanPropertyRowMapper<String>(String.class));
					LogWrapper.info(getClass(), "Inserted Successfully in ScrumDB :: "+result.toString());
					
					Object[] params = {siteID, data.getEmployeeId(), "BRIBS", status, outputDate, null, remarks};
					LogWrapper.info(getClass(),"Query for inserting data in MySQL :: "+ storedProcedure +" "+ params.toString());
					
					int result1  =jdbcTemplateConfig.getO2CApprovalStatusTemplateMySql().update(storedProcedure, params);
					if(result1==1) {
						LogWrapper.info(getClass(),"BRIBS Data is updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}else {
						LogWrapper.info(getClass(),"BRIBS Data is failed to updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}
				}
			}catch(Exception e) {
				LogWrapper.error(getClass(), "Getting an error BRIBS Data "+e.getMessage());
			}
		}catch(Exception e) {
			LogWrapper.error(getClass(), "Getting an error BRIBS Data "+e.getMessage());
		}
	}

	private void getAccessCardDetails(Data data, String scrumInsert) {
		// TODO Auto-generated method stub
		
	}

	private void getVigilanceDetails(Data data, String scrumInsert, List<ApprovalInfo> approvalInfo, String siteID) {
		
		try {
			LogWrapper.info(getClass(), "VigilanceDetails :: Site :: "+siteID);
			Approval approval = data.getApproval();
			
			String status = "";
			if(approval.getVigilance().get(0).getStatus().equalsIgnoreCase("APPROVED")) {
				status = "A";
			}
			else if(approval.getVigilance().get(0).getStatus().equalsIgnoreCase("REJECTED")) {
				status = "R";
			}
			String appDate = StringUtils.isEmpty(approval.getVigilance().get(0).getApprovedDate()) ? "":approval.getVigilance().get(0).getApprovedDate();
			String remarks = StringUtils.isEmpty(approval.getVigilance().get(0).getRemarks()) ? "":approval.getVigilance().get(0).getRemarks();
			remarks = remarks.replaceAll("'", " ");
			
			String queryString = "'"+ siteID +"',"
					+"'"+ data.getEmployeeId() +"',"
			        +"'"+ "VIG" +"',"
			        +"'"+ status +"',"
			        +"'"+ appDate +"',"
			        +"'"+ "" +"',"
			        +"'"+ remarks +"'";
			
			
			String scrum = scrumInsert.replace("<<queryData>>", queryString);
			
			LogWrapper.info(getClass(), "Insert statement :: Vigilance Details Data :: "+scrum);

			try {
				
				String appDateDb = "";
				if(!approvalInfo.isEmpty()) {
					for(ApprovalInfo approvalData: approvalInfo) {
						if(approvalData.getApp_Type().equals("VIG")) {
							appDateDb = approvalData.getApp_Date().substring(0, 10);
							break;
						}
					}
				}
				
				LogWrapper.info(getClass(), "App date from medical :: " + appDate + " :: app date from db " + appDateDb );
			//	LogWrapper.info(getClass(), "Validity date from medical :: " + validUpTo + " :: Validity date from db " + validityDateDb);
				if(!appDate.equals(appDateDb)) {
					
					LogWrapper.info(getClass(),"Query for inserting data in ScrumDB :: "+ scrum);
					List<String> result = jdbcTemplateConfig.getO2CApprovalStatusTemplate().query(scrum,
							new BeanPropertyRowMapper<String>(String.class));
					LogWrapper.info(getClass(), "Inserted Successfully in ScrumDB :: "+result.toString());
					
					Object[] params = {siteID, data.getEmployeeId(), "VIG", status, appDate, null, remarks};
					LogWrapper.info(getClass(),"Query for inserting data in MySQL :: "+ storedProcedure +" "+ params.toString());
					
					int result1 = jdbcTemplateConfig.getO2CApprovalStatusTemplateMySql().update(storedProcedure, params);
					if(result1==1) {
						LogWrapper.info(getClass(),"VIG Data is updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}else {
						LogWrapper.info(getClass(),"VIG Data is failed to updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}
				}

			}catch(Exception e) {
				LogWrapper.error(getClass(), "Getting an error VIG Data "+e.getMessage());
			}
		}catch(Exception e) {
			LogWrapper.error(getClass(), "Getting an error VIG Data "+e.getMessage());
		}
	}

	private void getIrDetails(Data data, String scrumInsert, List<ApprovalInfo> approvalInfo, String siteID) {
		
		try {
			LogWrapper.info(getClass(), "IrDetails :: Site :: "+siteID);
			
			Approval approval = data.getApproval();
			
			String status = "";
			if(approval.getIr().get(0).getStatus().equalsIgnoreCase("APPROVED")) {
				status = "A";
			}
			else if(approval.getIr().get(0).getStatus().equalsIgnoreCase("REJECTED")) {
				status = "R";
			}
			
			String appDate = StringUtils.isEmpty(approval.getIr().get(0).getApprovedDate()) ? "":approval.getIr().get(0).getApprovedDate();
			String remarks = StringUtils.isEmpty(approval.getIr().get(0).getRemarks()) ? "":approval.getIr().get(0).getRemarks();
			remarks = remarks.replaceAll("'", " ");
			
			String queryString = "'"+ siteID +"',"
					+"'"+ data.getEmployeeId() +"',"
			        +"'"+ "HR" +"',"
			        +"'"+ status +"',"
			        +"'"+ appDate +"',"
			        +"'"+ "" +"',"
			        +"'"+ remarks +"'";
			
			
			String scrum = scrumInsert.replace("<<queryData>>", queryString);
			
			LogWrapper.info(getClass(), "Insert statement :: Ir Details Data :: "+scrum);

			try {
				String appDateDb = "";
				if(!approvalInfo.isEmpty()) {
					for(ApprovalInfo approvalData: approvalInfo) {
						if(approvalData.getApp_Type().equals("HR")) {
							appDateDb = approvalData.getApp_Date().substring(0, 10);
							break;
						}
					}
				}
				
				LogWrapper.info(getClass(), "App date from medical :: " + appDate + " :: app date from db " + appDateDb );
				//LogWrapper.info(getClass(), "Validity date from medical :: " + validUpTo + " :: Validity date from db " + validityDateDb);
				if(!appDate.equals(appDateDb)) {
					
					LogWrapper.info(getClass(),"Query for inserting data in ScrumDB :: "+ scrum);
					
					List<String> result = jdbcTemplateConfig.getO2CApprovalStatusTemplate().query(scrum,
							new BeanPropertyRowMapper<String>(String.class));
					LogWrapper.info(getClass(), "Inserted Successfully in ScrumDB :: "+result.toString());
					
					Object[] params = {siteID, data.getEmployeeId(), "HR", status, appDate, null, remarks};
					
					LogWrapper.info(getClass(),"Query for inserting data in MySQL :: "+ storedProcedure +" "+ params.toString());
					int result1 = jdbcTemplateConfig.getO2CApprovalStatusTemplateMySql().update(storedProcedure, params);
					
					if(result1==1) {
						LogWrapper.info(getClass(),"Ir Data is updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}else {
						LogWrapper.info(getClass(),"Ir Data is failed to updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}
				}
				
			}catch(Exception e) {
				LogWrapper.error(getClass(), "Getting an error Ir Data "+e.getMessage());
			}
		}catch(Exception e) {
			LogWrapper.error(getClass(), "Getting an error Ir Data "+e.getMessage());
		}
	}

	private void getSafetyTrainingDetails(Data data, String scrumInsert, List<ApprovalInfo> approvalInfo, String siteID) {
		
		try {
			LogWrapper.info(getClass(), "SafetyTrainingDetails :: Site :: "+siteID);
			
			Approval approval = data.getApproval();
			
			String status = "";
			if(approval.getSafetyTraining().get(0).getStatus().equalsIgnoreCase("APPROVED")) {
				status = "A";
			}
			else if(approval.getSafetyTraining().get(0).getStatus().equalsIgnoreCase("REJECTED")) {
				status = "R";
			}
			
			String appDate = StringUtils.isEmpty(approval.getSafetyTraining().get(0).getApprovedDate()) ? "":approval.getSafetyTraining().get(0).getApprovedDate();
			String validDate = StringUtils.isEmpty(approval.getSafetyTraining().get(0).getValidUpto()) ? "":approval.getSafetyTraining().get(0).getValidUpto();
			String remarks = StringUtils.isEmpty(approval.getSafetyTraining().get(0).getRemarks()) ? "":approval.getSafetyTraining().get(0).getRemarks();
			remarks = remarks.replaceAll("'", " ");
			
			String queryString = "'"+ siteID +"',"
					+"'"+ data.getEmployeeId() +"',"
			        +"'"+ "SEF" +"',"
			        +"'"+ status +"',"
			        +"'"+ appDate +"',"
			        +"'"+ validDate +"',"
			        +"'"+ remarks +"'";
			
			
			String scrum = scrumInsert.replace("<<queryData>>", queryString);
			
			LogWrapper.info(getClass(), "Insert statement :: Safety training Data :: "+scrum);

			try {
				
				
				String appDateDb = "";
				String validityDateDb = "";
				if(!approvalInfo.isEmpty()) {
					for(ApprovalInfo approvalData: approvalInfo) {
						if(approvalData.getApp_Type().equals("SEF")) {
							appDateDb = approvalData.getApp_Date().substring(0, 10);
							validityDateDb = approvalData.getApp_Validity().substring(0, 10);
							break;
						}
					}
				}
				
				LogWrapper.info(getClass(), "App date from medical :: " + appDate + " :: app date from db " + appDateDb );
				LogWrapper.info(getClass(), "Validity date from medical :: " + validDate + " :: Validity date from db " + validityDateDb);
				
				// if(!appDate.equals(appDateDb) && !validDate.equals(validityDateDb)) {
					
					LogWrapper.info(getClass(),"Query for inserting data in ScrumDB :: "+ scrum);
					
					List<String> result = jdbcTemplateConfig.getO2CApprovalStatusTemplate().query(scrum,
							new BeanPropertyRowMapper<String>(String.class));
					LogWrapper.info(getClass(), "Inserted Successfully in ScrumDB :: "+result.toString());
					
					Object[] params = {siteID, data.getEmployeeId(), "SEF", status, appDate, validDate, remarks};
					LogWrapper.info(getClass(),"Query for inserting data in MySQL :: "+ storedProcedure +" "+ params.toString());
					
					int result1 = jdbcTemplateConfig.getO2CApprovalStatusTemplateMySql().update(storedProcedure, params);
					
					if(result1==1) {
						LogWrapper.info(getClass(),"SafetyTraining Data is updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}else {
						LogWrapper.info(getClass(),"SafetyTraining Data is failed to updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}
				// }
				
			}catch(Exception e) {
				LogWrapper.error(getClass(), "Getting an error SafetyTraining Data "+e.getMessage());
			}
		}catch(Exception e) {
			LogWrapper.error(getClass(), "Getting an error SafetyTraining Data "+e.getMessage());
		}
	}

	private void getEicDetails(Data data, String scrumInsert, List<ApprovalInfo> approvalInfo, String siteID) {
		
		try {
			LogWrapper.info(getClass(), "GetEicDetails :: Site :: "+siteID);
			
			Approval approval = data.getApproval();
			
			String status = "";
			if(approval.getEic().get(0).getStatus().equalsIgnoreCase("APPROVED")) {
				status = "A";
			}
			else if(approval.getEic().get(0).getStatus().equalsIgnoreCase("REJECTED")) {
				status = "R";
			}
			
			String appDate = StringUtils.isEmpty(approval.getEic().get(0).getApprovedDate()) ? "":approval.getEic().get(0).getApprovedDate();
			String remarks = StringUtils.isEmpty(approval.getEic().get(0).getRemarks()) ? "":approval.getEic().get(0).getRemarks();
			remarks = remarks.replaceAll("'", " ");
			
			String queryString = "'"+ siteID +"',"
					+"'"+ data.getEmployeeId() +"',"
			        +"'"+ "EIC" +"',"
			        +"'"+ status +"',"
			        +"'"+ appDate +"',"
			        +"'"+ "" +"',"
			        +"'"+ remarks +"'";
			
			
			String scrum = scrumInsert.replace("<<queryData>>", queryString);
			
			LogWrapper.info(getClass(), "Insert statement :: Eic details Data :: "+scrum);

			try {
				
				String appDateDb = "";
				if(!approvalInfo.isEmpty()) {
					for(ApprovalInfo approvalData: approvalInfo) {
						if(approvalData.getApp_Type().equals("EIC")) {
							appDateDb = approvalData.getApp_Date().substring(0, 10);
							break;
						}
					}
				}
				
				LogWrapper.info(getClass(), "App date from medical :: " + appDate + " :: app date from db " + appDateDb );
			//	LogWrapper.info(getClass(), "Validity date from medical :: " + validUpTo + " :: Validity date from db " + validityDateDb);
				if(!appDate.equals(appDateDb)) {
					
					LogWrapper.info(getClass(),"Query for inserting data in ScrumDB :: "+ scrum);
					
					List<String> result = jdbcTemplateConfig.getO2CApprovalStatusTemplate().query(scrum,
							new BeanPropertyRowMapper<String>(String.class));
					LogWrapper.info(getClass(), "Inserted Successfully in ScrumDB :: "+result.toString());
					
					Object[] params = {siteID, data.getEmployeeId(), "EIC", status, appDate, null, remarks};
					
					LogWrapper.info(getClass(),"Query for inserting data in MySQL :: "+ storedProcedure +" "+ params.toString());
					
					int result1 = jdbcTemplateConfig.getO2CApprovalStatusTemplateMySql().update(storedProcedure, params);
					
					if(result1==1) {
						LogWrapper.info(getClass(),"EIC Data is updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}else {
						LogWrapper.info(getClass(),"EIC Data is failed to updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}
				}

			}catch(Exception e) {
				LogWrapper.error(getClass(), "Getting an error EIC Data "+e.getMessage());
			}
		}catch(Exception e) {
			LogWrapper.error(getClass(), "Getting an error EIC Data "+e.getMessage());
		}
	}

	private void getMedicalDetails(Data data, String scrumInsert, List<ApprovalInfo> approvalInfo, String siteID) {
	
		LogWrapper.info(getClass(), "GetMedicalDetails :: Site :: "+siteID);
		
		try {
			
			LogWrapper.info(getClass(), "GetMedicalDetails :: Site :: "+siteID);
			
			Approval approval = data.getApproval();
			
			String status = "";
			if(approval.getMedical().get(0).getStatus().equalsIgnoreCase("APPROVED")) {
				status = "A";
			}
			else if(approval.getMedical().get(0).getStatus().equalsIgnoreCase("REJECTED")) {
				status = "R";
			}
			
			String appDate = StringUtils.isEmpty(approval.getMedical().get(0).getApprovedDate()) ? "":approval.getMedical().get(0).getApprovedDate();
			
			String validityDate = approval.getMedical().get(0).getSpecial().getValidUpto();
			String validUpTo= StringUtils.isEmpty(validityDate) ? "" : validityDate;
			
			String remarks = StringUtils.isEmpty(approval.getMedical().get(0).getRemarks()) ? "":approval.getMedical().get(0).getRemarks();
			remarks = remarks.replaceAll("'", " ");
			
			String queryString = "'"+ siteID +"',"
					+"'"+ data.getEmployeeId() +"',"
			        +"'"+ "MED" +"',"
			        +"'"+ status +"',"
			        +"'"+ appDate +"',"
			        +"'"+ validUpTo +"',"
			        +"'"+ remarks +"'";
			
			
			String scrum = scrumInsert.replace("<<queryData>>", queryString);
			
			LogWrapper.info(getClass(), "Insert statement :: Medical Data :: "+scrum);
			
			
			try {
				String appDateDb = "";
				String validityDateDb = "";
				if(!approvalInfo.isEmpty()) {
					for(ApprovalInfo approvalData: approvalInfo) {
						if(approvalData.getApp_Type().equals("MED")) {
							appDateDb = approvalData.getApp_Date().substring(0, 10);
							validityDateDb = approvalData.getApp_Validity().substring(0, 10);
							break;
						}
					}
				}
				
				LogWrapper.info(getClass(), "App date from medical :: " + appDate + " :: app date from db " + appDateDb );
				LogWrapper.info(getClass(), "Validity date from medical :: " + validUpTo + " :: Validity date from db " + validityDateDb);
				
				// if(!appDate.equals(appDateDb) && !validUpTo.equals(validityDateDb)) {
					LogWrapper.info(getClass(),"Query for inserting data in ScrumDB :: "+ scrum);
					
					List<String> result=jdbcTemplateConfig.getO2CApprovalStatusTemplate().query(scrum,
							new BeanPropertyRowMapper<String>(String.class));
					LogWrapper.info(getClass(), "Inserted Successfully in ScrumDB :: "+result.toString());
				
					
					
					Object[] params = {siteID, data.getEmployeeId(), "MED", status, appDate, validUpTo, remarks};
					LogWrapper.info(getClass(),"Query for inserting data in MySQL :: "+ storedProcedure +" "+ params.toString());
					
					int result1 =1;
							jdbcTemplateConfig.getO2CApprovalStatusTemplateMySql().update(storedProcedure, params);
					if(result1==1) {
						LogWrapper.info(getClass(),"Medical Data is updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}else {
						LogWrapper.info(getClass(),"Medical Data is failed to updated OR inserted in MySQL for Employee :: " + data.getEmployeeId());
					}
				
				// }
				
				
			}catch(Exception e) {
				LogWrapper.error(getClass(), "Getting an error Medical Data "+e.getMessage());
			}
		}catch(Exception e) {
			LogWrapper.error(getClass(), "Getting an error Medical Data "+e.getMessage());
		}
	}

private String getSiteDetail(String empId){
	switch (empId.substring(0, Math.min(empId.length(), 4))) {
           			 case "PPG1":
                		return "PMDPT";
            		case "PPG2":
                		return "PMDPY";
            		default:
                		return "";
        }
}
}
