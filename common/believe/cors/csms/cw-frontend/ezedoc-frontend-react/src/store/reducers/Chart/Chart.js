import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    chartContentLoader: true,
    success : null,
    message : null,
    loader : null,
    data : [],
    error: false
}

const dashboardChartStart = (state) => {
    return updateObject( state, { 
        loader:true,
    });
};

const dashboardChartSuccess = (state = initialState, action) => {
    return updateObject(state, { 
        success:action.data.success,
        chartContentLoader:false,
        loader:false,
        data: action.data,
        message:action.data.message
    });
};
const dashboardChartFilter = (state = initialState, action) => {
    return updateObject(state, { 
        success:action.data.success,
        chartContentLoader:false,
        loader:false,
        data: action.data,
        message:action.data.message
    });
}
const dashboardChartFail = (state, action) => {
    return updateObject( state, {
        success:action.error,
        chartContentLoader:false,
        loader:false,
        error: true
    });
};

const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.CHART_START: return dashboardChartStart(state, action);
        case actionTypes.CHART_SUCCESS: return dashboardChartSuccess(state, action);
        case actionTypes.CHART_FILTER: return dashboardChartFilter(state,action);
        case actionTypes.CHART_ERROR: return dashboardChartFail(state, action);
        default:
            return state;
    }
};

export default reducer;
