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

const PartnerStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
const PartnerGetSucces = (state, action) => {
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
const PartnerCreateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const PartnerUpdateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};
const PartnerDeleteSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(event=> event.id !== action.id)]
    });
};

const PartnerError = (state, action) => {
    return updateObject(state, {
        loader: false,
        error : action.error
    });
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.HIRING_PARTNER_START:
            return PartnerStart(state, action);

        case actionTypes.HIRING_PARTNER_GET_SUCCESS:
            return PartnerGetSucces(state, action);
        
        case actionTypes.HIRING_PARTNER_CREATE_SUCCESS:
            return PartnerCreateSuccess(state, action);
        
        case actionTypes.HIRING_PARTNER_DELETE_SUCCESS:
            return PartnerDeleteSuccess(state, action);
        
        case actionTypes.HIRING_PARTNER_UPDATE_SUCCESS:
            return PartnerUpdateSuccess(state, action);
        
        case actionTypes.HIRING_PARTNER_ERROR:
            return PartnerError(state, action);
        
        default:
            return state;
    }
};

export default reducer;