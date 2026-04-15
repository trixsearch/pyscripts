# CWMS Data Provision

**Repository:** `cwms_dataprovision`  
**Group:** `com.jio`  
**Version:** 1.0.0  
**Description:** Spring Boot microservice for CWMS (Contract Workforce Management System) data provisioning across multiple downstream systems (PRM, OIM, Scrum, RARS, MHere, CUA, WCS, SLP, Better Place, O2C).

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Configuration](#configuration)
5. [API Endpoints](#api-endpoints)
6. [Core Flows](#core-flows)
7. [Services & Integrations](#services--integrations)
8. [Scheduling (HIB/DEHIB)](#scheduling-hibdehib)
9. [Data Model](#data-model)
10. [Related Documentation](#related-documentation)

---

## Overview

CWMS Data Provision is a **data orchestration service** that:

- Receives resource/employee provisioning requests (onboard, modify, terminate, hibernation, de-hibernation).
- Determines which downstream systems to call based on **organization**, **site**, **transaction mode**, and **approval status**.
- Executes integrations **synchronously** (e.g. DEHIB, ADD, MOD, TER) or **asynchronously via schedulers** (e.g. HIB).
- Pushes responses to **Redis** and optionally notifies **Better Place**.
- Supports **Spring Cloud Config** and **Kafka** for event-driven flows (O2C domain updates).

---

## Tech Stack

| Category        | Technology                          |
|----------------|-------------------------------------|
| Framework      | Spring Boot 3.1.2                   |
| Java           | 17                                  |
| Data           | Spring Data JPA, MySQL, MongoDB, Redis |
| Config         | Spring Cloud Config, Bootstrap      |
| Messaging      | Spring Kafka                         |
| Security       | Jasypt (encryption)                  |
| Utilities      | Lombok, Jackson, Gson, Apache Commons Lang3, Cron Utils |
| External APIs  | REST (RestTemplate), SOAP (Jakarta XML SOAP, SAAJ) |

---

## Project Structure

```
cwms_dataprovision/
├── pom.xml
├── src/main/
│   ├── java/com/jio/cwms_dataprovision/
│   │   ├── CwmsDataprovisionApplication.java   # Entry point, RestTemplate bean
│   │   ├── config/                             # Application config, JDBC templates
│   │   ├── constants/                          # Enums, app constants
│   │   ├── controller/                         # REST & Kafka entry points
│   │   ├── dto/                               # Request/response DTOs (general, oim, mHere, prm, slp, rars, bp)
│   │   ├── entity/                            # JPA entities
│   │   ├── repository/                        # JPA repositories
│   │   ├── Scheduler/                         # Dynamic schedulers (CUA, MHere, OIM)
│   │   ├── service/                           # Business & integration services
│   │   └── wrapper/                           # Logging wrapper
│   └── resources/
│       ├── application.properties
│       └── bootstrap.yml
├── logs/                                      # Application logs
├── HIB_DEHIB_Implementation.md               # HIB/DEHIB flow details
├── SCRUM_SERVICE_UPDATES.md                   # Scrum height field escaping
└── CWMS_Dataprovision_README.md               # This file
```

### Package Summary

| Package        | Purpose |
|----------------|--------|
| **controller** | REST API (`/services/*`), Kafka listeners (commented in code) |
| **service**    | Condition check, execution, and per-system integrations (PRM, OIM, Scrum, RARS, MHere, CUA, CUA_NEW, WCS, SLP, Better Place, O2C mapping) |
| **Scheduler**  | Dynamic cron-based schedulers for HIB (CUA_NEW, MHere, OIM) |
| **config**    | ApplicationConfig (DB-backed app master), JDBC templates |
| **entity**    | SchedularConfig, AccessRequestLogEntity, ProcedureExecutionLog, EmployeeLog, GrcLog, ApplicationMasterEntity |
| **repository** | JPA repos for above entities, role masters (Jio, O2C, Reliance Retails) |
| **dto**       | GeneralRequest, Response, ResourceDetails, SchedulerConfigRequest, system-specific DTOs |
| **constants** | CwmsConstants, AppConstant, ServiceDataEnum, OIMActionEnum, PRMActionEnum, AppStatus |

---

## Configuration

- **Profiles:** `spring.profiles.active` set in `bootstrap.yml` (e.g. `sit`).
- **Config server:** `spring.cloud.config.name=datasource` (datasource config from config server).
- **Server port:** `9091` (overridable via config).
- **Kafka:** Topic names and group IDs in `application.properties` / config server (e.g. `prod-domain-updates` for O2C).
- **MongoDB / MySQL / Redis:** Typically provided by Spring Cloud Config per environment.

Key `application.properties` snippets:

```properties
server.port=9091
spring.cloud.config.name=datasource
logging.level.root=INFO
app.config.kafka.consumer.o2c.approval.data.topic.name=prod-domain-updates
```

---

## API Endpoints

All under base path **`/services`**.

| Method | Endpoint              | Description |
|--------|------------------------|-------------|
| POST   | `/services/execute`    | Main provisioning API. Accepts `GeneralRequest` (resource_Details, serviceList, clientTxnId, etc.). Runs condition check, executes selected services, pushes to Redis, updates Better Place. Returns `Response` (workerCode, activity, system list). |
| POST   | `/services/refreshProperties` | Refreshes in-memory config from DB. Body: `Auth` (username/password). Returns "refresh done", "refresh failed", or "Authentication Failed". |
| POST   | `/services/trigger`    | Triggers a scheduler run. Body: `SchedulerConfigRequest` with `systemName`, `transMode`, `schedulerType`, `orgId`. Looks up `SchedularConfig` from DB; if active, calls `DynamicScheduler.reschedule(...)`. Returns 200 + message or 4xx with error. |

### Execute Request Example

```json
{
  "clientTxnId": "TXN-001",
  "resource_Details": {
    "workerCode": "PPRR00001234",
    "organization": "RR",
    "siteID": "RR",
    "transMode": "ADD",
    "approval_Status": "APP",
    "permanent_Address": "...",
    "local_Address": "..."
  },
  "serviceList": []
}
```

If `serviceList` is empty, the service builds the list from organization/site/approval/transMode (see [Core Flows](#core-flows)).

---

## Core Flows

1. **Request in:** `GeneralRequest` → `ConditionCheckService.conditionCheckForServices(request)`.
2. **Decimal normalization:** `resource_Details` salary/CTC-related string fields are set to `"0.0"` if blank; addresses and termination remark are sanitized (single quotes replaced).
3. **Service list resolution:**
   - If `serviceList` is non-empty → use those services (e.g. PRM, OIM, SCRUM, RARS, CUA, CUA_NEW, WCS, MHERE, SLP).
   - Else if organization is in **DamSiteService** list:
     - **VEN** transMode → only OIM.
     - Else: SCRUM always; if approval = APP:
       - RR/JIO: RARS + MHere.
       - O2C: MHere + OIM when O2C site/sector/plant/department/trade match.
       - RR: CUA_NEW.
       - Site-specific matrix (RR/JIO/PMDPT/PMDPY) adds PRM, OIM, etc. via role masters.
       - RR without PRM/OIM → add OIM; JMD-SOLAR → add OIM.
4. **Execution:** `ExecutionService.executeServices(serviceList, request)` invokes each `GeneralService.executeService(request)` and aggregates `System` results into `Response`.
5. **Post-processing:** Response is pushed to **Redis** and **Better Place** is updated (if configured).

---

## Services & Integrations

Each integration implements `GeneralService`:

```java
System executeService(GeneralRequest request) throws JsonProcessingException, Exception;
```

| Service   | System   | Purpose |
|----------|----------|--------|
| PRMService | PRM     | Dealer/agent profile (PRM) |
| OIMService | OIM     | Identity/access (OIM); supports HIB/DEHIB |
| ScrumService | SCRUM | Scrum DB insert; height field single-quote escaping |
| RarsService | RARS   | RARS system |
| MHereService | MHERE | MHere profile; HIB/DEHIB support |
| CUAService | CUA    | CUA legacy |
| CUANewService | CUA_NEW | CUA new; HIB/DEHIB support |
| WCSService | WCS    | WCS system |
| SLPService | SLP    | SLP onboarding |

Supporting (non–GeneralService):

- **ConditionCheckService** – Builds service list and runs execution.
- **ExecutionService** – Runs list of GeneralService.
- **BetterPlaceService** – Sends result to Better Place.
- **RedisService** – Pushes request/response to Redis.
- **O2CFieldsMappingService** – O2C domain mapping (Kafka-driven in code).
- **AccessRequestLogAsyncService** – Logs HIB requests to `access_request_log`.

---

## Scheduling (HIB/DEHIB)

- **transMode** in `resource_Details` drives behavior: **HIB** = async (log + scheduler), **DEHIB** = sync (optional cleanup of pending HIB + direct API call).

### HIB

- Request is logged to `AccessRequestLogEntity` (status PENDING).
- No immediate downstream call; scheduler processes batches later.
- Configured via `scheduler_config` (system_name, trans_mode, org_id, scheduler_type, cron_expression, batch_size, etc.).

### DEHIB

- Pending HIB rows for same context can be removed; then downstream API is called synchronously.
- Response returned in the same request.

### Scheduler Keys (DynamicScheduler)

- `CUA_NEW-HIB-RR` → `CUASchedulerService.cuaAsyncSchedulerService`
- `MHERE-HIB-RR` → `MhereSchedulerService.mhereAsyncSchedulerService`
- `OIM-HIB-RR` → `OIMSchedulerService.oimAsyncSchedulerService`

Trigger: `POST /services/trigger` with `SchedulerConfigRequest` (systemName, transMode, schedulerType, orgId). Config is read from DB each run; only active configs execute.

See **HIB_DEHIB_Implementation.md** for payload examples and flow details.

---

## Data Model

### Main Entities

- **SchedularConfig** – Scheduler definition (system_name, trans_mode, org_id, cron_expression, batch_size, active, readtimeout, condition_check, etc.).
- **AccessRequestLogEntity** – Async HIB request log (system_name, emp_id, siteID, trans_id, org_id, trans_mode, request/response, status, retry).
- **ProcedureExecutionLog** – Procedure run log.
- **EmployeeLog** – Employee-level execution log.
- **ApplicationMasterEntity** – Config master (per target system: OIM, Scrum, O2C, Better Place, CUA, RARS, WCS, PRM, MHere, SLP, etc.).

### DTOs (summary)

- **GeneralRequest** – resource_Details, access_Details, topicName, clientTxnId, serviceList.
- **Response** – workerCode, activity, list of System.
- **SchedulerConfigRequest** – Mirrors SchedularConfig for API/trigger.
- **ResourceDetails** – Worker/site/org/address/salary/CTC/approval/transMode and many domain fields used by condition logic and services.

---

## Related Documentation

- **HIB_DEHIB_Implementation.md** – HIB/DEHIB validation, logging, scheduler integration, and example payloads.
- **SCRUM_SERVICE_UPDATES.md** – Scrum insert SQL and height field single-quote escaping.

---

## Build & Run

```bash
# Build
mvn clean install

# Run (uses profile from bootstrap.yml / env)
mvn spring-boot:run
```

Requires configured datasource (MySQL), optional MongoDB/Redis/Kafka, and optionally Spring Cloud Config server for full config.

---

*Generated for the CWMS Data Provision repository.*
