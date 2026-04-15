/* eslint-disable no-unused-vars */
import axios from 'axios'

import {
    GET_JOBS,
    EDIT_JOB,
    DELETE_JOB,
    SET_JOB_LOADER,
    JOB_ERROR,
} from 'store/actions/actionTypes'
import { addToast } from 'components/Toast/actions'

const setLoader = loader => ({
    type: SET_JOB_LOADER,
    loader,
})

const APP_URL = process.env.REACT_APP_APP_URL;

const getJobList = (data, size, filters, sorter, activeFilters, activeSorter, eventId = null) => {
    if (eventId) {
        return {
            type: GET_JOBS,
            loader: false,
            jobs: data.data,
            total: data.pagination_data.total_count,
            size2: size,
            filters2: filters,
            sorter2: sorter,
            activeFilters2: activeFilters,
            activeSorter2: activeSorter,
        }
    }
    return {
        type: GET_JOBS,
        loader: false,
        jobs: data.data,
        total: data.pagination_data.total_count,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
    }
}

const editSingleJob = () => ({
    type: EDIT_JOB,
})

const deleteSingleJob = (id, renderPage) => ({
    type: DELETE_JOB,
    renderPage,
    id,
})

const jobActionError = (err, dispatch, getError=false) => {
    try {
        if (err.response) {
            dispatch(addToast('error', 'Error', err.response.data.message))
            dispatch(setLoader(false))
            return {
                type: JOB_ERROR,
                error: getError ? err.response.data.message : false
            }
        }
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        dispatch(setLoader(false))
        return {
            type: JOB_ERROR,
            error: getError ? (err.message || "Something went wrong, please try after sometime.") : false
        };
    } catch (error) {
        dispatch(addToast('error', 'Error', error.message))
        dispatch(setLoader(false))
        return {
            type: JOB_ERROR,
            error: getError ? error.message : false
        }
    }
}

const commonFetchJobsHandler = (apiSignature, extraQueryParams = null, page, size, filters, sorter, activeFilters, activeSorter, history, eventId = null) => {
    let url = `${apiSignature}?${extraQueryParams ? `${extraQueryParams}&` : ''}page=${page}&page_count=${size}`
    
    Object.keys(filters).map(item => {
        if (item === 'status') url += `&${item}=${filters[item]}`
        else if(item === 'work_location') url+=`&vendor_work_location__work_location__name__icontains=${filters[item]}`
        else if(item.includes('__gte')||item.includes('__lte')) { url += `&${item}=${filters[item]}`}
        else if(typeof filters[item] === 'string' &&filters[item].split(',')?.length>1) {url += `&${item}__icontains=${filters[item]}`}
        else if(item === 'candidate_preferences__gender') url += `&${item}__iexact=${filters[item]}`
        else url += `&${item}__icontains=${filters[item]}`
        return null
    })
    
    if (sorter) url += `&ordering=${sorter}`
    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url)
            .then(response => {
                if (response.data.data && response.data.pagination_data) {
                    if (eventId) dispatch(getJobList(response.data, size, filters, sorter, activeFilters, activeSorter, eventId))
                    else dispatch(getJobList(response.data, size, filters, sorter, activeFilters, activeSorter))
                }
                if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                    const total = response.data.total
                    let nextPage
                    if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                    else nextPage = Math.floor(total / 10)
                    history.push({ pathname: '', search: `?page=${nextPage}` })
                }
            })
            .catch(err => dispatch(jobActionError(err, dispatch)))
    }
}

export const getJobs = (orgId, extraQueryParams, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    const apiSignature = `${APP_URL}/${orgId}/jobs/`
    return dispatch => dispatch(commonFetchJobsHandler(apiSignature, extraQueryParams, page, size, filters, sorter, activeFilters, activeSorter, history))
}

export const getEventJobs = (orgId, eventId, extraQueryParams, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    const apiSignature = `${APP_URL}/${orgId}/jobs/hiringevent`
    // const extraQueryParams = `hiring_event=${eventId}`
    return dispatch => dispatch(commonFetchJobsHandler(apiSignature, extraQueryParams, page, size, filters, sorter, activeFilters, activeSorter, history, eventId))
}

export const editJob = () => { }

export const deleteJob = (orgId, jobId, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(setLoader(true))
        axios.delete(`${APP_URL}/${orgId}/jobs/${jobId}`).then(() => {
            dispatch(addToast('success', 'Success', 'Job Deleted Successfully'))
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(deleteSingleJob(jobId, isRenderRequired))
        }).catch(err => {
            dispatch(jobActionError(err, dispatch))
        })
    }
}