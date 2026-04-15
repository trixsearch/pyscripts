// TODO need to be refactor
/* eslint-disable  */
import { combineReducers } from "redux";
import * as actionTypes from "../actions/actionTypes";

import loginReducer from "./signIn/loginReducer";

import identifierreducer from "./signUp/identifierReducer";

import emailLink from "./signIn/emailLink";
import passwordSet from "./signIn/passwordSet";
import domainRegister from "./signUp/domainRegister";
import signUp from "./signUp/signUp";
import dashboard from "./dashboardReducer";
import appSection from "./Apps/AppSection";
import appSelected from "./Apps/AllAppSelected";

import formData from "./FormBuilder/FormBuilder";
import location from "./Config/Location/location";
import process from "./Process/Process";

import orgLogo from "./Orglogo/orglogo";

import users from "./Config/Users/users";
import groups from "./Config/Groups/groups";
import department from "./Config/Department/department";

import AllApps from "./Allapps/Allapps";
import Task from "./Task/task"
import Configure from "./Configure/configure"
import Smtp from './Config/Smtp/smtp';
import Portal from "./Portal/portal"
import Content from "./Portal/content"
import Chart from "./Chart/Chart";
import Report from "./Report/Report"
import Profile from "./Profile/Profile"
import AccessMgmt from "./AccessMgmt/accessMgmt"

import Asset from "./Inventory/Asset/Asset"
import Supply from "./Inventory/Supply/Supply"
import Supplier from "./Inventory/Supplier/Supplier"
import Stock from "./Inventory/Stock/Stock"
import StockAdjust from "./Inventory/StockAdjust/StockAdjust"
import Distribution from "./Inventory/Distribution/Distribution"
import KitReducer from './Inventory/Kit/Kit'
import Master from './MasterDB/masterDB';
import CustomData from './Config/CustomData/CustomData';
import AdvancedList from './Config/AdvList/AdvList';

import toasts from '../../components/Toast/reducer';
import WebsocketReducer from './Websocket/WebsocketReducer';

import EntityReducer from "./Entity/EntityReducer";

import ViewReducer from "./View/View"
import BgvReducer from "./bgv/bgv";

import HiringReducer from './Hiring/Hiring'
import JobReducer from './Hiring/Jobs'
import JobViewReducer from './Hiring/JobView'
import HiringEventReducer from './Hiring/HiringEvent'
import HiringPartnerReducer from './Hiring/HiringPartner'
import HeadCountPlanReducer from './Hiring/HeadCountPlan'
import JobRoleReducer from './Hiring/JobRole'
import JobPortalReducer from './Hiring/JobPortal'
import tagReducer from './../../platform-ui-containers-submodule/TagSearch/Store/reducer';
import tagTraverseReducer from './../../platform-ui-containers-submodule/TagSearch/TagTraverse/Store/reducer'

const rootReducer = combineReducers({
  auth: loginReducer,
  domain: identifierreducer,
  emailReq: emailLink,
  password: passwordSet,
  domainReg: domainRegister,
  signup: signUp,
  dashboard: dashboard,
  appSection: appSection,
  allapps: AllApps,
  chart : Chart,
  appSelected: appSelected,
  users: users,
  groups: groups,
  department: department,
  formData: formData,
  location: location,
  process: process,
  orgLogo: orgLogo,
  task: Task,
  configure:Configure,
  Smtp,
  portal :Portal,
  content:Content,
  report:Report,
  profile: Profile,
  asset: Asset,
  supply: Supply,
  supplier: Supplier,
  stock: Stock,
  stockAdjust: StockAdjust,
  distribution: Distribution,
  kit: KitReducer,
  master: Master,
  customData: CustomData,
  advancedList: AdvancedList,
  toasts,
  websocket: WebsocketReducer,
  entity: EntityReducer,
  view : ViewReducer,
  bgv: BgvReducer,
  hiring: HiringReducer,
  job: JobReducer,
  jobView: JobViewReducer,
  headcountplan: HeadCountPlanReducer,
  hiringEvent: HiringEventReducer,
  hiringPartner: HiringPartnerReducer,
  jobRole: JobRoleReducer,
  jobPortal: JobPortalReducer,
  tagSearch: tagReducer,
  tagTraverse: tagTraverseReducer,
  accessMgmt: AccessMgmt
});

const appReducer = (state, action) => {
  if (action.type === actionTypes.AUTH_LOGOUT) {
    // TODO need to be refactor
    /* eslint-disable  */
    state = {orgLogo : {...state.orgLogo}};
  /* eslint-enable  */
  }

  return rootReducer(state, action);
};

export default appReducer;