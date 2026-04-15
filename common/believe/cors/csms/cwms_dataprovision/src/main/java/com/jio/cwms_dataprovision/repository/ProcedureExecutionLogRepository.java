package com.jio.cwms_dataprovision.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms_dataprovision.entity.ProcedureExecutionLog;


@Repository
public interface ProcedureExecutionLogRepository extends JpaRepository<ProcedureExecutionLog, Integer> {
	
}