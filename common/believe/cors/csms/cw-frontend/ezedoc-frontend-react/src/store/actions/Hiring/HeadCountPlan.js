/* eslint-disable import/prefer-default-export */
import axios from 'axios'

import {
    GET_HEAD_COUNTS,
    SET_HEAD_COUNT_LOADER,
    SET_HEAD_COUNT_ROLE_LOCATION_DATA,
} from 'store/actions/actionTypes'
import { addToast } from 'components/Toast/actions'

const APP_URL = process.env.REACT_APP_APP_URL;

const setLoader = loader => ({
    type: SET_HEAD_COUNT_LOADER,
    loader,
})

const getHeadCountPlanList = (data, size, filters, sorter, activeFilters, activeSorter) => ({
    type: GET_HEAD_COUNTS,
    loader: false,
    headcounts: data.data,
    total: data.pagination_data.total_count,
    size,
    filters,
    sorter,
    activeFilters,
    activeSorter,
})

export const setHeadCountRoleLocationData = selectedData => ({
    type: SET_HEAD_COUNT_ROLE_LOCATION_DATA,
    selectedData,
})

const errorDispatcher = (errorMessage, dispatch) => {
    if (errorMessage.response?.data.message) {
        dispatch(addToast('error', 'Error', errorMessage.response.data.message))
        dispatch(setLoader(false))
    }
    const message = errorMessage.message || 'Something went wrong, please try after sometime.'
    dispatch(addToast('error', 'Error', message))
    dispatch(setLoader(false))
}

export const getHeadCountPlans = (orgId, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `${APP_URL}/${orgId}/jobs/headcount/gap?page=${page}&page_count=${size}`

    Object.keys(filters).map(item => {
        url += `&${item}__icontains=${filters[item]}`
        return null
    })

    if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url)
            .then(response => {
                if (response.data.data && response.data.pagination_data) dispatch(getHeadCountPlanList(response.data, size, filters, sorter, activeFilters, activeSorter))
                if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                    const total = response.data.total
                    let nextPage
                    if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                    else nextPage = Math.floor(total / 10)
                    history.push({ pathname: '', search: `?page=${nextPage}` })
                }
            })
            .catch(err => dispatch(errorDispatcher(err, dispatch)))
    }
}

export const setPlanning = data => {
    const url = `${APP_URL}/${orgId}/jobs/headcount`
    return dispatch => {
        dispatch(setLoader(true))
        axios.post(url, data)
            .then(response => dispatch(addToast('success', 'Success', response.data.message)))
            .catch(err => dispatch(errorDispatcher(err, dispatch)))
            .finally(() => dispatch(setLoader(false)))
    }
}
