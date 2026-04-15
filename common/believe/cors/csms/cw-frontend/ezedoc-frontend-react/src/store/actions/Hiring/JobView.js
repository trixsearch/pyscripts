/* eslint-disable no-unused-vars */
import axios from 'axios'

import {
    GET_JOB,
    GET_JOB_CANDIDATES,
    GET_JOB_SLOTS,
    SET_JOB_VIEW_LOADER,
    CLEAR_JOB_CANDIDATES,
    CLEAR_JOB_SLOTS,
    SLOT_DELETE,
} from 'store/actions/actionTypes'
import { ITEMS_PER_PAGE } from 'Data/constants'
import { addToast } from 'components/Toast/actions'

const APP_URL = process.env.REACT_APP_APP_URL;

const setLoader = loader => ({
    type: SET_JOB_VIEW_LOADER,
    loader,
})

const getJobDetail = job => ({
    type: GET_JOB,
    job,
})

export const slotDelete= (id, renderPage)=>{
    return{
        type:SLOT_DELETE,
        renderPage,
        id
    }
}

const getSlotList = (data, size, filters, sorter1, activeFilters, activeSorter) => ({
    type: GET_JOB_SLOTS,
    loader: false,
    slots: data.data,
    total: data.pagination_data.total_count,
    size,
    filters,
    sorter1,
    activeFilters,
    activeSorter,
})

const getCandidateList = (data, size, filters, sorter, activeFilters, activeSorter) => ({
    type: GET_JOB_CANDIDATES,
    loader: false,
    candidates: data.data,
    total: data.pagination_data.total_count,
    size,
    filters,
    sorter,
    activeFilters,
    activeSorter,
})

export const clearSlots = () => ({
    type: CLEAR_JOB_SLOTS,
    total: 0,
    job: {},
    slots: [],
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'slotId',
    activeSorter: {},
    activeFilters: [],
})

export const clearCandidates = () => ({
    type: CLEAR_JOB_CANDIDATES,
    total: 0,
    job: {},
    candidates: [],
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'candidateId',
    activeSorter: {},
    activeFilters: [],
})

const errorHandler = (errorMessage, dispatch) => {
    if (errorMessage.response?.data.message) {
        dispatch(addToast('error', 'Error', errorMessage.response.data.message))
        dispatch(setLoader(false))
    }
    const message = errorMessage.message || 'Something went wrong, please try after sometime.'
    dispatch(addToast('error', 'Error', message))
    dispatch(setLoader(false))
}

export const getJob = (orgId, id) => {
    const url = `${APP_URL}/${orgId}/jobs/${id}`

    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url)
            .then(response => {
                if (response.data.data) dispatch(getJobDetail(response.data.data))
            })
            .catch(err => dispatch(errorHandler(err, dispatch)))
    }
}

export const getCandidates = (orgId, page = 1, size = 10, jobId, filters, sorter, activeFilters, activeSorter, history, eventId, vendorId, stage_name) => {
    let url = `${APP_URL}/${orgId}/jobs/candidate?job__job_id=${jobId}&page=${page}&page_count=${size}`

    if (eventId) url += `&hiring_event__event_id=${eventId}`
    if (vendorId) url += `&sourcing_partner__id=${vendorId}`
    if(stage_name) url += `&filter_stage__name=${stage_name}`

    Object.keys(filters).map(item => {
        if (item === 'hiring_status') url += `&${item}=${filters[item]}`
        else if(item.includes('__gte')||item.includes('__lte')) { url += `&${item}=${filters[item]}`}
        else if(filters[item].split(',')?.length>1) { url += `&${item}__in=${filters[item]}`}
        else  url += `&${item}__icontains=${filters[item]}`
        return null
    })

    if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url)
            .then(response => {
                if (response.data.data && response.data.pagination_data) dispatch(getCandidateList(response.data, size, filters, sorter, activeFilters, activeSorter))
                if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                    const total = response.data.total
                    let nextPage
                    if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                    else nextPage = Math.floor(total / 10)
                    history.push({ pathname: '', search: `?page=${nextPage}` })
                }
            })
            .catch(err => dispatch(errorHandler(err, dispatch)))
    }
}

export const getSlots = (orgId, page = 1, size = 10, jobId, filters, sorter1, activeFilters, activeSorter, history) => {
    let url = `${APP_URL}/${orgId}/jobs/slot?job__job_id=${jobId}&page=${page}&page_count=${size}`
    
    Object.keys(filters).map(item => {
        if (item === 'interview_location') url += `&${item}__name__icontains=${filters[item]}`
        else if(item.includes('__gte')||item.includes('__lte')||item === 'start_time') { url += `&${item}=${filters[item]}`}
        else if(filters[item].split(',')?.length>1) { url += `&${item}__in=${filters[item]}`}
        else url += `&${item}__icontains=${filters[item]}`
        return null
    })
    
    if (sorter1) url += `&ordering=${sorter1}`

    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url)
            .then(response => {
                if (response.data.data && response.data.pagination_data) dispatch(getSlotList(response.data, size, filters, sorter1, activeFilters, activeSorter))
                if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                    const total = response.data.total
                    let nextPage
                    if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                    else nextPage = Math.floor(total / 10)
                    history.push({ pathname: '', search: `?page=${nextPage}` })
                }
            })
            .catch(err => dispatch(errorHandler(err, dispatch)))
    }
}

export const deleteSlot = (orgId, id, total, itemsPerPage, page, renderPage)=>{
    return dispatch =>{
        dispatch(setLoader(true))
        axios.delete(`${APP_URL}/${orgId}/jobs/slot/${id}`).then(() => {
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(slotDelete(id, isRenderRequired))
            dispatch(addToast('success', 'Success', 'A slot has been deleted successfully'))
        }).catch(err=>{
            dispatch(errorHandler(err, dispatch))
        })
    }
}