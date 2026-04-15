import { ITEMS_PER_PAGE } from 'Data/constants'
import { updateObject } from '../../utility';
import * as actionTypes from '../../../actions/actionTypes';

const initialState = {
    datas: [],
    loader: false,
    totalCount: 0,
    activePage: 1,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'name',
    activeSorter: {},
    activeFilters: [],
}

const setAdvListLoader = (state, action) => {
    return updateObject(
        state,
        {
            loader: action.loader
        }
    )
}

const getAdvListData = (state, action) => {
    return updateObject(
        state,
        {
            datas: action.datas,
            totalCount: action.totalCount,
            activePage: action.activePage,
            error: null,
            size: action.size,
            filters: action.filters,
            sorter: action.sorter,
            activeSorter: action.activeSorter,
            activeFilters: action.activeFilters,
            loader:false
        }
    )
}

const searchAdvList = (state, action) => {
    return updateObject(
        state,
        {
            activePage: action.page,
            totalCount: action.totalCount,
            searchData: action.searchData,
            searchResult: action.searchResult
        }
    )
}

const clearAdvListSearch = (state, action) => {
    return updateObject(
        state,
        {
            searchData: action.searchData,
            searchResult: action.searchResult
        }
    )
}

const reducer = (state = initialState, action) => {
    switch(action.type) {
        case actionTypes.GET_ADVANCED_LIST_DATA:
            return getAdvListData(state, action);
        case actionTypes.SET_ADVANCED_LIST_LOADER:
            return setAdvListLoader(state, action);
        case actionTypes.SEARCH_ADVANCED_LIST:
            return searchAdvList(state, action);
        case actionTypes.CLEAR_ADVANCED_LIST_SEARCH:
            return clearAdvListSearch(state, action);
        default:
            return state;
    }
}

export default reducer;