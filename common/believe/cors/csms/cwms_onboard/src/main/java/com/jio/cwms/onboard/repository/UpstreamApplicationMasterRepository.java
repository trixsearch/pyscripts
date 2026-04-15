package com.jio.cwms.onboard.repository;

import java.sql.SQLException;

import org.springframework.dao.DataAccessException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.jio.cwms.onboard.model.UpstreamApplicationMaster;

@Repository
@Transactional(rollbackFor = {SQLException.class, DataAccessException.class})
public interface UpstreamApplicationMasterRepository extends JpaRepository<UpstreamApplicationMaster, Long> {

	@Query(value = "SELECT uam FROM UpstreamApplicationMaster uam WHERE uam.sourceSystem = ?1 AND uam.sourceSubSystem = ?2")
	UpstreamApplicationMaster findBySourceSystemAndSubSystem(String sourceSystem, String sourceSubSystem);

}
