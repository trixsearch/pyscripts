package com.jio.cwms.onboard.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.jio.cwms.onboard.constants.ApiConstant;
import com.jio.cwms.onboard.dto.request.Auth;
import com.jio.cwms.onboard.model.ApplicationMasterEntity;
import com.jio.cwms.onboard.model.ParameterMaster;
import com.jio.cwms.onboard.model.UpstreamMaster;
import com.jio.cwms.onboard.model.ValidationModel;
import com.jio.cwms.onboard.repository.ApplicationMasterRepository;
import com.jio.cwms.onboard.repository.ParameterRepository;
import com.jio.cwms.onboard.repository.UpstreamRepository;
import com.jio.cwms.onboard.repository.ValidationRepository;

import jakarta.annotation.PostConstruct;

@Component
public class ApplicationConfig {

	public static final String MODULE_NAME = "cwms-onboard";

	private static List<ValidationModel> headerFieldList;

	private static int headerValidation;

	private static UpstreamMaster upstreamMaster;

	private static UpstreamMaster epFetchData;

	private static UpstreamMaster upstreamMasterAccess;

	private static UpstreamMaster upstreamMasterCandidate;

	private static UpstreamMaster upstreamMasterCandidateOnbrd;

	private static UpstreamMaster upstreamMasterCandidateStatus;

	private static ApplicationMasterEntity orgList;

	private static ParameterMaster redisData;
	
	private static ParameterMaster qhDateRange;

	private static UpstreamMaster supplierFirstToken;

	private static UpstreamMaster supplierFirstCreate;
	

	@Autowired
	private ValidationRepository validationRepository;

	@Autowired
	private ParameterRepository parameterRepository;

	@Autowired
	private UpstreamRepository upstreamRepository;

	@Autowired
	private ParameterRepository paramRepo;

	@Autowired
	private ApplicationMasterRepository applicationMasterRepositiry;

	private static List<ValidationModel> dateFieldList;

	private static List<ValidationModel> accessDateFieldList;

	private static ApplicationMasterEntity QMSfield;

	private static ApplicationMasterEntity hotToken;
	
	private static ApplicationMasterEntity mongoCollection;
	
	private static ParameterMaster mongoParameterMaster;

	@PostConstruct
	public void initialize() {

		ApplicationConfig.setHeaderFieldList(
				validationRepository.findByValidationKeyAndGroup(ApiConstant.onboard, ApiConstant.header));
		final var parameterMaster = parameterRepository.findByGroupAndKey(ApiConstant.onboard,
				ApiConstant.headerValidation);
		ApplicationConfig.setHeaderValidation(parameterMaster.getActive());
		ApplicationConfig
				.setUpstreamMaster(upstreamRepository.findBySourceSystemAndSourceSubSystem("CWMS", "userOnboard"));
		ApplicationConfig
				.setUpstreamMasterAccess(upstreamRepository.findBySourceSystemAndSourceSubSystem("CWMS", "userAccess"));
		ApplicationConfig.setDateFieldList(
				validationRepository.findByDataTypeAndGroup(ApiConstant.dateType, ApiConstant.resourceDetails));
		ApplicationConfig.setAccessDateFieldList(
				validationRepository.findByDataTypeAndGroup(ApiConstant.dateType, ApiConstant.accessDetails));
		ApplicationConfig.setUpstreamMasterCandidate(
				upstreamRepository.findBySourceSystemAndSourceSubSystem(ApiConstant.onboard, ApiConstant.empDetails));
		ApplicationConfig.setUpstreamMasterCandidateOnbrd(
				upstreamRepository.findBySourceSystemAndSourceSubSystem(ApiConstant.onboard, ApiConstant.candidate));
		ApplicationConfig.setUpstreamMasterCandidateStatus(upstreamRepository
				.findBySourceSystemAndSourceSubSystem(ApiConstant.onboard, ApiConstant.candidateStatus));
		ApplicationConfig.setRedisData(paramRepo.findByGroupAndKey(ApiConstant.redis, ApiConstant.ttl));
		ApplicationConfig.setOrgList(applicationMasterRepositiry.findByDamTargetSystem(ApiConstant.refresh));

		ApplicationConfig
				.setEpFetchData(upstreamRepository.findBySourceSystemAndSourceSubSystem("onboard", "EpVendorFetch"));
		ApplicationConfig.setQMSfield(applicationMasterRepositiry.findByDamTargetSystem(ApiConstant.qms));
		  ApplicationConfig.setSupplierFirstToken(upstreamRepository.findBySourceSystemAndSourceSubSystem(ApiConstant.onboard, ApiConstant.supplierFirstToken));
	        ApplicationConfig.setSupplierFirstCreate(upstreamRepository.findBySourceSystemAndSourceSubSystem(ApiConstant.onboard, ApiConstant.supplierFirstCreate));
	        ApplicationConfig.setMongoCollection(applicationMasterRepositiry.findByDamTargetSystem(ApiConstant.MONGO_COLLECTION));
	        ApplicationConfig.setMongoParameterMaster(parameterRepository.findByGroupAndKey("organisation", "jio"));
	        ApplicationConfig.setQhDateRange(paramRepo.findByGroupAndKey(ApiConstant.quikhire, ApiConstant.dateRange));
	        
	}

	public static ParameterMaster getRedisData() {
		return redisData;
	}

