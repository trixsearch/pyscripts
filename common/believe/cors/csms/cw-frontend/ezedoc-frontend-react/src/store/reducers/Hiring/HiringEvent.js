import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../actions/actionTypes";
import { updateObject } from '../utility';

const initialState = {
    loader: null,
    total: 0,
    data: [],
    activePage: 1,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'event_id',
    activeSorter: {},
    activeFilters: [],
};

const HiringEventStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
const HiringEventGetSucces = (state, action) => {
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
const HiringEventCreateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const HiringEventUpdateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};
const HiringEventDeleteSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(event=> event.id !== action.id)]
    });
};

const HiringEventError = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.HIRING_EVENT_START:
            return HiringEventStart(state, action);

        case actionTypes.HIRING_EVENT_GET_SUCCESS:
            return HiringEventGetSucces(state, action);
        
        case actionTypes.HIRING_EVENT_CREATE_SUCCESS:
            return HiringEventCreateSuccess(state, action);
        
        case actionTypes.HIRING_EVENT_DELETE_SUCCESS:
            return HiringEventDeleteSuccess(state, action);
        
        case actionTypes.HIRING_EVENT_UPDATE_SUCCESS:
            return HiringEventUpdateSuccess(state, action);
        
        case actionTypes.HIRING_EVENT_ERROR:
            return HiringEventError(state, action);
        
        default:
            return state;
    }
};

export default reducer;