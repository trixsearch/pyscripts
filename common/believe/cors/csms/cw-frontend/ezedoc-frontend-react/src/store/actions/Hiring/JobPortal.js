import axios from 'axios'

import {
    JOB_PORTAL_GET_JOB,
    JOB_PORTAL_GET_JOBS,
    SET_JOB_PORTAL_LOADER,
    SET_JOB_PORTAL_LOCATIONS,
    JOB_PORTAL_GET_JOB_ROLES,
} from 'store/actions/actionTypes'
import { ITEMS_PER_PAGE } from 'Data/constants'
import { addToast } from 'components/Toast/actions'
import {
    CITY_LIST,
    STATE_LIST,
    LOCATION_LIST,
} from 'containers/Hiring/JobPortal/JobPortal'

const APP_URL = process.env.REACT_APP_APP_URL;

const setLoader = loader => ({
    type: SET_JOB_PORTAL_LOADER,
    loader,
})

const getLocations = (dataType, data) => ({
    type: SET_JOB_PORTAL_LOCATIONS,
    [dataType]: data
})

const getJobRoles = data => ({
    type: JOB_PORTAL_GET_JOB_ROLES,
    loader: false,
    jobRoles: data,
})

const getJobs = (data, filters, extraParams) => ({
    type: JOB_PORTAL_GET_JOBS,
    loader: false,
    jobs: data.data,
    total: data.pagination_data.total_count,
    filters,
    ...extraParams
})

const getJob = job => ({
    type: JOB_PORTAL_GET_JOB,
    loader: false,
    job,
})

const jobPortalError = (errorMessage, dispatch) => {
    if (errorMessage.response?.data.message) {
        dispatch(addToast('error', 'Error', errorMessage.response.data.message))
        dispatch(setLoader(false))
    }
    const message = errorMessage.message || 'Something went wrong, please try after sometime.'
    dispatch(addToast('error', 'Error', message))
    dispatch(setLoader(false))
}

export const fetchLocations = (orgId, dataType, state = null, city = null) => {
    let url = null
    switch (dataType) {
        case STATE_LIST[0].type:
            url = `${APP_URL}/${orgId}/locations/open?attribute=state`
            break
        case CITY_LIST[0].type:
            url = `${APP_URL}/${orgId}/locations/open?attribute=city&location__extra_fields__state=${state}`
            break
        case LOCATION_LIST[0].type:
            url = `${APP_URL}/${orgId}/locations/open?location__extra_fields__state=${state}&location__extra_fields__city=${city}`
            break
        default:
            break
    }
    return dispatch => {
        if (url) {
            axios.get(url)
                .then(response => {
                    if (response.data.data) {
                        const list = response.data.data.map((item, index) => ({
                            id: `${dataType}-${index + 1}`,
                            name: item,
                        }))
                        dispatch(getLocations(dataType, list))
                    }
                })
                .catch(error => dispatch(jobPortalError(error, dispatch)))
        }
    }
}

export const fetchJobRoles = (orgId) => {
    const url = `${APP_URL}/${orgId}/jobs/role`

    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url)
            .then(response => {
                if (response.data.data) dispatch(getJobRoles(response.data.data))
            })
            .catch(error => dispatch(jobPortalError(error, dispatch)))
    }
}

export const fetchJobs = (orgId, page, filters = {}, extraParams = {}, history = null) => {
    let url = `${APP_URL}/${orgId}/jobs/?page=${page}&page_count=${ITEMS_PER_PAGE}&status=Open`

    Object.keys(filters).forEach(item => {
        url += `&${item}=${filters[item]}`
    })

    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url)
            .then(response => {
                if (response.data.data && response.data.pagination_data) dispatch(getJobs(response.data, filters, extraParams))
                if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                    const total = response.data.total
                    let nextPage
                    if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                    else nextPage = Math.floor(total / 10)
                    history.push({ pathname: '', search: `?page=${nextPage}` })
                }
            })
            .catch(err => dispatch(jobPortalError(err, dispatch)))
    }
}

export const fetchJob = (orgId,id) => {
    const url = `${APP_URL}/${orgId}/jobs/${id}`

    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url)
            .then(response => {
                if (response.data.data) {
                    const response1 = response.data.data
                    const url2 = `${APP_URL}/${orgId}/jobs/role/${response1.role}`
                    dispatch(setLoader(true))
                    let roleResponse = {}
                    axios.get(url2)
                        .then(res => { roleResponse = res.data.data })
                        .catch(err => dispatch(jobPortalError(err, dispatch)))
                        .finally(() => {
                            const storeRes = {
                                ...response1,
                                description: roleResponse?.description || null,
                            }
                            dispatch(getJob(storeRes))
                        })
                }
            })
            .catch(err => dispatch(jobPortalError(err, dispatch)))
    }
}
