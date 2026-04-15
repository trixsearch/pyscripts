package com.jio.cwms_dataprovision.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.jio.cwms_dataprovision.entity.RelienceRetailsMaster;

@Repository
public interface RelienceRetailsMasterRepositiry extends JpaRepository<RelienceRetailsMaster, Integer> {

	@Query(value = "select distinct rrm_matrix_type from reliance_retails_master where rrm_business_code = ?1 and rrm_segment_code = ?2 and rrm_family_code = ?3 and rrm_class_code = ?4 and rrm_job_code = ?5", nativeQuery = true)
	List<String> getMatrixTypeList(String businessCode, String segmentCode, String familyCode, String classCode,
			String jobCode);

}
