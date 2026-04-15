package com.jio.cwms_dataprovision.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.jio.cwms_dataprovision.entity.JioRoleMaster;

@Repository
public interface JioRoleMasterRepository extends JpaRepository<JioRoleMaster, Integer> {

	@Query(value = "select distinct jrm_matrix_type from jio_role_master where jrm_vertical = ?1 and jrm_work_area = ?2 and jrm_work_stream = ?3 and jrm_role_position_code = ?4", nativeQuery = true)
	List<String> getMatrixTypeList(String vertical, String workArea, String workStream, String roleCode);

}
