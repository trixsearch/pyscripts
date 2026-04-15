import axios from 'axios'

import * as actionTypes from '../../actionTypes'
import { addToast } from '../../../../components/Toast/actions'

export const DistributionStart = () => {
    return {
        type: actionTypes.DISTRIBUTION_START,
    }
}

const DistributionGetSuccess = (data, stockType, page, size, filters, sorter, activeFilters, activeSorter, extraColumns) => {
    return {
        type: actionTypes.DISTRIBUTION_GET_SUCCESS,
        data: data.data,
        paginationData: data.pagination_data,
        activePage: page,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
        stockType,
        extraColumns,
    }
}

const DistributionCreateSuccess = () => {
    return {
        type: actionTypes.DISTRIBUTION_CREATE_SUCCESS,
    }
}

const DistributionError = (error, dispatch) => {
    if (error.response.data.message) {
        dispatch(addToast('error', 'Error', error.response.data.message))
        return {
            type: actionTypes.DISTRIBUTION_ERROR
        }
    }
    let message = error.message || 'Something went wrong, please try after sometime.'
    dispatch(addToast('error', 'Error', message))
    return {
        type: actionTypes.DISTRIBUTION_ERROR
    }
}

export const getDistributions = (stockType, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, extraColumns, history) => {
    let url = `/api/inventory/asset_distribution?type=${stockType}&page=${page}&page_count=${size}`
    
    Object.keys(filters).map(item => {
        if (item.includes('extra_fields')) {
            const matchedObj = extraColumns.find(column => `distribution__allottee__extra_fields__${column.key}` === item)
            if (matchedObj.type === 'string') url += `&${item}__icontains=${filters[item]}`
            if (matchedObj.type === 'number' || matchedObj.type === 'date') url += `&${item}=${filters[item]}`
        } else if (item === 'quantity') url += `&${item}=${filters[item]}`
        else url += `&${item}__icontains=${filters[item]}`
        return null
    })

    if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(DistributionStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(DistributionGetSuccess(response.data, stockType, page, size, filters, sorter, activeFilters, activeSorter, extraColumns))
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err => {
            dispatch(DistributionError(err, dispatch))
        })
    }
}

export const createDistribution = (data, history, next = 1) => {
    const {
        asset, location, extUser, transferredTo, quantity
    } = data
    const setDistribution = {
        asset,
        quantity: parseInt(quantity, 10),
        location,
        allottee: extUser,
        destination: transferredTo
    }
    return dispatch => {
        dispatch(DistributionStart())
        axios.post(`/api/inventory/asset_distribution`, setDistribution).then(response => {
            dispatch(addToast('success', 'Success', 'Distribution Added Successfully'))
            dispatch(DistributionCreateSuccess(response.data))
            history.push(`/inventory/distribution${transferredTo ? '/inter' : ''}?page=${next}`)
        }).catch(err => {
            dispatch(DistributionError(err, dispatch))
        })
    }
}
