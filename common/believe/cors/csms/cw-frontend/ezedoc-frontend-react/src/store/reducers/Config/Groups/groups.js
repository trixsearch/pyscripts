import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../../actions/actionTypes";
import { updateObject } from '../../utility';

const initialState = {
    error: null,
    message: null,
    loader: false,
    data: null,
    appData: {},
    total:0,
    active : 1,
    searchResults: null,
    searchData: null,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'name',
    activeSorter: {},
    activeFilters: [],
};

const groupPending = (state) => {
    return updateObject(state, {
        loader : true
    })
}
const getGroups = (state, action) => {
    return updateObject(state, {
        data: action.groups,
        loader : false,
        total: action.total,
        active : action.active,
        searchResults: null,
        searchData: null,
        error: null,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters
    })
}

const deleteGroup = (state, action) => {
  if (state.searchResults) {
    return updateObject(state, {
      loader: false,
    //   error: false,
      renderPage: action.renderPage,
      searchResults: [
        ...state.searchResults.filter((group) => group.id !== action.id),
      ],
    });
  }

  return updateObject(state, {
    data: [...state.data.filter((group) => group.id !== action.id)],
    renderPage: action.renderPage,
    loader: false,
    // error: false,
  });
};
const groupError = (state, action) => {
    return updateObject(state, {
        error : action.error,
        loader: false,
        message : action.message
    })
}
const clearError = (state) => {
    return updateObject(state, {
        error : null,
        message: null
    })
}
const groupSearch = (state, action) => {
    return updateObject(state, {
        loader          : false,
        searchResults   : action.data,
        total           : action.total,
        active          : action.page,
        searchData      : action.searchItem
    })
}

const clearGroupSearch = (state) => {
    return updateObject(state,{
        loader          : false,
        searchResults   : null,
        searchData      : null
    })
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.GROUP_GET:
            return getGroups(state, action)
        case actionTypes.GROUP_DELETE:
            return deleteGroup(state, action)
        case actionTypes.GROUP_ERROR:
            return groupError(state, action)
        case actionTypes.ALERT_CLOSE:
            return clearError(state, action)
        case actionTypes.GROUP_LOADER:
            return groupPending(state, action)
        case actionTypes.GROUP_SEARCH:
            return groupSearch(state, action)
        case actionTypes.CLEAR_GROUP_SEARCH:
            return clearGroupSearch(state);
        case actionTypes.SET_GROUP_SEARCH:
            return {
                ...state,
                searchData: action.query
            }
        default:
            return state;
    }
};

export default reducer;
