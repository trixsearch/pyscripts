package com.jio.cwms.onboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jio.cwms.onboard.model.UpstreamMaster;

@Repository
public interface UpstreamRepository extends JpaRepository<UpstreamMaster, Integer> {

	UpstreamMaster findBySourceSystemAndSourceSubSystem(String uamSourceSystem, String sourceSubSystem);

}
