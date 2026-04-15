package com.jio.cwms.onboard.repository.inmem;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.jio.cwms.onboard.model.UpstreamApplicationMaster;
import com.jio.cwms.onboard.service.UpstreamApplicationMasterService;

import jakarta.annotation.PostConstruct;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class InMemoryUpstreamApplicationDetails extends UpstreamApplicationMasterService {

	private static List<UpstreamApplicationMaster> upstreamApplicationList = new ArrayList<>();

	private static List<String> applications = new ArrayList<>();

	protected static List<UpstreamApplicationMaster> getUpstreamApplicationList() {
		return InMemoryUpstreamApplicationDetails.upstreamApplicationList;
	}

	private static void setUpstreamApplicationList(final List<UpstreamApplicationMaster> upstreamApplicationList) {
		InMemoryUpstreamApplicationDetails.upstreamApplicationList = upstreamApplicationList;
	}

	protected static List<String> getApplications() {
		return InMemoryUpstreamApplicationDetails.applications;
	}

	private static void setApplications(final List<String> applications) {
		InMemoryUpstreamApplicationDetails.applications = applications;
	}

	@PostConstruct
	protected void initialize() {
		final List<UpstreamApplicationMaster> list = super.findAll();
		if (list.isEmpty()) {
			InMemoryUpstreamApplicationDetails.log.info("No upstream applications loaded in the upstream application repository");
		} else {
			InMemoryUpstreamApplicationDetails.setUpstreamApplicationList(list);
			InMemoryUpstreamApplicationDetails.setApplications(list.stream().map(UpstreamApplicationMaster::getSourceSystem).collect(Collectors.toList()));
			InMemoryUpstreamApplicationDetails.log.info("Loaded {} upstream applications details from database in the repository", list.size());
		}
	}

	protected UpstreamApplicationMaster getBySourceSystemAndSubSystem(final String sourceSystem, final String subSystem) {
		if (!InMemoryUpstreamApplicationDetails.upstreamApplicationList.isEmpty()) {
			return InMemoryUpstreamApplicationDetails.getUpstreamApplicationList().stream().filter(obj -> obj.getSourceSystem().equals(sourceSystem) && obj.getSourceSubSystem().equals(subSystem)).findFirst().orElse(new UpstreamApplicationMaster());
		}
		InMemoryUpstreamApplicationDetails.log.info("No upstream application master details loaded in-memory but accessed by source system and sub system | Source System: {} | Sub System: {}",
				sourceSystem,
				subSystem
				);
		return new UpstreamApplicationMaster();
	}

	@Scheduled(cron = "#{@getCronExpression}")
	public void reload() {
		InMemoryUpstreamApplicationDetails.log.info("Re-initializing in-memory upstream application details");
		initialize();
	}

}
