import React from "react";

const StartForm = React.lazy(() => import("./containers/StartForm/StartForm"));
const LoginPage = React.lazy(() => import("./containers/Login/LoginPage"));
const Register = React.lazy(() => import("./containers/Register/Register"));
const EmailRequest = React.lazy(() => import("./containers/Login/EmailRequest"));
const setPassword = React.lazy(() => import("./containers/Login/setPassword"));
const Dashboard = React.lazy(() => import("./containers/Dashboard/Dashboard"));
// const Users = React.lazy(() => import("./containers/Config/Users/UsersList/UsersList"));
// const UserCreate = React.lazy(() => import("./containers/Config/Users/User"));
// const UserEdit = React.lazy(() => import("./containers/Config/Users/User"));
// const LocationList = React.lazy(() => import("./containers/Config/Location/LocationList/LocationList"));
const LocationCreateEdit = React.lazy(() => import("./containers/Config/Location/LocationCreateEdit"));
const Formbuilder = React.lazy(() => import("./containers/FormBuilder/FormbuilderCreate"));
const FormBuilderEdit = React.lazy(() => import("./containers/FormBuilder/FormBuilderEdit"));
const FormBuilderPreview = React.lazy(() => import("./containers/FormBuilder/FormBuilderPreview"));
const GroupList = React.lazy(() => import("./containers/Config/Groups/GroupList/GroupList"));
const GroupCreateEdit = React.lazy(() => import("./containers/Config/Groups/GroupCreateEdit"));
const DepartmentList = React.lazy(() => import("./containers/Config/Department/DepartmentList/DepartmentList"));
const DepartmentCreateEdit = React.lazy(() => import("./containers/Config/Department/DepartmentCreateEdit"));
const Process = React.lazy(() => import("./containers/Process/Process"));
const Tasks = React.lazy(() => import("./containers/Tasks"));
const Entity = React.lazy(() => import('./containers/Entity'))
const Drishti = React.lazy(() => import('./containers/Drishti'))
const TaskVerification = React.lazy(() => import("./containers/Tasks/taskAction"));
// const SmtpCreate = React.lazy(() => import("./containers/Config/SMTP/Smtp"));
const Portals = React.lazy(() => import("./containers/Portals/portals"));
const Contents = React.lazy(() => import("./containers/Portals/content"));
const ContentCreateEdit = React.lazy(() => import("./containers/Portals/ContentCreateEdit"));
// const Theme = React.lazy(() => import("./containers/Config/theme/theme"));
const UserProfile = React.lazy(() => import("./containers/Dashboard/userProfile/userProfile"));
const ManageAccount = React.lazy(() => import("./containers/Dashboard/userProfile/ManageAccount"));
// const ConfigView = React.lazy(() => import("./containers/Config/View/ConfigView"));
const Report = React.lazy(() => import("./containers/Report/ReportsList"));
const ReportCreateEdit = React.lazy(() => import("./containers/Report/ReportForm"));
// const Master = React.lazy(() => import("./containers/Master"));
const CustomData = React.lazy(() => import("./containers/Config/CustomData"));
const CustomDataEdit = React.lazy(() => import("./containers/Config/CustomData/CustomDataEdit"));
const CustomDataCreate = React.lazy(() => import("./containers/Config/CustomData/CustomDataCreate"));
const ImportHistory = React.lazy(() => import("./components/UI/ImportHistory/ImportHistory"));
const EntityList = React.lazy(() => import("./containers/Entities/List/EntityList"));
const EntityView = React.lazy(() => import("./containers/Entities/View/EntityView"));
const AdvList = React.lazy(() => import("./containers/AdvList/ListView/AdvancedList"));
const AdvListDetail = React.lazy(() => import("./containers/AdvList/DetailView/Wrapper"));

