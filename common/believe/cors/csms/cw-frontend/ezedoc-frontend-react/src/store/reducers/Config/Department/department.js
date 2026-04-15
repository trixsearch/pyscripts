import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from '../../../actions/actionTypes';
import { updateObject } from '../../utility';

const initialState = {
    error: null,
    message: null,
    loader: false,
    data: null,
    head: [],
    active: 1,
    total: 1,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'department__name',
    activeSorter: {},
    activeFilters: [],
    extraColumns: [],
};


export const departmentStart = (state) => {
    return updateObject(state, {
        loader : true
    })
}
export const DepartmentGetSuccess = (state = initialState, action) => {
    return updateObject(state, {
        data: action.data,
        loader : false,
        active: action.active,
        total: action.total,
        error: null,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters,
        extraColumns: action.extraColumns,
    })
}

export const DepartmentDeleteSuccess = (state = initialState, action) => {
    return updateObject(state, {
        loader : false,
        renderPage: action.renderPage,
        data : [...state.data.filter(dep => dep.id !== action.id)]
    })
}

export const DepartmentSuccess = (message) => {
    return {
        type: actionTypes.DEPARTMENT_SUCCESS,
        message: message,
        loader : false

    }
}
export const DepartmentError = (state, action) => {
    return updateObject(state, {
        error : action.error,
        message : action.message,
        loader : false
    })
}
const clearError = (state, action) => {
    return updateObject(state, {    
        error : action.error,
        loader: false
    })
}


const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.DEPARTMENT_GET:
            return DepartmentGetSuccess(state, action);
        case actionTypes.DEPARTMENT_DELETE:
            return DepartmentDeleteSuccess(state, action);
        case actionTypes.DEPARTMENT_ERROR:
            return DepartmentError(state, action);
        case actionTypes.DEPARTMENT_START:
            return departmentStart(state, action);
        case actionTypes.ALERT_CLOSE:
            return clearError(state, action);
        default:
            return state;
    }
};

export default reducer;