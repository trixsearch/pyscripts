import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from '../../../actions/actionTypes';
import { updateObject } from '../../utility';

const initialState = {
    data: [],
    error: "",
    message: "",
    loader: false,
    listData: {},
    total : 0,
    active : 1,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'name',
    activeSorter: {},
    activeFilters: [],
}

const setLoader = (state) => (
    updateObject(state, {
        loader: true
    })
)

const getCustomData = (state, action) => (
    updateObject(state, {
        loader: false,
        data: action.data,
        active: action.active,
        total: action.total,
        error: null,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters
    })
)

const postCustomData = (state) => (
    updateObject(state, {
        loader: false
    })
)

const editCustomData = (state) => (
    updateObject(state, {
        loader: false
    })
)

const getCustomListByID = (state, action) => (
    updateObject(state, {
        loader: false,
        listData: action.listData
    })
)

const deleteCustomDataList = (state, action) => {
    if(state.searchData) {
        return updateObject(state, {
            loader : false,
            renderPage: action.renderPage,
            searchResults: [...state.searchResults.filter(list => list.id !== action.id)]
        })
    }
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(list => list.id !== action.id)],
    });
}

const errorCustomData = (state, action) => {
    return updateObject(state, {
        loader: false,
        error: action.error
    })
}
const ListSearch = (state, action) => {
    return updateObject(state, {
        loader          : false,
        searchResults   : action.data,
        total           : action.total,
        active          : action.page,
        searchData      : action.searchItem
    })
}

const clearListSearch = (state) => {
    return updateObject(state,{
        loader          : false,
        searchResults   : null,
        searchData      : null
    })
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.CUSTOM_DATA_LOADER:
            return setLoader(state, action);
        case actionTypes.CUSTOM_DATA_GET:
            return getCustomData(state, action);
        case actionTypes.CUSTOM_DATA_POST:
            return postCustomData(state, action);
        case actionTypes.CUSTOM_DATA_EDIT:
            return editCustomData(state, action);
        case actionTypes.CUSTOM_DATA_ERROR:
            return errorCustomData(state, action);
        case actionTypes.CUSTOM_DATA_GET_BY_ID:
            return getCustomListByID(state, action);
        case actionTypes.CUSTOM_DATA_DELETE:
            return deleteCustomDataList(state, action);
        case actionTypes.LIST_SEARCH:
            return ListSearch(state, action);
        case actionTypes.LIST_CLEAR_SEARCH:
            return clearListSearch(state);
        case actionTypes.SET_CUSTOM_DATA_SEARCH:
            return {
                ...state,
                searchData: action.searchItem
            }
        default:
            return state;
    }
}

export default reducer;