const StockList = React.lazy(() => import("./containers/Inventory/Stock/StockList/StockList"));
const StockAdjust = React.lazy(() => import("./containers/Inventory/Stock/AdjustStock/AdjustStock"));
const StockAdjustList = React.lazy(() => import("./containers/Inventory/StockAdjustment/StockAdjustList"));
const DistributionList = React.lazy(() => import("./containers/Inventory/Distribution/DistributionList/Distributions"));
const DistributionCreate = React.lazy(() => import(
  "./containers/Inventory/Distribution/DistributionCreate/DistributionCreate"
));
const DistributionTransferList = React.lazy(() => import(
  "./containers/Inventory/Distribution/DistributionList/DistributionTransfers"
));
const DistributionOthersList = React.lazy(() => import(
  "./containers/Inventory/Distribution/DistributionList/DistributionOthers"
));
const AssetList = React.lazy(() => import("./containers/Inventory/Asset/AssetList/AssetsList"));
const KitList = React.lazy(() => import("./containers/Inventory/Kit/KitsList/KitList"));
const KitCreateOrEdit = React.lazy(() => import("./containers/Inventory/Kit/KitCreateEdit/KitCreateEdit"));
const AssetCreateOrEdit = React.lazy(() => import("./containers/Inventory/Asset/AssetCreateOrEdit/AssetCreateOrEdit"));
const SupplierList = React.lazy(() => import("./containers/Inventory/Supplier/SupplierList/SuppliersList"));
const SupplierCreateOrEdit = React.lazy(() => import(
  "./containers/Inventory/Supplier/SupplierCreateOrEdit/SupplierCreateOrEdit"
));
const SupplyList = React.lazy(() => import("./containers/Inventory/Supply/SupplyList/Supplies"));
const SupplyCreateOrEdit = React.lazy(() => import("./containers/Inventory/Supply/SupplyCreateOrEdit/SupplyCreateOrEdit"));
const ScheduleReport = React.lazy(() => import("./containers/Report/SchedulerModal/Schedular"));
const CustomRole = React.lazy(() => import("./containers/Config/CustomRole/CustomRole"));
const DashboardCreateOrEdit = React.lazy(() => import("./containers/Config/View/DashboardConfig/DashboardCreateOrEdit"));
const BGV = React.lazy(() => import("./containers/Bgv"));
// const BGVDETAIL = React.lazy(() => import('containers/Bgv/BgvDetail'))
const EzeDigiLocker = React.lazy(() => import("./containers/DigiLocker/EzeDigiLocker"));

const Hiring = React.lazy(() => import("./containers/Hiring/Hiring"));
const JobList = React.lazy(() => import("./containers/Hiring/Jobs/JobList"));
const JobView = React.lazy(() => import("./containers/Hiring/Jobs/JobView"));
const HeadCount = React.lazy(() => import("./containers/Hiring/Headcount/HeadCount"));
const HeadCountPlan = React.lazy(() => import("./containers/Hiring/Headcount/HeadCountPlanning"));
const Requisition = React.lazy(() => import("./containers/Hiring/Headcount/Requisition"));
const HiringEventList = React.lazy(() => import("./containers/Hiring/HiringEvent/HiringEventList"));
const CreateEditHiringEvent = React.lazy(() => import("./containers/Hiring/HiringEvent/CreateEditHiringEvent"));
const HiringPartnerList = React.lazy(() => import("./containers/Hiring/HiringPartner/HiringPartnerList"));
const CreateEditHiringPartner = React.lazy(() => import("./containers/Hiring/HiringPartner/CreateEditHiringPartner"));
const JobRoleList = React.lazy(() => import("./containers/Hiring/JobRole/JobRoleList"));
const CreateEditJobRole = React.lazy(() => import("./containers/Hiring/JobRole/JobRoleCreateEdit"));
const JobPortalList = React.lazy(() => import("./containers/Hiring/JobPortal/JobPortal"));
const JobPortalView = React.lazy(() => import("./containers/Hiring/JobPortal/JobPortalView"));
const JobEventChartConfigCreateEdit = React.lazy(() => import(
  "./containers/Config/View/JobEventChartConfig/JobEventChartConfigCreateEdit"
));
const Signature = React.lazy(() => import("./containers/Config/Signature/index"));
const Applicants = React.lazy(() => import("./containers/Hiring/Jobs/Applicants"));
const Slots = React.lazy(() => import("./containers/Hiring/Jobs/Slots"));

