package com.jio.cwms_dataprovision.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms_dataprovision.entity.ApplicationMasterEntity;

@Repository
public interface ApplicationMasterRepositiry extends JpaRepository<ApplicationMasterEntity, Integer> {

	Optional<ApplicationMasterEntity> findByDamTargetSystem(String targetName);

	ApplicationMasterEntity findByDamTargetSystemAndDamCallingMechenism(String oimtargetsystem,
			String oimcallingmechanism);
	
//	ApplicationMasterEntity findByDamTargetSystemAndDamStatus(String DamTargetSystem, String damStatus);
}
