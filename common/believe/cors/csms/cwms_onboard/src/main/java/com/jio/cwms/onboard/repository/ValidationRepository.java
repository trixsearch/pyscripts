package com.jio.cwms.onboard.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms.onboard.model.ValidationModel;

@Repository
public interface ValidationRepository extends JpaRepository<ValidationModel, Long> {

	List<ValidationModel> findByValidationKeyAndGroup(String validationKey , String group);
	

	List<ValidationModel> findByDataTypeAndGroup(String datetype, String group);


}
