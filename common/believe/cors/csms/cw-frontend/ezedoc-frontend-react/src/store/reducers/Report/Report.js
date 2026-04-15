import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../actions/actionTypes";
import { updateObject } from "../utility";

const initialState = {
  success: false,
  message: null,
  loader: true,
  appsData: [],
  reports: null,
  total : 0,
  renderPage: '',
  active:1,
  size: ITEMS_PER_PAGE,
  filters: {},
  sorter: 'name',
  activeSorter: {},
  activeFilters: []
};

const reportStart = (state, action) => {
  return updateObject(state, {
    loader: action.loader
  });
};

const reportAppSuccess = (state, action) => {
  return updateObject(state, {
    appsData: action.data,
    loader: false
  });
};

const retrieveReports = (state, action) => {
  return updateObject(state, {
    reports: action.data,
    total :action.total,
    active:1,
    loader: false,
    error: null,
    size: action.size,
    filters: action.filters,
    sorter: action.sorter,
    activeSorter: action.activeSorter,
    activeFilters: action.activeFilters
  });
};

const reportFail = (state, action) => {
  return updateObject(state, {
    loader: false,
    error: action.error
  });
};
const retrieveReportsPagination = (state, action) => {
    return updateObject(state, {
      loader: false,
      reports :action.data,
      active :action.active,
      total: action.total
    });
};

const reportDelete = (state, action) => {
  return updateObject(state, {
    loader:false,
    renderPage: action.renderPage,
    reports: [...state.reports.filter(report => report.id !== action.id)]
  })
}

export default (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.REPORT_START:
      return reportStart(state, action);
    case actionTypes.REPORT_ERROR:
      return reportFail(state, action);
    case actionTypes.REPORT_APP_SUCCESS:
      return reportAppSuccess(state, action);
    case actionTypes.RETRIEVE_REPORTS:
      return retrieveReports(state, action);
    case actionTypes.RETRIEVE_REPORT_PAGINATION:
      return retrieveReportsPagination(state, action);
    case actionTypes.DELETE_REPORT:
      return reportDelete(state,action);

    default:
      return state;
  }
};
