/* eslint-disable no-unused-vars */
import axios from 'axios'

import { addToast } from 'components/Toast/actions'
import * as actionTypes from "../actionTypes"

const APP_URL = process.env.REACT_APP_APP_URL;

export const PartnerStart = () => {
    return {
        type: actionTypes.HIRING_PARTNER_START,
    }
}

const PartnerGetSuccess = (data, page, size, filters, sorter, activeFilters, activeSorter) => {
    return {
        type: actionTypes.HIRING_PARTNER_GET_SUCCESS,
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

export const PartnerDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.HIRING_PARTNER_DELETE_SUCCESS,
        renderPage,
        id
    }
}
const PartnerCreateSuccess = () => {   
    return {
        type: actionTypes.HIRING_PARTNER_CREATE_SUCCESS,
        error : false,
    }
}

const PartnerUpdateSuccess = (data) => {
    return {
        type: actionTypes.HIRING_PARTNER_UPDATE_SUCCESS,
        data: data.data
    }
}


export const PartnerError = (err, dispatch, getError=false) => {
    try {
        if (err.response) {
            let message = err.response.data.message;
            // dispatch(addToast('error', 'Error', err.response.data.message))
            dispatch(addToast('error', 'Error', message || 'Vendor name must be unique'))
            return {
                type: actionTypes.HIRING_PARTNER_ERROR,
                error: getError ? err.response.data.message : false
            }
        }
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.HIRING_PARTNER_ERROR,
            error: getError ? (err.message || "Something went wrong, please try after sometime.") : false
        };
    } catch (error) {
        dispatch(addToast('error', 'Error', error.message))
        return {
            type: actionTypes.HIRING_PARTNER_ERROR,
            error: getError ? error.message : false
        }
    }
}

export const getPartner = (orgId, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `${APP_URL}/${orgId}/jobs/hiring_partner?page=${page}&page_count=${size}&partner_type=Hiring Agency`

    Object.keys(filters).map(item => {
        if(item === 'partner_subtype') {
            url += `&${item}=${filters[item]}`
        } else if(item === 'active') {
            let filterValue = (filters[item] === 'active')
            url += `&${item}=${filterValue}`
        } else if(item.includes('__gte')||item.includes('__lte')) {
            url += `&${item}=${filters[item]}`
        } else if(filters[item].split(',')?.length>1) {
            url += `&${item}__in=${filters[item]}`
        } else {
            url += `&${item}__icontains=${filters[item]}`
        }
        return null
    })
    if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(PartnerStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(PartnerGetSuccess(response.data, page, size, filters, sorter, activeFilters, activeSorter))
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(error => {
            dispatch(PartnerError(error, dispatch))
        })
    }
}

export const createPartner = (orgId, data, history, next) => {
    return dispatch => {
        dispatch(PartnerStart())
        axios.post(`${APP_URL}/${orgId}/jobs/hiring_partner`, data).then(response => {
            dispatch(addToast('success', 'Success', 'Partner Added Successfully'))
            dispatch(PartnerCreateSuccess(response.data))
            history.push(`/custom-workflow/org/${orgId}/partner?page=${next}`)
        }).catch((err) => {
            dispatch(PartnerError(err, dispatch))
        })
    }
}

export const editPartner = (orgId, id, newData, history, next) => {
    return dispatch => {
        dispatch(PartnerStart())
        let url = `${APP_URL}/${orgId}/jobs/hiring_partner/${id}`
        axios.put(url, newData).then(response => {
            dispatch(addToast('success', 'Success', 'Partner Edited Successfully'))
            dispatch(PartnerUpdateSuccess(response.data))
            history.push(`/custom-workflow/org/${orgId}/partner?page=${next}`)
        }).catch(err => {
            dispatch(PartnerError(err, dispatch))
        })
    }
}

export const deletePartner = (orgId, partnerId, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(PartnerStart())
        axios.delete(`${APP_URL}/${orgId}/jobs/hiring_partner/${partnerId}`).then(() => {
            dispatch(addToast('success', 'Success', 'Partner Deleted Successfully'))
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(PartnerDeleteSuccess(partnerId, isRenderRequired))
        }).catch(err => {
            dispatch(PartnerError(err, dispatch))
        })
    }
}