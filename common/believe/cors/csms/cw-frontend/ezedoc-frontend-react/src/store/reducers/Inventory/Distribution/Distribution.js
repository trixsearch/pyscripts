import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../../actions/actionTypes"
import { updateObject } from '../../utility'

const initialState = {
    loader: null,
    total: 0,
    data: [],
    activePage: 1,
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'distribution__allottee__first_name',
    activeSorter: {},
    activeFilters: [],
    size2: ITEMS_PER_PAGE,
    filters2: {},
    sorter2: 'destination__name',
    activeSorter2: {},
    activeFilters2: [],
    extraColumns: [],
}

const DistributionStart = (state) => {
    return updateObject(state, {
        loader: true,
    })
}

const DistributionGetSuccess = (state, action) => {
    if (action.stockType) {
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
            extraColumns: action.extraColumns,
        })
    }
    return updateObject(state, {
        loader: false,
        data: action.data,
        total: action.paginationData.total_count,
        activePage: action.activePage,
        size2: action.size,
        filters2: action.filters,
        sorter2: action.sorter,
        activeSorter2: action.activeSorter,
        activeFilters2: action.activeFilters,
    })
}

const DistributionCreateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    })
}

const DistributionError = (state) => {
    return updateObject(state, {
        loader: false,
    })
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.DISTRIBUTION_START:
            return DistributionStart(state, action)

        case actionTypes.DISTRIBUTION_GET_SUCCESS:
            return DistributionGetSuccess(state, action)

        case actionTypes.DISTRIBUTION_CREATE_SUCCESS:
            return DistributionCreateSuccess(state, action)

        case actionTypes.DISTRIBUTION_ERROR:
            return DistributionError(state, action)

        default:
            return state
    }
}

export default reducer
