# CWMS Data Provision – Project Overview

> **For new team members:** This document gives you a quick understanding of the CWMS Data Provision service, its role in the CWMS ecosystem, and where to look next.

---

## What is CWMS Data Provision?

**CWMS Data Provision** is a Spring Boot microservice that **provisions resource/employee data** to multiple downstream systems when someone is onboarded, modified, terminated, or put in hibernation/de-hibernation. It:

- **Consumes** provisioning requests (e.g. from **Kafka**) with resource details (worker code, organization, site, trans mode, approval status, addresses, salary fields, etc.).
- **Decides** which downstream systems to call based on **organization**, **site**, **transaction mode**, **approval status**, and **role-master matrix** (Jio, O2C, Reliance Retails).
- **Executes** each integration (PRM, OIM, Scrum, RARS, MHere, CUA, CUA_NEW, WCS, SLP) and aggregates results.
- **Pushes** the response to **Redis** and updates **Better Place**.
- **Supports** async flows via **schedulers** (e.g. HIB – hibernation) and sync flows (e.g. DEHIB, ADD, MOD, TER).

In short, it is the **provisioning orchestration layer** that routes one request to many downstream systems (HR, identity, dealer/agent, etc.) and keeps Redis and Better Place in sync.

---

## Tech Stack

| Area | Technology |
|------|-------------|
| **Runtime** | Java 17 |
| **Framework** | Spring Boot 3.1.2 |
| **API** | REST (Spring Web) |
| **Data** | Spring Data JPA, MySQL, MongoDB, Redis |
| **Messaging** | Apache Kafka (spring-kafka) |
| **Config** | Spring Cloud Config (bootstrap profiles: sit, etc.) |
| **Security/Secrets** | Jasypt |
| **Other** | Lombok, Jackson (JSON/XML), Gson, cron-utils, internal `cwms_message` library, SOAP (SAAJ) for some integrations |

---

## Project Structure (High Level)

```
cwms_dataprovision/
├── src/main/java/com/jio/cwms_dataprovision/
│   ├── CwmsDataprovisionApplication.java   # Entry point, RestTemplate bean
│   ├── config/                              # ApplicationConfig, JDBC templates (Scrum)
│   ├── constants/                           # CwmsConstants, ServiceDataEnum, AppStatus, OIMActionEnum, etc.
│   ├── controller/
│   │   └── cwmsController.java             # Kafka listener, REST: refreshProperties, trigger
│   ├── dto/                                 # GeneralRequest, Response, ResourceDetails, SchedulerConfigRequest, system-specific (oim, mHere, prm, slp, rars, bp)
│   ├── entity/                              # SchedularConfig, AccessRequestLogEntity, ProcedureExecutionLog, EmployeeLog, GrcLog
│   ├── repository/                          # JPA repos, role masters (Jio, O2C, Reliance Retails)
│   ├── Scheduler/                           # DynamicScheduler, CUASchedulerService, MhereSchedulerService, OIMSchedulerService, SchedulerLoggerService
│   ├── service/
│   │   ├── ConditionCheckService.java       # Builds service list from org/site/approval/transMode, runs execution
│   │   ├── ExecutionService.java            # Runs list of GeneralService in parallel
│   │   ├── GeneralService (interface)        # executeService(GeneralRequest) → System
│   │   ├── PRMService, OIMService, ScrumService, RarsService, MHereService, CUAService, CUANewService, WCSService, SLPService
│   │   ├── BetterPlaceService, RedisService
│   │   ├── O2CFieldsMappingService          # O2C domain mapping (Kafka-driven)
│   │   └── AccessRequestLogAsyncService     # Logs HIB requests
│   └── wrapper/
│       └── LogWrapper.java
├── src/main/resources/
│   ├── application.properties               # server.port=9091, etc.
│   └── bootstrap.yml                        # spring.profiles.active
├── CWMS_Dataprovision_README.md              # Detailed README (flows, APIs, scheduling, data model)
├── HIB_DEHIB_Implementation.md              # HIB/DEHIB flow details (if present)
└── pom.xml
```

---

## Downstream Systems (Provisions To)

Each integration implements **GeneralService**. The list is built by **ConditionCheckService** from request data:

| Service | System | Typical Purpose |
|---------|--------|-----------------|
| **ScrumService** | SCRUM | Scrum DB (resource data) |
| **OIMService** | OIM | Identity/access (OIM); HIB/DEHIB |
| **RarsService** | RARS | RARS system |
| **MHereService** | MHERE | MHere profile; HIB/DEHIB |
| **PRMService** | PRM | Dealer/agent profile (PRM) |
| **CUAService** / **CUANewService** | CUA / CUA_NEW | CUA legacy and new; HIB/DEHIB for CUA_NEW |
| **WCSService** | WCS | WCS system |
| **SLPService** | SLP | SLP onboarding |

