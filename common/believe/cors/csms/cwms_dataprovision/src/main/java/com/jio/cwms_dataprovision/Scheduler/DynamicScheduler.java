package com.jio.cwms_dataprovision.Scheduler;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;

import com.jio.cwms_dataprovision.dto.SchedulerConfigRequest;
import com.jio.cwms_dataprovision.entity.SchedularConfig;
import com.jio.cwms_dataprovision.repository.SchedulerConfigRepository;
import com.jio.cwms_dataprovision.wrapper.LogWrapper;

@Service
public class DynamicScheduler {

	private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);

	@Autowired
	private CUASchedulerService cUASchedulerService;

	@Autowired
	private SchedulerConfigRepository schedulerConfigRepository;

	@Autowired
	private SchedulerLoggerService schedulerLoggerService;
	
	@Autowired
	private MhereSchedulerService mhereSchedulerService;
	
	@Autowired
	private OIMSchedulerService oimSchedulerService;

	public synchronized void reschedule(SchedulerConfigRequest config) {
		CronExpression cronExpression = CronExpression.parse(config.getCronExpression());

		executor.schedule(
				() -> runTask(config.getSystemName(), config.getTransMode(), config.getOrgId(),
						config.getSchedulerType(), config.getConditionCheck(), cronExpression),
				getDelay(cronExpression), TimeUnit.MILLISECONDS);

		LogWrapper.info(getClass(),
				"New task scheduled for system: " + config.getSystemName() + ", transMode: " + config.getTransMode()
						+ ", orgId: " + config.getOrgId() + ", schedulerType: " + config.getSchedulerType() + ", cron: "
						+ config.getCronExpression());
	}

	public void runTask(String systemName, String transMode, String orgId, String schedulerType, String conditionCheck,
			CronExpression cronExpression) {

		String procedureName = systemName + "-" + transMode + "-" + schedulerType;

		try {
			// Fetch latest config from DB
			Optional<SchedularConfig> configOpt = schedulerConfigRepository
					.findBySystemNameAndTransModeAndSchedulerTypeAndOrgId(systemName, transMode, schedulerType, orgId);

			if (configOpt.isEmpty()) {
				LogWrapper.warn(getClass(), "No scheduler config found for system: " + systemName + ", skipping task.");
				return;
			}

			SchedularConfig config = configOpt.get();

			if (!config.isActive()) {
				LogWrapper.info(getClass(),
						"Scheduler is inactive for system: " + systemName + ", skipping execution.");
				return;
			}

			// Prepare request using latest config
			SchedulerConfigRequest configRequest = new SchedulerConfigRequest();
			configRequest.setSystemName(systemName);
			configRequest.setTransMode(transMode);
			configRequest.setOrgId(orgId);
			configRequest.setBatchSize(config.getBatchSize());
			configRequest.setCronExpression(config.getCronExpression());
			configRequest.setCronSite(config.getCronSite());
			configRequest.setSchedulerType(schedulerType);
			configRequest.setMaximumRetry(config.getMaximumRetry());
			configRequest.setReadtimeout(config.getReadTimeout());
			configRequest.setConditionCheck(config.getConditionCheck());
			configRequest.setCronExecutionSkipTime(config.getCronExecutionSkipTime());

			LogWrapper.info(getClass(), "Running task for transMode: " + transMode + " at " + LocalDateTime.now());

			schedulerLoggerService.logStart(procedureName); // Log start

			executor.submit(() -> {
				try {

					String key = systemName + "-" + transMode + "-" + orgId;
					
					switch (key) {
					case "CUA_NEW-HIB-RR":
						cUASchedulerService.cuaAsyncSchedulerService(configRequest, transMode);
						break;
					case "MHERE-HIB-RR":
						mhereSchedulerService.mhereAsyncSchedulerService(configRequest, transMode);
						break;
					case "OIM-HIB-RR":
						oimSchedulerService.oimAsyncSchedulerService(configRequest, transMode);
						break;
						
					 default:
                         LogWrapper.warn(getClass(),
                                 "No matching task for systemName=" + systemName +
                                 ", transMode=" + transMode +
                                 ", orgId=" + orgId);
					}
					schedulerLoggerService.logEnd(procedureName); // Log END
				} catch (Exception e) {
					LogWrapper.error(getClass(), "Batch execution error: " + e.getMessage(), e);
					schedulerLoggerService.logError(procedureName + "-Failed", e); // Log ERROR
				}
			});

		} finally {
			// Always reschedule
			executor.schedule(() -> runTask(systemName, transMode, orgId, schedulerType, conditionCheck, cronExpression),
					getDelay(cronExpression), TimeUnit.MILLISECONDS);
		}
	}

	private long getDelay(CronExpression cronExpression) {
		ZonedDateTime now = ZonedDateTime.now();
		ZonedDateTime next = cronExpression.next(now);
		return Duration.between(now, next).toMillis();
	}
}
