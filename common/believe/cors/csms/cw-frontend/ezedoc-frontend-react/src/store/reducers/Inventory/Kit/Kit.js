import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from '../../../actions/actionTypes'
import { updateObject } from '../../utility'

const initialState = {
    loader: null,
    total: 0,
    data: [],
    activePage: 1,
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'name',
    activeSorter: {},
    activeFilters: [],
}

const kitStart = (state) => {
    return updateObject(state, {
        loader: true,
    })
}

const KitGetSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        data: action.data,
        total: action.paginationData.total_count,
        activePage: action.activePage,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters
    })
}

const KitCreateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    })
}

const KitUpdateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    })
}
const KitDeleteSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(kit => kit.id !== action.id)]
    });
};

const KitError = (state) => {
    return updateObject(state, {
        loader: false,
    })
}

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.KIT_START:
            return kitStart(state, action)

        case actionTypes.KIT_GET_SUCCESS:
            return KitGetSuccess(state, action)

        case actionTypes.KIT_CREATE_SUCCESS:
            return KitCreateSuccess(state, action)

        case actionTypes.KIT_UPDATE_SUCCESS:
            return KitUpdateSuccess(state, action)
        
        case actionTypes.KIT_DELETE_SUCCESS:
            return KitDeleteSuccess(state, action);

        case actionTypes.KIT_ERROR:
            return KitError(state, action)

        default:
            return state
    }
}

export default reducer
