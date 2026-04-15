package com.jio.cwms.onboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms.onboard.model.ParameterMaster;

@Repository
public interface ParameterRepository extends JpaRepository<ParameterMaster, Long> {

	ParameterMaster findByGroupAndKey(String group, String key);
	
}
