import { ITEMS_PER_PAGE } from 'Data/constants';
import * as actionTypes from '../../../actions/actionTypes';
import { updateObject } from '../../utility';

const initialState = {
    error: null,
    message: null,
    loader: false,
    data: null,
    appData: {},
    total : 0,
    active : 1,
    renderPage: '',
    searchResults : null,
    searchData : null,
    filter : 'active',
    size: ITEMS_PER_PAGE,
    userType: {
        id: 'active',
        name: 'Existing Users',
    },
    filters: {},
    sorter: 'first_name',
    activeSorter: {},
    activeFilters: [],
    extraColumns: [],
};
const getUsers = (state, action) => {
    return updateObject(state, {
        data: action.users,
        total: action.total,
        active: action.active,
        loader: action.loader,
        error: null,
        size: action.size,
        userType: action.userType,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters,
        extraColumns: action.extraColumns,
    })
}
const addUsers = (state, action) => {
    return updateObject(state, {
        loader: action.loader,
        message: action.message,
    })
}
const updateUser = (state, action) => {
    return updateObject(state, {
        // data: [...state.data.map(user => {
        //     if (user.id === action.data.id)
        //         return action.data
        //     return user
        // })],
        loader: false,
        message: action.message,
        error: null
    })
}
const getRoles = (state, action) => {
    return updateObject(state, {
        roles: action.roles.data,
        loader: false
    })
}
const userSearch = (state, action) => {
    return updateObject(state, {
        searchResults: action.results
    })
}
const userDelete = (state, action) => {
    if (state.searchData) {
        return updateObject(state, {
            searchResults: [...state.searchResults.filter(user => user.id !== action.id)],
            renderPage: action.renderPage,
            loader : false,
            error: null
        })
    }
    return updateObject(state, {
        data: [...state.data.filter(user => user.id !== action.id)],
        renderPage: action.renderPage,
        loader: action.loader,
        error: null
    })
}
const userError = (state, action) => {
    return updateObject(state, {
        error: action.error,
        message: action.message,
        loader: false
    })
}

const setLoader = (state) => {
    return updateObject(state, {
        loader: true
    })
}

const setError = (state, action) => {
    return updateObject(state, {
        error: action.error
    })
}

const getUserManager = (state, action) => {
    return updateObject(state, {
        managers: action.data
    })
}

const UsersSearch = (state, action) => {
    return updateObject(state, {
        loader          : false,
        searchResults   : action.data,
        total           : action.total,
        active          : action.page,
        searchData      : action.searchItem,
        filter          : action.filter,
        error           : null
    })
}

const clearUserSearch = (state) => {
    return updateObject(state,{
        loader          : false,
        searchResults   : null,
        searchData      : null
    })
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.USER_GET:
            return getUsers(state, action)
        case actionTypes.USER_CREATE:
            return addUsers(state, action)
        case 'USER_SEARCH_RESULTS':
            return userSearch(state, action)
        case actionTypes.USER_UPDATE:
            return updateUser(state, action)
        case actionTypes.GET_ROLES:
            return getRoles(state, action)
        case actionTypes.USER_DELETE:
            return userDelete(state, action)
        case actionTypes.USER_ERROR:
            return userError(state, action)
        case actionTypes.LOADER:
            return setLoader(state, action)
        case actionTypes.ALERT_CLOSE:
            return setError(state, action)
        case actionTypes.GET_MANAGER:
            return getUserManager(state, action);
        case actionTypes.USER_SEARCH:
            return UsersSearch(state, action);
        case actionTypes.CLEAR_USER_SEARCH:
            return clearUserSearch(state);
        case actionTypes.SET_USERS_SEARCH:
            return {
                ...state,
                searchData: action.query
            }
        case actionTypes.RENDER_USERS_PAGE:
            return {
                ...state,
                renderPage: `${state.renderPage}*`
            }
        default:
            return state;
    }
};

export default reducer;