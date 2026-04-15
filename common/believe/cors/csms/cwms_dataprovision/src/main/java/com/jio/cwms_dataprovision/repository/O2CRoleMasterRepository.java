package com.jio.cwms_dataprovision.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.jio.cwms_dataprovision.entity.O2CRoleMaster;

@Repository
public interface O2CRoleMasterRepository extends JpaRepository<O2CRoleMaster, Integer> {

	@Query(value = "select distinct orm_matrix_type from o2c_role_master where orm_sector = ?1 and orm_plant = ?2 and orm_department = ?3 and orm_trade = ?4", nativeQuery = true)
	List<String> getMatrixTypeList(String sector, String plant, String department, String trade);

}
