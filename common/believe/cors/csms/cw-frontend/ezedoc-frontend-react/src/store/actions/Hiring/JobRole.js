/* eslint-disable no-unused-vars */
import axios from 'axios'

import { addToast } from 'components/Toast/actions'
import * as actionTypes from "../actionTypes"

const APP_URL = process.env.REACT_APP_APP_URL;

export const JobRoleStart = () => {
    return {
        type: actionTypes.JOB_ROLE_START,
    }
}

const JobRoleGetSuccess = (data, page, size, filters, sorter, activeFilters, activeSorter) => {
    return {
        type: actionTypes.JOB_ROLE_GET_SUCCESS,
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

export const JobRoleDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.JOB_ROLE_DELETE_SUCCESS,
        renderPage,
        id
    }
}
const JobRoleCreateSuccess = () => {   
    return {
        type: actionTypes.JOB_ROLE_CREATE_SUCCESS,
        error : false,
    }
}

const JobRoleUpdateSuccess = (data) => {
    return {
        type: actionTypes.JOB_ROLE_UPDATE_SUCCESS,
        data: data.data
    }
}


export const JobRoleError = (err, dispatch, getError=false) => {
    try {
        if (err.response) {
            const errors = Object.values(err.response.data?.message);
            dispatch(addToast('error', 'Error',err.response.data.message))
            // dispatch(addToast('error', 'Error', errors.length ? errors[0] : err.response.data.message))
            return {
                type: actionTypes.JOB_ROLE_ERROR,
                error: getError ? err.response.data.message : false
            }
        }                    
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.JOB_ROLE_ERROR,
            error: getError ? (err.message || "Something went wrong, please try after sometime.") : false
        };
    } catch (error) {
        dispatch(addToast('error', 'Error', error.message))
        return {
            type: actionTypes.JOB_ROLE_ERROR,
            error: getError ? error.message : false
        }
    }
}

export const getJobRole = (orgId, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `${APP_URL}/${orgId}/jobs/role?page=${page}&page_count=${size}`

    Object.keys(filters).map(item => {
        url += `&${item}__icontains=${filters[item]}`
        return null
    })

    if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(JobRoleStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(JobRoleGetSuccess(response.data, page, size, filters, sorter, activeFilters, activeSorter))
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(error => {
            dispatch(JobRoleError(error, dispatch))
        })
    }
}

export const createJobRole = (orgId, data, history, next) => {
    return dispatch => {
        dispatch(JobRoleStart())
        axios.post(`${APP_URL}/${orgId}/jobs/role`, data).then(response => {
            dispatch(addToast('success', 'Success', 'Role Added Successfully'))
            dispatch(JobRoleCreateSuccess(response.data))
            history.push(`/custom-workflow/org/${orgId}/config/jobrole?page=${next}`)
        }).catch((err) => {
            dispatch(JobRoleError(err, dispatch))
        })
    }
}

export const editJobRole = (orgId, id, newData, history, next) => {
    return dispatch => {
        dispatch(JobRoleStart())
        let url = `${APP_URL}/${orgId}/jobs/role/${id}`
        axios.put(url, newData).then(response => {
            dispatch(addToast('success', 'Success', 'Role Edited Successfully'))
            dispatch(JobRoleUpdateSuccess(response.data))
            history.push(`/custom-workflow/org/${orgId}/config/jobrole?page=${next}`)
        }).catch(err => {
            dispatch(JobRoleError(err, dispatch))
        })
    }
}

export const deleteJobRole = (orgId, jobRoleId, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(JobRoleStart())
        axios.delete(`${APP_URL}/${orgId}/jobs/role/${jobRoleId}`).then(() => {
            dispatch(addToast('success', 'Success', 'Role Deleted Successfully'))
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(JobRoleDeleteSuccess(jobRoleId, isRenderRequired))
        }).catch(err => {
            dispatch(JobRoleError(err, dispatch))
        })
    }
}