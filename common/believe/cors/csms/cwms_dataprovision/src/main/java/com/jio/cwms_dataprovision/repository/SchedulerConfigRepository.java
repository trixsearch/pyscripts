package com.jio.cwms_dataprovision.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.jio.cwms_dataprovision.entity.SchedularConfig;



@Repository
public interface SchedulerConfigRepository extends JpaRepository<SchedularConfig, Integer> {
	
	Optional<SchedularConfig> findBySystemNameAndTransModeAndSchedulerTypeAndOrgId(String systemName, String transMode, String schedulerType, String orgId);
	
	List<SchedularConfig> findBySystemNameAndSchedulerTypeAndActiveTrue(String system, String type);
	
	List<SchedularConfig> findBySchedulerTypeAndActiveTrue(String schedulerType);
	
}
