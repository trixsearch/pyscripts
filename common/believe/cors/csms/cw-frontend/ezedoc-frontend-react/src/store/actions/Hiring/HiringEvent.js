/* eslint-disable no-unused-vars */
import axios from 'axios'

import { addToast } from 'components/Toast/actions'
import * as actionTypes from "../actionTypes"

const APP_URL = process.env.REACT_APP_APP_URL;

export const HiringEventStart = () => {
    return {
        type: actionTypes.HIRING_EVENT_START,
    }
}

const HiringEventGetSuccess = (data, page, size, filters, sorter, activeFilters, activeSorter) => {
    return {
        type: actionTypes.HIRING_EVENT_GET_SUCCESS,
        data: data.data,
        active: page === "last" ? Math.ceil(data.pagination_data.total_count / 10 ): page,
        total: data.pagination_data.total_count,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
        activePage: page
    }
}

export const HiringEventDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.HIRING_EVENT_DELETE_SUCCESS,
        renderPage,
        id
    }
}
const HiringEventCreateSuccess = () => {   
    return {
        type: actionTypes.HIRING_EVENT_CREATE_SUCCESS,
        error : false,
    }
}

const HiringEventUpdateSuccess = (data) => {
    return {
        type: actionTypes.HIRING_EVENT_UPDATE_SUCCESS,
        data: data.data
    }
}


export const HiringEventError = (err, dispatch, getError=false) => {
    try {
        if (err.response) {
            dispatch(addToast('error', 'Error', err.response.data.message))
            return {
                type: actionTypes.HIRING_EVENT_ERROR,
                error: getError ? err.response.data.message : false
            }
        }
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.HIRING_EVENT_ERROR,
            error: getError ? (err.message || "Something went wrong, please try after sometime.") : false
        };
    } catch (error) {
        dispatch(addToast('error', 'Error', error.message))
        return {
            type: actionTypes.HIRING_EVENT_ERROR,
            error: getError ? error.message : false
        }
    }
}

export const getHiringEvent = (orgId, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `${APP_URL}/${orgId}/jobs/hiring_event?page=${page}&page_count=${size}`

    Object.keys(filters).map(item => {
        url += `&${item}__icontains=${filters[item]}`
        return null
    })

    if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(HiringEventStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(HiringEventGetSuccess(response.data, page, size, filters, sorter, activeFilters, activeSorter))
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(error => {
            dispatch(HiringEventError(error, dispatch))
        })
    }
}

export const createHiringEvent = (orgId, data, history, next) => {
    return dispatch => {
        dispatch(HiringEventStart())
        axios.post(`${APP_URL}/${orgId}/jobs/hiring_event`, data).then(response => {
            dispatch(addToast('success', 'Success', 'Event Added Successfully'))
            dispatch(HiringEventCreateSuccess(response.data))
            history.push(`/custom-workflow/org/${orgId}/event?page=${next}`)
        }).catch((err) => {
            dispatch(HiringEventError(err, dispatch))
        })
    }
}

export const editHiringEvent = (orgId, id, newData, history, next) => {
    return dispatch => {
        dispatch(HiringEventStart())
        let url = `${APP_URL}/${orgId}/jobs/hiring_event/${id}`
        axios.put(url, newData).then(response => {
            dispatch(addToast('success', 'Success', 'Event Edited Successfully'))
            dispatch(HiringEventUpdateSuccess(response.data))
            history.push(`/custom-workflow/org/${orgId}/event?page=${next}`)
        }).catch(err => {
            dispatch(HiringEventError(err, dispatch))
        })
    }
}

export const deleteHiringEvent = (orgId, eventId, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(HiringEventStart())
        axios.delete(`${APP_URL}/${orgId}/jobs/hiring_event/${eventId}`).then(() => {
            dispatch(addToast('success', 'Success', 'Event Deleted Successfully'))
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(HiringEventDeleteSuccess(eventId, isRenderRequired))
        }).catch(err => {
            dispatch(HiringEventError(err, dispatch))
        })
    }
}