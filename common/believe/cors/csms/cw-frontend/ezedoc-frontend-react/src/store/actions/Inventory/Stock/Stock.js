/* eslint-disable import/prefer-default-export */
import axios from 'axios'

import * as actionTypes from '../../actionTypes'
import { addToast } from '../../../../components/Toast/actions'

const StockStart = () => {
    return {
        type: actionTypes.STOCK_START,
    }
}

const StockGetSuccess = (data, page, size, filters, sorter, activeFilters, activeSorter) => {
    return {
        type: actionTypes.STOCK_GET_SUCCESS,
        data: data.data,
        paginationData: data.pagination_data,
        activePage: page,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,

    }
}

const StockError = (error, dispatch) => {
    if (error.response.data.message) {
        dispatch(addToast('error', 'Error', error.response.data.message))
        return {
            type: actionTypes.STOCK_ERROR,
        }
    }
    let message = error.message || 'Something went wrong, please try after sometime.'
    dispatch(addToast('error', 'Error', message))
    return {
        type: actionTypes.STOCK_ERROR
    }

}

export const getStock = (page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `/api/inventory/stocks?page=${page}&page_count=${size}`
    Object.keys(filters).map(item => {
        if (item === 'quantity') url += `&${item}=${filters[item]}`
        else url += `&${item}__icontains=${filters[item]}`
        return null
    })

    if (sorter) url += `&ordering=${sorter}`
    return dispatch => {
        dispatch(StockStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(StockGetSuccess(response.data, page, size, filters, sorter, activeFilters, activeSorter));
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err => {
            dispatch(StockError(err, dispatch))
        })
    }
}
