package com.jio.cwms_dataprovision.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms_dataprovision.entity.EmployeeLog;

@Repository
public interface EmployeeLogRepository extends JpaRepository<EmployeeLog, Integer> {
	Optional<EmployeeLog> findFirstByEmpIdAndSystemNameOrderByIdDesc(String empId, String systemName);
}
