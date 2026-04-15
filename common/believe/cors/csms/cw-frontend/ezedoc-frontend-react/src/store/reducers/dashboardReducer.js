import * as actionTypes from "../actions/actionTypes";
import { updateObject } from "./utility";

const initialState = {
  error: null,
  message: null,
  loader: false,
  app: [],
  apps: [],
  tasks: [],
  total: 0,
  processKey: "",
  id: null,
  processCount: null,
  quickActionsLoader: false,
  processCountLoader: false,
  groupTaskTotal: 0,
  taskFilterData: "",
  success: false,
};

const dashboardStart = (state) => {
  return updateObject(state, {
    loader: true,
  });
};

const dashboardCountFilter = (state, action) => {
  return updateObject(state, {
    loader: false,
    processCount: action.processCount,
    id: action.id,
    processKey: action.processKey,
    filterOptions: action.filterOptions,
    selectedOption: action.selectedOption,
  });
};

const dashboardAppFilter = (state, action) => {
  return updateObject(state, {
    loader: false,
    app: action.app,
    id: action.id,
    processKey: action.processKey,
  });
};

const dashboardSuccess = (state, action) => {
  return updateObject(state, {
    error: null,
    loader: false,
    apps: action.apps,
    success: true,
    processCount: action.processesCount,
  });
};

const dashboardCountSuccess = (state, action) => {
  return updateObject(state, {
    error: null,
    loader: false,
    processCount: action.processesCount,
  });
};

const dashboardFail = (state) => {
  return updateObject(state, {
    processCount: { 
      withdrawn: null, 
      completed: null, 
      ongoing: null 
    },
    error: true,
    loader: false,
    apps: null
  });
};

const dashboardQuickStart = (state) => {
  return updateObject(state, {
    quickActionsLoader: true,
  });
};

const dashboardQuickActions = (state, action) => {
  return updateObject(state, {
    tasks: action.tasks,
    total: action.total,
    quickActionsLoader: false,
    groupTaskTotal: action.groupTaskTotal,
  });
};

const dashboardQuickActionsFail = (state) => {
  return updateObject(state, {
    quickActionsLoader: false,
    error: true,
    loader: false,
  });
};

const dashboardProcessCountLoaderState = (state, action) => {
  return updateObject(state, {
    processCountLoader: action.processCountLoader,
  });
};

const taskPageFilterSuccess = (state, action) => {
  return updateObject(state, {
    loader: false,
    taskFilterData: action.taskFilterData,
  });
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.DASHBOARD_START:
      return dashboardStart(state, action);
    case actionTypes.DASHBOARD_SUCCESS:
      return dashboardSuccess(state, action);
    case actionTypes.DASHBOARD_COUNT_SUCCESS:
      return dashboardCountSuccess(state, action);
    case actionTypes.DASHBOARD_ERROR:
      return dashboardFail(state, action);
    case actionTypes.DASHBOARD_FILTER:
      return dashboardCountFilter(state, action);
    case actionTypes.DASHBOARD_APP_FILTER:
      return dashboardAppFilter(state, action);
    case actionTypes.QUICK_ACTIONS_START:
      return dashboardQuickStart(state, action);
    case actionTypes.QUICK_ACTIONS:
      return dashboardQuickActions(state, action);
    case actionTypes.QUICK_ACTIONS_FAIL:
      return dashboardQuickActionsFail(state, action);
    case actionTypes.DASHBOARD_PROCESS_COUNT_LOADER_STATE:
      return dashboardProcessCountLoaderState(state, action);
    case actionTypes.TASK_FILTER_SUCCESS:
      return taskPageFilterSuccess(state, action);
    default:
      return state;
  }
};

export default reducer;
