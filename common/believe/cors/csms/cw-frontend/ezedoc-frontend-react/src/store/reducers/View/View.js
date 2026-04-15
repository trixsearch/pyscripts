import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    configDashboardList: [],
    total: 0,
    active: 1,
    renderPage: '',
    widgetData: [],
    processCountData: null,
    processCountLoader: true,
    chartError: false,
    size3: ITEMS_PER_PAGE,
    filters3: {},
    sorter3: 'name',
    activeSorter3: {},
    activeFilters3: [],

    total2: 0,
    loader: false,
    renderPage2: '',
    jobConfigList: [],
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'name',
    activeSorter: {},
    activeFilters: [],

    eventConfigList: [],
    size2: ITEMS_PER_PAGE,
    filters2: {},
    sorter2: 'name',
    activeSorter2: {},
    activeFilters2: [],
}

const processCountLoader = (state, action) => {
    return updateObject(state, {
        processCountLoader: action.loader,
        processCountData: null
    })
}

const getConfigDashboard = (state, action) => {
    return updateObject(state, {
        configDashboardList: action.dashboardList,
        total: action.total,
        active: action.page,
        loader:false,
        error: null,
        size3: action.size3,
        filters3: action.filters3,
        sorter3: action.sorter3,
        activeSorter3: action.activeSorter3,
        activeFilters3: action.activeFilters3
    })
}

const processCountSuccess = (state, action) => {
    return updateObject(state, {
        processCountData: action.data,
        processCountLoader: false
    })
}

const dashboardUpdate = (state, action) => {
    return updateObject(state, {
        configDashboardList: [...state.configDashboardList.map(list => {
            if (list.id === action.data.id)
                return action.data
            return list
        })]
    })
}

const dynamicChartSuccess = (state, action) => {
    let newWidgetData = { chartQuery: action.query, chartData: action.data }
    return updateObject(state, {
        widgetData: [...state.widgetData, newWidgetData]

    })
}

const unmountWidget = (state) => {
    return updateObject(state, {
        widgetData: []

    })
}

const dynamicChartFail = (state, action) => {
    return updateObject(state, {
        chartError: action.chartError

    })
}

const dashboardConfigDelete = (state, action) => {
    return updateObject(state, {
        renderPage: action.renderPage,
        configDashboardList: [...state.configDashboardList.filter(config => config.id !== action.id)]
    })
}

const deleteJobConfig = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage2: action.renderPage,
        jobConfigList: [...state.jobConfigList.filter(item => item.id !== action.id)],
    })
}

const deleteEventConfig = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage2: action.renderPage,
        eventConfigList: [...state.eventConfigList.filter(item => item.id !== action.id)],
    })
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.PROCESS_COUNT_LOADER: return processCountLoader(state, action);
        case actionTypes.CONFIG_DASHBOARD_VIEW: return getConfigDashboard(state, action);
        case actionTypes.CONFIG_DASHBOARD_UPDATE: return dashboardUpdate(state, action);
        case actionTypes.CONFIG_DASHBOARD_DELETE: return dashboardConfigDelete(state, action);
        case actionTypes.DYNAMIC_CHART_SUCCESS: return dynamicChartSuccess(state, action);
        case actionTypes.PROCESS_COUNT_SUCCESS: return processCountSuccess(state, action);
        case actionTypes.UNMOUNT_WIDGET_DATA: return unmountWidget(state, action);
        case actionTypes.DYNAMIC_CHART_FAIL: return dynamicChartFail(state, action);
        case actionTypes.GET_JOB_CONFIG:
        case actionTypes.GET_EVENT_CONFIG:
        case actionTypes.JOB_EVENT_CONFIG_VIEW_LOADER:
            return updateObject(state, { ...action })
        case actionTypes.DELETE_JOB_CONFIG: return deleteJobConfig(state, action)
        case actionTypes.DELETE_EVENT_CONFIG: return deleteEventConfig(state, action)
        default:
            return state;
    }
};

export default reducer;