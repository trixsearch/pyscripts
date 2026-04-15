package com.jio.cwms_dataprovision.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


import com.jio.cwms_dataprovision.constants.AppConstant;
import com.jio.cwms_dataprovision.dto.Auth;
import com.jio.cwms_dataprovision.entity.ApplicationMasterEntity;
import com.jio.cwms_dataprovision.repository.ApplicationMasterRepositiry;

import jakarta.annotation.PostConstruct;

@Component
public class ApplicationConfig {

	@Autowired
	private ApplicationMasterRepositiry applicationMasterRepository;

	private ApplicationMasterEntity oimApiField;
	
	private ApplicationMasterEntity scrumApiFields;
	
	private ApplicationMasterEntity o2cApiFields;
	
	private ApplicationMasterEntity betterPlace;
	
	private ApplicationMasterEntity cuaField;
	
	private ApplicationMasterEntity rarsFields;
	
	private ApplicationMasterEntity wcsFields;
	
	private ApplicationMasterEntity prmFields;
	
	private ApplicationMasterEntity auth;
	
	private ApplicationMasterEntity orgList;
	
	private ApplicationMasterEntity cuaNew;
	
	private ApplicationMasterEntity o2cApp;
	
	private ApplicationMasterEntity mHereFields;
	
//	private ApplicationMasterEntity grcFields;
	
	private ApplicationMasterEntity slpFields;
	
	@PostConstruct
	public void initialize() {
		setOimApiField(applicationMasterRepository.findByDamTargetSystem(AppConstant.oimTargetSystem).get());	
	    setScrumApiFields(applicationMasterRepository.findByDamTargetSystem(AppConstant.scrumTargetSystem).get());
	    setO2cApiFields(applicationMasterRepository.findByDamTargetSystem(AppConstant.o2cTargetSystem).get());
	    setBetterPlace(applicationMasterRepository.findByDamTargetSystem(AppConstant.betterPlaceTargetSystem).get());
	    setCuaField(applicationMasterRepository.findByDamTargetSystem(AppConstant.cuaTargetSystem).get());
	    setRarsFields(applicationMasterRepository.findByDamTargetSystem(AppConstant.rarsTargetSystem).get());
	    setWcsFields(applicationMasterRepository.findByDamTargetSystem(AppConstant.wcsTargetSystem).get());
	    setPrmFields(applicationMasterRepository.findByDamTargetSystem(AppConstant.prmTargetSystem).get());
	    setOrgList(applicationMasterRepository.findByDamTargetSystem(AppConstant.refresh).get());
	    setCuaNew(applicationMasterRepository.findByDamTargetSystem(AppConstant.cuaNew).get());
	    setO2cApp(applicationMasterRepository.findByDamTargetSystem(AppConstant.o2cApproval).get());
	    setMHereFields(applicationMasterRepository.findByDamTargetSystem(AppConstant.mHereTargetSystem).get());
	    setSlpFields(applicationMasterRepository.findByDamTargetSystem(AppConstant.slpTargetSystem).get());
	    
//	    setGrcFields(applicationMasterRepository.findByDamTargetSystem(AppConstant.grc).get());
	//  setAuth(applicationMasterRepository.findByDamTargetSystem(AppConstant.refresh).get());
	    
	}
	public ApplicationMasterEntity getPrmFields() {
		return prmFields;
	}

	public void setPrmFields(ApplicationMasterEntity prmFields) {
		this.prmFields = prmFields;
	}

	public ApplicationMasterEntity getOimApiField() {
		return oimApiField;
	}

	public void setOimApiField(ApplicationMasterEntity oimApiField) {
		this.oimApiField = oimApiField;
	}

	public ApplicationMasterEntity getScrumApiFields() {
		return scrumApiFields;
	}

	public void setScrumApiFields(ApplicationMasterEntity scrumApiFields) {
		this.scrumApiFields = scrumApiFields;
	}

	public ApplicationMasterEntity getBetterPlace() {
		return betterPlace;
	}

	public void setBetterPlace(ApplicationMasterEntity betterPlace) {
		this.betterPlace = betterPlace;
	}

	public ApplicationMasterEntity getCuaField() {
		return cuaField;
	}

	public void setCuaField(ApplicationMasterEntity cuaField) {
		this.cuaField = cuaField;
	}

	public ApplicationMasterEntity getRarsFields() {
		return rarsFields;
	}

	public void setRarsFields(ApplicationMasterEntity rarsFields) {
		this.rarsFields = rarsFields;
	}

	public ApplicationMasterEntity getWcsFields() {
		return wcsFields;
	}

	public void setWcsFields(ApplicationMasterEntity wcsFields) {
		this.wcsFields = wcsFields;
	}

	public ApplicationMasterEntity getO2cApiFields() {
		return o2cApiFields;
	}
	public void setO2cApiFields(ApplicationMasterEntity o2cApiFields) {
		this.o2cApiFields = o2cApiFields;
	}
	public ApplicationMasterEntity getOrgList() {
		return orgList;
	}
	public void setOrgList(ApplicationMasterEntity orgList) {
		this.orgList = orgList;
	}
	
//	public ApplicationMasterEntity getGrcField() {
//		return grcFields;
//	}
//
//	public void setGrcFields(ApplicationMasterEntity grcFields) {
//		this.grcFields = grcFields;
//	}
	
	
	public ApplicationMasterEntity getCuaNew() {
		return cuaNew;
	}
	public void setCuaNew(ApplicationMasterEntity cuaNew) {
		this.cuaNew = cuaNew;
	}
	
	public ApplicationMasterEntity getO2cApp() {
		return o2cApp;
	}
	public void setO2cApp(ApplicationMasterEntity o2cApp) {
		this.o2cApp = o2cApp;
	}
	
	public ApplicationMasterEntity getMHereFields() {
		return mHereFields;
	}

	public void setMHereFields(ApplicationMasterEntity mHereFields) {
		this.mHereFields = mHereFields;
	}
	
	public ApplicationMasterEntity getSlpFields() {
		return slpFields;
	}

	public void setSlpFields(ApplicationMasterEntity slpFields) {
		this.slpFields = slpFields;
	}
	
	public String updateRefresh(Auth auth) {

		ApplicationMasterEntity appMaster = applicationMasterRepository.findByDamTargetSystem(AppConstant.refresh).get();
		
		if(appMaster.getDamUsername().equals(auth.getUsername())&&
				appMaster.getDamPassword().equals(auth.getPassword()))
		{
			try {
				initialize();
			return "refresh done" ;
			}
			catch (Exception e) {
				return "refresh failed" ;
			}
		}
	else		{
	   return "Authentication Failed";	
	}
		
	}


}
