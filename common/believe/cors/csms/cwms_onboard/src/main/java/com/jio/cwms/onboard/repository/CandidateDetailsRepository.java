package com.jio.cwms.onboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms.onboard.model.CandidateDetailsModel;

@Repository
public interface CandidateDetailsRepository extends JpaRepository <CandidateDetailsModel, String> {

}