const APP_URL = process.env.REACT_APP_APP_URL;

const basePath = "/custom-workflow/org/:uuid";
const toBaseUrl = "/custom-workflow/org";

const routes = {
  LOGIN: {
    to: (orgId) => `${toBaseUrl}/${orgId}/login`,
    path: `${basePath}/login`,
    component: LoginPage,
  },
  REGISTER: {
    to: (orgId) => `${toBaseUrl}/${orgId}/register`,
    path: `${basePath}/`,
    component: Register,
  },
  SET_PASSWORD: {
    to: (orgId, id, token) => `${toBaseUrl}/${orgId}/users/org_users/reset_password/${id}/${token}`,
    path: `${basePath}/users/org_users/reset_password/:id/:token`,
    api: (orgId, uidb64, token) => `${APP_URL}/${orgId}/users/org_users/reset_password/${uidb64}/${token}`,
    component: setPassword,
  },
  EMAIL_REQUEST: {
    to: (orgId) => `${toBaseUrl}/${orgId}/getpassword`,
    path: `${basePath}/getpassword`,
    component: EmailRequest,
  },
  DIGILOCKER: {
    path: `${basePath}/dl`,
    component: EzeDigiLocker,
  },
  DASHBOARD: {
    to: (orgId) => `${toBaseUrl}/${orgId}/dashboard`,
    path: `${basePath}/dashboard`,
    component: Dashboard,
  },
  FORM_PREVIEW: {
    to: (orgId) => `${toBaseUrl}/${orgId}/formbuilder/`,
    path: `${basePath}/formbuilder/preview`,
    component: FormBuilderPreview,
  },
  FORM_BUILDER: {
    to: (orgId) => `${toBaseUrl}/${orgId}/formbuilder/`,
    path: `${basePath}/formbuilder/create/:id`,
    component: Formbuilder,
  },
  FORM_EDIT: {
    to: (orgId) => `${toBaseUrl}/${orgId}/formbuilder/`,
    path: `${basePath}/formbuilder/edit`,
    component: FormBuilderEdit,
  },
  // USERS: {
  //   to: (orgId) => `${toBaseUrl}/${orgId}/config/users`,
  //   path: `${basePath}/config/users`,
  //   component: Users,
  // },
  // USER_CREATE: {
  //   to: (orgId, page) => `${toBaseUrl}/${orgId}/config/users/create?next=${page}`,
  //   path: `${basePath}/config/users/create`,
  //   component: UserCreate,
  // },
  // USER_EDIT: {
  //   to: (orgId, id, page) => `${toBaseUrl}/${orgId}/config/users/edit/${id}?next=${page}`,
  //   path: `${basePath}/config/users/edit/:id`,
  //   component: UserEdit,
  // },
  // LOCATION_LIST: {
  //   to: (orgId) => `${toBaseUrl}/${orgId}/config/location`,
  //   path: `${basePath}/config/location`,
  //   component: LocationList,
  // },
  LOCATION_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/config/location/create?next=${page}`,
    path: `${basePath}/config/location/create`,
    component: LocationCreateEdit,
  },
  LOCATION_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/config/location/edit/${id}?next=${page}`,
    path: `${basePath}/config/location/edit/:id`,
    component: LocationCreateEdit,
  },
  GROUP_LIST: {
    to: (orgId) => `${toBaseUrl}/${orgId}/config/groups`,
    path: `${basePath}/config/groups`,
    component: GroupList,
  },
  // GROUP_CREATE: {
  //   to: (orgId, page) => `${toBaseUrl}/${orgId}/config/groups/create?next=${page}`,
  //   path: `${basePath}/config/groups/create`,
  //   component: GroupCreateEdit,
  // },
  GROUP_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/config/groups/edit/${id}?next=${page}`,
    path: `${basePath}/config/groups/edit/:id`,
    component: GroupCreateEdit,
  },
  DEPARTMENT_LIST: {
    to: (orgId) => `${toBaseUrl}/${orgId}/config/department`,
    path: `${basePath}/config/department`,
    component: DepartmentList,
  },
  DEPARTMENT_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/config/department/create?next=${page}`,
    path: `${basePath}/config/department/create`,
    component: DepartmentCreateEdit,
  },
  DEPARTMENT_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/config/department/edit/${id}?next=${page}`,
    path: `${basePath}/config/department/edit/:id`,
    component: DepartmentCreateEdit,
  },
  PROCESS: {
    to: (orgId) => `${toBaseUrl}/${orgId}/process`,
    path: `${basePath}/process`,
    component: Process,
  },
  ENTITY: {
    to: (orgId) => `${toBaseUrl}/${orgId}/entity`,
    path: `${basePath}/entity`,
    component: Entity,
  },
  DRISHTI: {
    to: (orgId) => `${toBaseUrl}/${orgId}/drishti`,
    path: `${basePath}/drishti`,
    component: Drishti,
  },
  TASKS: {
    to: (orgId) => `${toBaseUrl}/${orgId}/tasks`,
    path: `${basePath}/tasks`,
    component: Tasks,
  },
  TASK_DETAILS: {
    to: (orgId) => `${toBaseUrl}/${orgId}`,
    path: `${basePath}/tasks/:id`,
    component: TaskVerification,
  },
  // SMTP_CREATE: {
  //   to: (orgId) => `${toBaseUrl}/${orgId}/config/smtp`,
  //   path: `${basePath}/config/smtp`,
  //   component: SmtpCreate,
  // },
  PORTALS: {
    to: (orgId) => `${toBaseUrl}/${orgId}`,
    path: `${basePath}/config/portals`,
    component: Portals,
  },
  CONTENTS: {
    to: (orgId) => `${toBaseUrl}/${orgId}`,
    path: `${basePath}/config/contents`,
    component: Contents,
  },
  CONTENTS_ID: {
    to: (orgId) => `${toBaseUrl}/${orgId}`,
    path: `${basePath}/content/edit/:id`,
    component: ContentCreateEdit,
  },
  // THEMES: {
  //   to: (orgId) => `${toBaseUrl}/${orgId}/config/themes`,
  //   path: `${basePath}/config/themes`,
  //   component: Theme,
  // },
  PROFILE: {
    to: (orgId) => `${toBaseUrl}/${orgId}/profile`,
    path: `${basePath}/profile`,
    component: UserProfile,
  },
  MANAGEACCOUNT: {
    to: (orgId) => `${toBaseUrl}/${orgId}/manage-account`,
    path: `${basePath}/manage-account`,
    component: ManageAccount,
  },
  PORTAL_CREATE: {
    to: (orgId) => `${toBaseUrl}/${orgId}/config/contents/create`,
    path: `${basePath}/config/contents/create`,
    component: ContentCreateEdit,
  },
  // CONFIG_VIEW: {
  //   to: (orgId) => `${toBaseUrl}/${orgId}/config/view`,
  //   path: `${basePath}/config/view`,
  //   component: ConfigView,
  // },
  REPORT: {
    to: (orgId) => `${toBaseUrl}/${orgId}/reports`,
    path: `${basePath}/reports`,
    component: Report,
  },
  REPORT_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/reports/create?next=${page}`,
    path: `${basePath}/reports/create`,
    component: ReportCreateEdit,
  },
  REPORT_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/reports/edit/${id}?next=${page}`,
    path: `${basePath}/reports/edit/:id`,
    component: ReportCreateEdit,
  },
  REPORT_SCHEDULE: {
    to: (orgId, reportId) => `${toBaseUrl}/${orgId}/reports/${reportId}/scheduler`,
    path: `${basePath}/reports/:id/scheduler`,
    component: ScheduleReport,
  },
  STOCK_LIST: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/stock?page=${page}`,
    path: `${basePath}/inventory/stock`,
    component: StockList,
  },
  STOCK_ADJUST: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/inventory/stock/adjust/${id}?next=${page}`,
    path: `${basePath}/inventory/stock/adjust/:id`,
    component: StockAdjust,
  },
  STOCK_ADJUST_LIST: {
    to: (orgId, page = 1) => `${toBaseUrl}/${orgId}/inventory/stock/adjustments?page=${page}`,
    path: `${basePath}/inventory/stock/adjustments`,
    component: StockAdjustList,
  },
  ASSET_LIST: {
    to: (orgId) => `${toBaseUrl}/${orgId}/inventory/asset`,
    path: `${basePath}/inventory/asset`,
    component: AssetList,
  },
  ASSET_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/asset/create?next=${page}`,
    path: `${basePath}/inventory/asset/create`,
    component: AssetCreateOrEdit,
  },
  ASSET_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/inventory/asset/edit/${id}?next=${page}`,
    path: `${basePath}/inventory/asset/edit/:id`,
    component: AssetCreateOrEdit,
  },
  KIT_LIST: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/kit?page=${page}`,
    path: `${basePath}/inventory/kit`,
    component: KitList,
  },
  KIT_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/kit/create?next=${page}`,
    path: `${basePath}/inventory/kit/create`,
    component: KitCreateOrEdit,
  },
  KIT_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/inventory/kit/edit/${id}?next=${page}`,
    path: `${basePath}/inventory/kit/edit/:id`,
    component: KitCreateOrEdit,
  },
  DISTRIBUTION_LIST: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/distribution?page=${page}`,
    path: `${basePath}/inventory/distribution`,
    component: DistributionList,
  },
  DISTRIBUTION_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/distribution/create?next=${page}`,
    path: `${basePath}/inventory/distribution/create`,
    component: DistributionCreate,
  },
  DISTRIBUTION_INTER_TRANSFER_LIST: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/distribution/inter?page=${page}`,
    path: `${basePath}/inventory/distribution/inter`,
    component: DistributionTransferList,
  },
  DISTRIBUTION_OTHER_TRANSFER_LIST: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/distribution/others?page=${page}`,
    path: `${basePath}/inventory/distribution/others`,
    component: DistributionOthersList,
  },
  DISTRIBUTION_INTER_TRANSFER_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/distribution/inter/create?next=${page}`,
    path: `${basePath}/inventory/distribution/inter/create`,
    component: DistributionCreate,
  },
  SUPPLIER_LIST: {
    to: (orgId) => `${toBaseUrl}/${orgId}/inventory/supplier`,
    path: `${basePath}/inventory/supplier`,
    component: SupplierList,
  },
  SUPPLIER_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/supplier/create?next=${page}`,
    path: `${basePath}/inventory/supplier/create`,
    component: SupplierCreateOrEdit,
  },
  SUPPLIER_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/inventory/supplier/edit/${id}?next=${page}`,
    path: `${basePath}/inventory/supplier/edit/:id`,
    component: SupplierCreateOrEdit,
  },
  SUPPLY_LIST: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/supply?page=${page}`,
    path: `${basePath}/inventory/supply`,
    component: SupplyList,
  },
  SUPPLY_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/inventory/supply/create?next=${page}`,
    path: `${basePath}/inventory/supply/create`,
    component: SupplyCreateOrEdit,
  },
  SUPPLY_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/inventory/supply/edit/${id}?next=${page}`,
    path: `${basePath}/inventory/supply/edit/:id`,
    component: SupplyCreateOrEdit,
  },
  // MASTER: {
  //   to: (orgId) => `${toBaseUrl}/${orgId}/master`,
  //   path: `${basePath}/master`,
  //   component: Master,
  // },
  CUSTOM_DATA: {
    to: (orgId) => `${toBaseUrl}/${orgId}/config/lists`,
    path: `${basePath}/config/lists`,
    component: CustomData,
  },
  CUSTOM_DATA_EDIT: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/config/lists/edit/${id}?next=${page}`,
    path: `${basePath}/config/lists/edit/:id`,
    component: CustomDataEdit,
  },
  CUSTOM_DATA_CREATE: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/config/lists/create?next=${page}`,
    path: `${basePath}/config/lists/create`,
    component: CustomDataCreate,
  },
  ADVANCED_LIST: {
    to: (orgId) => `${toBaseUrl}/${orgId}/config/lists/advanced`,
    path: `${basePath}/config/lists/advanced`,
    component: AdvList,
  },
  ADVANCED_LIST_DETAIL: {
    to: (orgId, id) => `${toBaseUrl}/${orgId}/config/lists/advanced/edit/${id}`,
    path: `${basePath}/config/lists/advanced/edit/:id`,
    component: AdvListDetail,
  },
  LOCATION_HISTORY: {
    to: (orgId) => `${toBaseUrl}/${orgId}/config/location/import-history`,
    path: `${basePath}/config/location/import-history`,
    component: ImportHistory,
    entity: "location",
    breadCrumb: {
      list: [
        {
          name: "Locations",
          path: `${basePath}/location`,
        },
      ],
    },
  },
  // USER_HISTORY: {
  //   to: (orgId) => `${toBaseUrl}/${orgId}/config/users/import-history`,
  //   path: `${basePath}/config/users/import-history`,
  //   component: ImportHistory,
  //   entity: "user",
  //   breadCrumb: {
  //     list: [
  //       {
  //         name: "Users",
  //         path: `${basePath}/users`,
  //       },
  //     ],
  //   },
  // },
  GROUP_HISTORY: {
    to: (orgId) => `${toBaseUrl}/${orgId}/config/groups/import-history`,
    path: `${basePath}/config/groups/import-history`,
    component: ImportHistory,
    entity: "groups",
    breadCrumb: {
      list: [
        {
          name: "Groups",
          path: `${basePath}/groups`,
        },
      ],
    },
  },
  BULK_INITIATE_HISTORY: {
    to: (orgId) => `${toBaseUrl}/${orgId}/process/import-history`,
    path: `${basePath}/process/import-history`,
    component: ImportHistory,
    entity: "bulk_initiate_process",
    breadCrumb: {
      list: [
        {
          name: "Processes",
          path: `${basePath}/process`,
        },
      ],
    },
  },
  ENTITY_LIST: {
    to: (orgId) => `${toBaseUrl}/${orgId}/entity`,
    path: `${basePath}/entity/:id`,
    component: EntityList,
  },
  ENTITY_DETAILS: {
    to: (orgId, entityModelId, entityViewId, entityId) => `${toBaseUrl}/${orgId}/entity/${entityModelId}/${entityViewId}/edit/${entityId}`,
    jobTo: (
      orgId,
      entityModelId,
      entityViewId,
      entityId,
      jobId,
      eventId,
      profileButton
    ) => `${toBaseUrl}/${orgId}/entity/${entityModelId}/${entityViewId}/edit/${entityId}?jobId=${jobId}&eventId=${eventId || ""
      }&profileButton=${profileButton}`,
    path: `${basePath}/entity/:entityModelId/:entityViewId/edit/:entityId`,
    component: EntityView,
  },
  POLICY_MANAGEMENT: {
    to: (orgId) => `${toBaseUrl}/${orgId}/config/policy-management`,
    path: `${basePath}/config/policy-management`,
    component: CustomRole,
  },
  CREATE_DASHBOARD: {
    to: (orgId, page) => `${toBaseUrl}/${orgId}/config/view/dashboard/add?next=${page}`,
    path: `${basePath}/config/view/dashboard/add`,
    component: DashboardCreateOrEdit,
  },
  EDIT_DASHBOARD: {
    to: (orgId, id, page) => `${toBaseUrl}/${orgId}/config/view/dashboard/edit/${id}?next=${page}`,
    path: `${basePath}/config/view/dashboard/edit/:id`,
    component: DashboardCreateOrEdit,
  },
  START_NEW_PROCESS: {
    to: (orgId, processId) => `${toBaseUrl}/${orgId}/job/start-new-process/${processId}`,
    path: `${basePath}/job/start-new-process/:processId`,
    component: StartForm,
  },
  START_NEW_EMBEDDED_PROCESS: {
    to: (orgId, processId) => `${toBaseUrl}/${orgId}/job/start-new-embedded-process/${processId}`,
    path: `${basePath}/job/start-new-embedded-process/:processId`,
    component: StartForm,
  },
  BGV: {
    path: `${basePath}/bgv`,
    component: BGV,
  },
  // BGVDETAIL: {
  //   path: `${basePath}/bgv/:id`,
  //   component: BGVDETAIL
  // },
  JOB_PORTAL_LIST: {
    to: (orgId, next = 1) => `${toBaseUrl}/${orgId}/jobs?page=${next}`,
    path: `${basePath}/jobs`,
    component: JobPortalList,
  },
  JOB_PORTAL_VIEW: {
    to: (orgId, id, page = 1) => `${toBaseUrl}/${orgId}/jobs/${id}?next=${page}`,
    path: `${basePath}/jobs/:id`,
    component: JobPortalView,
  },
  HIRING: {
    to: (orgId) => `${toBaseUrl}/${orgId}/hiring`,
    path: `${basePath}/hiring`,
    component: Hiring,
  },
  JOB_LIST: {
    to: (orgId, next = 1, extraQueryParamsString) => `${toBaseUrl}/${orgId}/job?page=${next}${extraQueryParamsString ?? ''}`,
    eventTo: (orgId, eventId, profileButton = "show", page = 1) => `${toBaseUrl}/${orgId}/job?eventId=${eventId}&profileButton=${profileButton}&next=${page}`,
    path: `${basePath}/job`,
    component: JobList,
  },
  JOB_VIEW: {
    to: (orgId, id, page = 1, vendorId) => `${toBaseUrl}/${orgId}/job/${id}?next=${page}${vendorId ? `&vendorId=${vendorId}` : ''}`,
    eventTo: (orgId, id, eventId, profileButton = "show", vendorId) => `${toBaseUrl}/${orgId}/job/${id}?eventId=${eventId}
    &profileButton=${profileButton}${vendorId ? `&vendorId=${vendorId}` : ''}`,
    path: `${basePath}/job/:id`,
    component: JobView,
  },
  APPLICANTS: {
    to: (orgId, id) => `${toBaseUrl}/${orgId}/job/${id}/applicants`,
    path: `${basePath}/job/:id/applicants`,
    component: Applicants,
  },
  SLOTS: {
    to: (orgId, id) => `${toBaseUrl}/${orgId}/job/${id}/slots`,
    path: `${basePath}/job/:id/slots`,
    component: Slots,
  },
  JOB_HISTORY: {
    to: (orgId) => `${toBaseUrl}/${orgId}/job/import-history`,
    path: `${basePath}/job/import-history`,
    api: (orgId) => `${APP_URL}/${orgId}/apps/hiring/bulk_initiate?entity=bulk_initiate_job`,
    component: ImportHistory,
    app_key: "hiring",
    entity: "bulk_initiate_job",
    breadCrumb: {
      list: [
        {
          name: "Jobs",
          path: `${basePath}/job`,
        },
      ],
    },
  },
  JOB_CANDIDATE_HISTORY: {
    to: (orgId) => `${toBaseUrl}/${orgId}/job/candidate/import-history`,
    path: `${basePath}/job/candidate/import-history`,
    api: (orgId) => `${APP_URL}/${orgId}/apps/hire_candidate/bulk_initiate?entity=bulk_initiate_process`,
    component: ImportHistory,
    app_key: "hire_candidate",
    entity: "bulk_initiate_process",
    breadCrumb: {
      list: [
        {
          name: "Job Profiles",
          path: `${basePath}/job`,
        },
      ],
    },
  },
  JOB_SLOT_HISTORY: {
    to: (orgId) => `${toBaseUrl}/${orgId}/job/slot/import-history`,
    path: `${basePath}/job/slot/import-history`,
    api: (orgId) => `${APP_URL}/${orgId}/apps/create_slot_app/bulk_initiate?entity=bulk_initiate_profile`,
    component: ImportHistory,
    app_key: "create_slot_app",
    entity: "bulk_initiate_profile",
    breadCrumb: {
      list: [
        {
          name: "Job Profiles",
          path: `${basePath}/job`,
        },
      ],
    },
  },
  HEAD_COUNT: {
    to: (orgId, next = 1) => `${toBaseUrl}/${orgId}/hiring/headcount?page=${next}`,
    path: `${basePath}/hiring/headcount`,
    component: HeadCount,
  },
  HEAD_COUNT_PLAN: {
    to: (orgId, page = 1) => `${toBaseUrl}/${orgId}/headcount/plan?next=${page}`,
    path: `${basePath}/headcount/plan`,
    component: HeadCountPlan,
  },
  REQUISITION: {
    to: (orgId, page = 1) => `${toBaseUrl}/${orgId}/headcount/requisition?next=${page}`,
    path: `${basePath}/headcount/requisition`,
    component: Requisition,
  },
  HIRING_EVENT_LIST: {
    to: (orgId, next = 1) => `${toBaseUrl}/${orgId}/event?page=${next}`,
    path: `${basePath}/event`,
    component: HiringEventList,
  },
  HIRING_EVENT_CREATE: {
    to: (orgId, page = 1) => `${toBaseUrl}/${orgId}/event/create?next=${page}`,
    path: `${basePath}/event/create`,
    component: CreateEditHiringEvent,
  },
  HIRING_EVENT_EDIT: {
    to: (orgId, id, page = 1) => `${toBaseUrl}/${orgId}/event/edit/${id}?next=${page}`,
    path: `${basePath}/event/edit/:id`,
    component: CreateEditHiringEvent,
  },
  HIRING_PARTNER_LIST: {
    to: (orgId, next = 1) => `${toBaseUrl}/${orgId}/partner?page=${next}`,
    path: `${basePath}/partner`,
    component: HiringPartnerList,
  },
  HIRING_PARTNER_CREATE: {
    to: (orgId, page = 1) => `${toBaseUrl}/${orgId}/partner/create?next=${page}`,
    path: `${basePath}/partner/create`,
    component: CreateEditHiringPartner,
  },
  HIRING_PARTNER_EDIT: {
    to: (orgId, id, page = 1) => `${toBaseUrl}/${orgId}/partner/edit/${id}?next=${page}`,
    path: `${basePath}/partner/edit/:id`,
    component: CreateEditHiringPartner,
  },
  JOB_ROLE_LIST: {
    to: (orgId, next = 1) => `${toBaseUrl}/${orgId}/config/jobrole?page=${next}`,
    path: `${basePath}/config/jobrole`,
    component: JobRoleList,
  },
  JOB_ROLE_CREATE: {
    to: (orgId, page = 1) => `${toBaseUrl}/${orgId}/config/jobrole/create?next=${page}`,
    path: `${basePath}/config/jobrole/create`,
    component: CreateEditJobRole,
  },
  JOB_ROLE_EDIT: {
    to: (orgId, id, page = 1) => `${toBaseUrl}/${orgId}/config/jobrole/edit/${id}?next=${page}`,
    path: `${basePath}/config/jobrole/edit/:id`,
    component: CreateEditJobRole,
  },
  ADD_JOB_CHART_CONFIG: {
    to: (orgId, pageType, page) => `${toBaseUrl}/${orgId}/view/job/add?next=${page}&pageType=${pageType}`,
    path: `${basePath}/view/job/add`,
    component: JobEventChartConfigCreateEdit,
  },
  EDIT_JOB_CHART_CONFIG: {
    to: (orgId, pageType, id, page) => `${toBaseUrl}/${orgId}/view/job/edit/${id}?next=${page}&pageType=${pageType}`,
    path: `${basePath}/view/job/edit/:id`,
    component: JobEventChartConfigCreateEdit,
  },
  ADD_EVENT_CHART_CONFIG: {
    to: (orgId, pageType, page) => `${toBaseUrl}/${orgId}/view/event/add?next=${page}&pageType=${pageType}`,
    path: `${basePath}/view/event/add`,
    component: JobEventChartConfigCreateEdit,
  },
  EDIT_EVENT_CHART_CONFIG: {
    to: (orgId, pageType, id, page) => `${toBaseUrl}/${orgId}/view/event/edit/${id}?next=${page}&pageType=${pageType}`,
    path: `${basePath}/view/event/edit/:id`,
    component: JobEventChartConfigCreateEdit,
  },
  SIGNATURE: {
    path: `${basePath}/config/signature`,
    component: Signature,
  },
};

export default routes;
