package com.jio.cwms.onboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.jio.cwms.onboard.entity.EmployeeLog;

@Repository
public interface EmployeeLogRepository extends JpaRepository<EmployeeLog, Integer> {
//	Optional<EmployeeLog> findFirstByEmpIdAndSystemNameOrderByIdDesc(String empId, String systemName);
}
