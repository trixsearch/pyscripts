import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../actions/actionTypes";
import { updateObject } from '../utility';

const initialState = {
    error: null,
    loader: null,
    total: 0,
    data: [],
    activePage: 1,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'name',
    activeSorter: {},
    activeFilters: [],
};

const JobRoleStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
const JobRoleGetSucces = (state, action) => {
    return updateObject(state, {
        loader: false,
        data: action.data,
        total: action.total,
        activePage: action.activePage,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters
    });
};

const JobRoleCreateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const JobRoleUpdateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};
const JobRoleDeleteSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(jobRole=> jobRole.id !== action.id)],
        total: state.total - 1 
    });
};

const JobRoleError = (state, action) => {
    return updateObject(state, {
        loader: false,
        error : action.error
    });
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.JOB_ROLE_START:
            return JobRoleStart(state, action);

        case actionTypes.JOB_ROLE_GET_SUCCESS:
            return JobRoleGetSucces(state, action);
        
        case actionTypes.JOB_ROLE_CREATE_SUCCESS:
            return JobRoleCreateSuccess(state, action);
        
        case actionTypes.JOB_ROLE_DELETE_SUCCESS:
            return JobRoleDeleteSuccess(state, action);
        
        case actionTypes.JOB_ROLE_UPDATE_SUCCESS:
            return JobRoleUpdateSuccess(state, action);
        
        case actionTypes.JOB_ROLE_ERROR:
            return JobRoleError(state, action);
        
        default:
            return state;
    }
};

export default reducer;