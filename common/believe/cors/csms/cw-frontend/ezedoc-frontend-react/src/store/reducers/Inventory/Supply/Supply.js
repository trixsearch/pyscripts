import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../../actions/actionTypes";
import { updateObject } from '../../utility';

const initialState = {
    loader: null,
    total: 0,
    data: [],
    activePage: 1,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'asset__name',
    activeSorter: {},
    activeFilters: [],
};

const SupplyStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
const SupplyGetSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        data: action.data,
        total: action.paginationData.total_count,
        activePage: action.activePage,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters,
    });
};
const SupplyCreateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const SupplyUpdateSuccess = (state, action) => {
    if ('renderPage' in action) {
        if (action.renderPage) {
            return updateObject(state, {
                loader: false,
                renderPage: action.renderPage,
            })
        }
    }
    return updateObject(state, {
        loader: false,
    });
};
const SupplyDeleteSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(supply => supply.id !== action.id)]
    });
};

const SupplyError = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.SUPPLY_START:
            return SupplyStart(state, action);

        case actionTypes.SUPPLY_GET_SUCCESS:
            return SupplyGetSuccess(state, action);
        
        case actionTypes.SUPPLY_CREATE_SUCCESS:
            return SupplyCreateSuccess(state, action);
        
        case actionTypes.SUPPLY_DELETE_SUCCESS:
            return SupplyDeleteSuccess(state, action);
        
        case actionTypes.SUPPLY_UPDATE_SUCCESS:
            return SupplyUpdateSuccess(state, action);
        
        case actionTypes.SUPPLY_ERROR:
            return SupplyError(state, action);
        
        default:
            return state;
    }
};

export default reducer;