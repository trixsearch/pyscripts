package com.jio.cwms.onboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.jio.cwms.onboard.model.HeaderValidationMaster;

@Repository
@Transactional
public interface HeaderValidationMasterRepository extends JpaRepository<HeaderValidationMaster, Long> {

}