Condition logic uses **site** (e.g. RR, JIO, PMDPT, PMDPY, JMD-SOLAR), **organization** (e.g. O2C, RR), **transMode** (ADD, MOD, TER, VEN, HIB, DEHIB), **approval_Status** (APP), and **role-master** matrices to decide which of these run.

---

## Main Entry Points

### Kafka (Primary)

- **Topic:** From config (e.g. `app.config.kafka.producer.topic-name`).
- **Consumer:** `cwmsController.listenGroupFoo(String message)`.
- **Flow:** Deserialize `GeneralRequest` → normalize `resource_Details` (decimal fields, address/remark sanitization) → `ConditionCheckService.conditionCheckForServices(request)` → push to Redis → update Better Place.

### REST (Base path `/services`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/services/refreshProperties` | Refresh in-memory config from DB. Body: `Auth`. |
| POST | `/services/trigger` | Trigger a scheduler run. Body: `SchedulerConfigRequest` (systemName, transMode, schedulerType, orgId). Loads `SchedularConfig` from DB; if active, calls `DynamicScheduler.reschedule(...)`. |

(An **execute** REST endpoint exists in code but is commented out; the main intake is Kafka.)

---

## Core Flow (Summary)

1. **Request in** (Kafka): `GeneralRequest` with `resource_Details`, optional `serviceList`.
2. **Normalize:** Salary/CTC-related string fields set to `"0.0"` if blank; addresses and termination remark sanitized.
3. **Resolve service list:**
   - If `serviceList` is provided → use those services (PRM, OIM, SCRUM, RARS, CUA, CUA_NEW, WCS, MHERE, SLP).
   - Else: if organization is in **DamSiteService** list:
     - **VEN** → only OIM.
     - Else: always SCRUM; if approval = APP, add RARS+MHere for JIO/RR, MHere+OIM for O2C when site/sector/plant/dept/trade match, CUA_NEW for RR, and site-specific services from role masters (RR/JIO/PMDPT/PMDPY). Special cases: RR without PRM/OIM → add OIM; JMD-SOLAR → add OIM.
4. **Execute:** `ExecutionService.executeServices(serviceList, request)` runs each `GeneralService.executeService(request)` in parallel and builds `Response` (workerCode, activity, list of System).
5. **Post-process:** Response pushed to **Redis**; **Better Place** updated.

---

## Configuration

- **Spring Cloud Config:** `bootstrap.yml` sets active profile (e.g. `sit`); config name and datasource from config server.
- **Port:** 9091 (in `application.properties`; overridable).
- **Kafka:** Topic and group IDs from config (e.g. group `data_provision`).
- **Jasypt:** Used for encrypted properties.

---

## Getting Started

### Prerequisites

- Java 17, Maven
- MySQL (and optionally MongoDB, Redis, Kafka) as per config
- Access to Spring Cloud Config server if used

### Build

```bash
mvn clean install
```

### Run

```bash
mvn spring-boot:run
```

(Uses profile from `bootstrap.yml` or `--spring.profiles.active=...`.)

---

## Key Classes to Read First

| Class | Purpose |
|-------|---------|
| **CwmsDataprovisionApplication** | Entry point, RestTemplate bean |
| **cwmsController** | Kafka listener, refreshProperties, trigger |
| **ConditionCheckService** | Builds service list from org/site/approval/transMode/role matrix; calls ExecutionService |
| **ExecutionService** | Runs list of GeneralService in parallel |
| **GeneralService** (interface) | Contract for each downstream integration |
| **ScrumService** / **OIMService** / **MHereService** (examples) | How one system is called and returns System |
| **ServiceDataEnum** | PRM, OIM, SCRUM, RARS, CUA, CUA_NEW, WCS, GRC, MHERE, SLP |
| **GeneralRequest**, **ResourceDetails**, **Response** | Main request/response shapes |
| **DynamicScheduler** | Scheduler trigger and routing (CUA_NEW, MHere, OIM HIB) |

---

## Related Documentation (in this repo)

- **CWMS_Dataprovision_README.md** – Detailed README: tech stack, project structure, configuration, API endpoints, core flows, services & integrations, scheduling (HIB/DEHIB), data model, build & run.
- **HIB_DEHIB_Implementation.md** – HIB/DEHIB validation, logging, scheduler integration, example payloads (if present).
- **SCRUM_SERVICE_UPDATES.md** – Scrum insert and height field escaping (if present).

---

## Related Projects (in workspace)

- **cwms_access** – Access layer; consumes from Kafka and pushes to access downstream (separate from provisioning).
- **cwms_datamigration** – Data migration (employee/docs by site); can trigger flows that eventually need provisioning.
- **cwms_onboard** – Onboarding; may produce or consume provisioning-related payloads.
- **cwms-reports-ui** / **cwms-reports-backend** – Reporting.
