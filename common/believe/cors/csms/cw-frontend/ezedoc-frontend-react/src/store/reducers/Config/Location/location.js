import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../../actions/actionTypes";
import { updateObject } from '../../utility';

const initialState = {
    error: null,
    message: null,
    loader: false,
    data: null,
    head: [],
    active: 1,
    total: 1,
    searchData: null,
    searchResults: null,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'location__name',
    activeSorter: {},
    activeFilters: [],
    extraColumns: [],
};


export const locationStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
export const LocationGetSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        data: action.data,
        active: action.active,
        total: action.total,
        searchResults: null,
        searchData: null,
        error: null,
        activePage: action.activePage,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters,
        extraColumns: action.extraColumns,
    });
};

export const LocatonDeleteSuccess = (state, action) => {
    if(state.searchData) {
        return updateObject(state, {
            loader : false,
            renderPage: action.renderPage,
            searchResults: [...state.searchResults.filter(loc => loc.id !== action.id)]
        })
    }
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(loc => loc.id !== action.id)],
    });
};


export const LocatonHeadSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        head: action.data
    });
};

const LocationSearch = (state, action) => {
    return updateObject(state, {
        loader          : false,
        searchResults   : action.data,
        total           : action.total,
        active          : action.page,
        searchData      : action.searchItem
    })
}

const clearLocationSearch = (state) => {
    return updateObject(state,{
        loader          : false,
        searchResults   : null,
        searchData      : null
    })
}

export const LocationError = (state, action) => {
    return updateObject(state, {
        loader: false,
        message: action.message,
        error : action.error
    });
};
const clearError = (state, action) => {
    return updateObject(state, {
        error : action.error,
        loader: false,
    })
}

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.LOCATION_START:
            return locationStart(state, action);

        case actionTypes.LOCATION_GET_SUCCESS:
            return LocationGetSuccess(state, action);
        
        case actionTypes.LOCATION_DELETE_SUCCESS:
            return LocatonDeleteSuccess(state, action);
        
        case actionTypes.LOCATION_HEAD:
            return LocatonHeadSuccess(state, action);
        
        case actionTypes.LOCATION_SEARCH:
            return LocationSearch(state, action);
        
        case actionTypes.LOCATION_CLEAR_SEARCH:
            return clearLocationSearch(state);
        
        case actionTypes.LOCATION_ERROR:
            return LocationError(state, action);
        
        case actionTypes.ALERT_CLOSE:
            return clearError(state, action);

        case actionTypes.SET_LOCN_SEARCH:
            return {
                ...state,
                searchData: action.searchItem
            }
        
        default:
            return state;
    }
};

export default reducer;