	public static ParameterMaster getQhDateRange() {
		return qhDateRange;
	}

	public static UpstreamMaster getEpFetchData() {
		return epFetchData;
	}

	public static void setHotToken(ApplicationMasterEntity hotToken) {
		ApplicationConfig.hotToken = hotToken;
	}

	public static ApplicationMasterEntity getHotToken() {
		return hotToken;
	}

	public static ParameterMaster getMongoParameterMaster() {
		return mongoParameterMaster;
	}

	public static void setMongoParameterMaster(ParameterMaster mongoParameterMaster) {
		ApplicationConfig.mongoParameterMaster = mongoParameterMaster;
	}
	
	public static void setEpFetchData(UpstreamMaster epFetchData) {
		ApplicationConfig.epFetchData = epFetchData;
	}

	public static void setRedisData(ParameterMaster redisData) {
		ApplicationConfig.redisData = redisData;
	}

	public static void setQhDateRange(ParameterMaster qhDateRange) {
		ApplicationConfig.qhDateRange = qhDateRange;
	}

	protected static List<ValidationModel> getHeaderFieldList() {
		return ApplicationConfig.headerFieldList;
	}

	private static void setHeaderFieldList(final List<ValidationModel> headerFieldList) {
		ApplicationConfig.headerFieldList = headerFieldList;
	}

	public static int getHeaderValidation() {
		return ApplicationConfig.headerValidation;
	}

	public static void setHeaderValidation(final int headerValidation) {
		ApplicationConfig.headerValidation = headerValidation;
	}

	public static UpstreamMaster getUpstreamMaster() {
		return ApplicationConfig.upstreamMaster;
	}

	private static void setUpstreamMaster(final UpstreamMaster upstreamMaster) {
		ApplicationConfig.upstreamMaster = upstreamMaster;
	}

	public static UpstreamMaster getUpstreamMasterAccess() {
		return upstreamMasterAccess;
	}

	public static void setUpstreamMasterAccess(UpstreamMaster upstreamMasterAccess) {
		ApplicationConfig.upstreamMasterAccess = upstreamMasterAccess;
	}

	public static List<ValidationModel> getDateFieldList() {
		return dateFieldList;
	}

	public static void setDateFieldList(List<ValidationModel> dateFieldList) {
		ApplicationConfig.dateFieldList = dateFieldList;
	}

	public static List<ValidationModel> getAccessDateFieldList() {
		return accessDateFieldList;
	}

	public static void setAccessDateFieldList(List<ValidationModel> accessDateFieldList) {
		ApplicationConfig.accessDateFieldList = accessDateFieldList;
	}

	public static UpstreamMaster getUpstreamMasterCandidate() {
		return upstreamMasterCandidate;
	}

	public static void setUpstreamMasterCandidate(UpstreamMaster upstreamMasterCandidate) {
		ApplicationConfig.upstreamMasterCandidate = upstreamMasterCandidate;
	}

	public static UpstreamMaster getUpstreamMasterCandidateOnbrd() {
		return upstreamMasterCandidateOnbrd;
	}

	public static void setUpstreamMasterCandidateOnbrd(UpstreamMaster upstreamMasterCandidateOnbrd) {
		ApplicationConfig.upstreamMasterCandidateOnbrd = upstreamMasterCandidateOnbrd;
	}

	public static UpstreamMaster getUpstreamMasterCandidateStatus() {
		return upstreamMasterCandidateStatus;
	}

	public static void setUpstreamMasterCandidateStatus(UpstreamMaster upstreamMasterCandidateStatus) {
		ApplicationConfig.upstreamMasterCandidateStatus = upstreamMasterCandidateStatus;
	}

	public static ApplicationMasterEntity getOrgList() {
		return orgList;
	}

	public static void setOrgList(ApplicationMasterEntity orgList) {
		ApplicationConfig.orgList = orgList;
	}

	public static ApplicationMasterEntity getQMSfield() {
		return QMSfield;
	}

	public static void setQMSfield(ApplicationMasterEntity qmsField) {
		ApplicationConfig.QMSfield = qmsField;
	}

	public static ApplicationMasterEntity getMongoCollection() {
		return mongoCollection;
	}

	public static void setMongoCollection(ApplicationMasterEntity mongoCollection) {
		ApplicationConfig.mongoCollection = mongoCollection;
	}

	public static UpstreamMaster getSupplierFirstToken() {
		return supplierFirstToken;
	}

	public static void setSupplierFirstToken(UpstreamMaster supplierFirstToken) {
		ApplicationConfig.supplierFirstToken = supplierFirstToken;
	}

	public static UpstreamMaster getSupplierFirstCreate() {
		return supplierFirstCreate;
	}

	public static void setSupplierFirstCreate(UpstreamMaster supplierFirstCreate) {
		ApplicationConfig.supplierFirstCreate = supplierFirstCreate;
	}


	public String updateRefresh(Auth auth) {

		ApplicationMasterEntity appMaster = applicationMasterRepositiry.findByDamTargetSystem(ApiConstant.refresh);

		if (appMaster.getDamUsername().equals(auth.getUsername())
				&& appMaster.getDamPassword().equals(auth.getPassword())) {
			try {
				initialize();
				return "refresh done";
			} catch (Exception e) {
				return "refresh failed";
			}
		} else {
			return "Authentication Failed";
		}

	}

}
