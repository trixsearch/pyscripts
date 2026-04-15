package com.jio.cwms_dataprovision.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.jio.cwms_dataprovision.entity.AccessRequestLogEntity;

@Repository
public interface AcessRequestLogAsyncRepository extends JpaRepository<AccessRequestLogEntity, Integer>{

	@Query(value = """
			SELECT * FROM access_request_log arl
			WHERE arl.system_name = :systemName 
			  AND arl.trans_mode = :transMode
			  AND arl.status IN (:conditionCheck)
			  AND (
			      (:useInclude = 0 AND arl.siteID NOT IN (:sites))
			      OR
			      (:useInclude = 1 AND arl.siteID IN (:sites))
			  )
			ORDER BY arl.id ASC
			LIMIT :limit
			""", nativeQuery = true)
	List<AccessRequestLogEntity> findPendingFirstHitsInLastHour(@Param("systemName") String systemName,@Param("transMode") String transMode,
			@Param("conditionCheck") List<String> conditionCheck, @Param("sites") List<String> sites,
			@Param("useInclude") int useInclude,
			@Param("limit") int limit);
	
	@Query(value = """
			SELECT * FROM access_request_log arl
			WHERE arl.system_name = :systemName 
			AND arl.trans_mode = :transMode
			  AND arl.status IN (:conditionCheck)
			  AND arl.retry < :maxRetry
			ORDER BY arl.id ASC
			LIMIT :limit
			""", nativeQuery = true)
	List<AccessRequestLogEntity> findAllFirstHitsWithoutSuccess(@Param("systemName") String systemName,@Param("transMode") String transMode,
			@Param("conditionCheck") List<String> conditionCheck, @Param("maxRetry") int maxRetry,
			@Param("limit") int limit);

	Optional<AccessRequestLogEntity> findTopBySystemNameAndEmpIdAndTransModeAndTransIdStartingWithOrderByRequestTimeDesc(
            String systemName,
            String empId,
            String transMode,
            String transIdPrefix);

 
//    Optional<AccessRequestLogEntity> findTopBySystemNameAndEmpIdAndTransIdStartingWithOrderByRequestTimeDesc(
//            String systemName,
//            String empId,
//            String transIdPrefix);
    
	List<AccessRequestLogEntity> findBySystemNameAndEmpIdAndSiteIDAndOrgIdAndTransModeAndStatus(
	        @Param("systemName") String systemName,
	        @Param("empId") String empId,
	        @Param("siteID") String siteId,
	        @Param("orgId") String orgId,
	        @Param("transMode") String transMode,
	        @Param("status") String status);

}
