package com.jio.cwms.onboard.constants;

import java.util.Arrays;
import java.util.List;

public class ApiConstant {

	public static final String redisTemplate = "redisTemplate";
	public static final String rilagm_auth = "rilagm_auth";
	public static String url = "";
	public static String username = "";
	public static String password = "";
	public static String driverClassName = "";
	public static String dialect = "";
	public static String master = "";
	public static String redispassword = "";
	public static String sentinelNodes = "";
	public static int maxactive = 0;
	public static int maxwait = 0;
	public static int maxidle = 0;
	public static int minidle = 0;
	public static boolean testwhileidle;
	public static int timebetweenevictionrunsmillis = 0;
	public static int minevictableidletimemillis = 0;
	public static String prototypedatasuccess = "";
	public static String prototypedataerror = "";
	public static final String admin = "admin";
	public static final String mongodb = "mongodb://";
	public static final String colon = ":";
	public static final String at = "@";
	public static final String slash = "/";
	public static String port = "";
	public static String host = "";
	public static String portNumber = "";
	public static String mongoUserName = "";
	public static String databaseName = "";
	
	
	
	public static final String successOrderResponse = "success";
	public static final String failOrderResponse = "success";
	public static final String strfalse = "false";
	public static final String strtrue = "true";
	public static final String requestId = "clientTxnId";
	public static final String userId = "userId";
	public static final String programCode = "programCode";
	public static final String userRole = "userRole";
	public static final String statusA = "A";
	public static final String deploymentStatusDraft = "DRAFT";
	
	public static final String mandatory ="mandatory";
	public static final String received ="Request reveived from ";
	public static final String sent ="Request sent to ";
	public static final String publisher = "publisher";
	public static final String upstream = "upstream";
	public static final String onboard = "onboard";
	public static final String redis = "redis";
	public static final String ttl = "ttl";
	public static final String header ="header";
	public static final String headerValidation ="header_validation";
	public static final String sourceSystem ="CWMS";
	public static final String upstreamStatus = "1";
	public static final String gate = "GateDetails";
	public static final String access= "accessApi";
	public static final String quikhire = "QuickHire";
	public static final String dateRange = "DATE_RANGE";

	public static final String dateType= "date";
	public static final String gateAccess= "gate_Access";
	public static final String approvalStatus= "approval_Status";
	public static final String transMode= "transMode";
	public static final String resourceDetails= "ResourceDetails";
	public static final String accessDetails= "AccessDetails";
	public static final  List<String> validOrganizations = Arrays.asList("JIO", "RR", "O2C");
	public static final String empDetails = "EmployeeDetails";
	public static final String candidate = "Candidate";
	public static final String candidateStatus = "CandidateStatus";
	public static final String refresh = "REFRESH";
	public static final String qms="QMS";
	public static final String supplierFirstToken = "supplierFirstToken";
	public static final String supplierFirstCreate = "supplierFirstCreate";
	public static final String MONGO_COLLECTION = "MONGO_COLLECTION";
}
