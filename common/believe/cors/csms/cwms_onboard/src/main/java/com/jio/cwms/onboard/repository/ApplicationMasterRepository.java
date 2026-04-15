package com.jio.cwms.onboard.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms.onboard.model.ApplicationMasterEntity;



@Repository
public interface ApplicationMasterRepository extends JpaRepository<ApplicationMasterEntity, Integer> {

	ApplicationMasterEntity findByDamTargetSystem (String targetName);

}
