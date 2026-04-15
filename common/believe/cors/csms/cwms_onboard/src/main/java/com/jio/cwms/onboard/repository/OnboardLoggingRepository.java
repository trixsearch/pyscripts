package com.jio.cwms.onboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms.onboard.model.OnboardLogging;

@Repository
public interface OnboardLoggingRepository extends JpaRepository<OnboardLogging, Integer>{

}
