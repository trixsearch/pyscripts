/* eslint-disable */
import axios from 'axios'

import {
    SET_LOADER,
    GET_HEADCOUNT,
    GET_TOP_SOURCE,
    GET_APPLICANTS,
    GET_TOTAL_EVENTS,
    GET_TOTAL_FILLED,
    GET_TOTAL_OPENINGS,
    GET_TOTAL_REMAINING,
} from 'store/actions/actionTypes'
import { addToast } from 'components/Toast/actions'

const APP_URL = process.env.REACT_APP_APP_URL;

let counter = 0

const setLoader = loader => ({
    type: SET_LOADER,
    loader,
})

const getTotalEventsAction = data => ({
    type: GET_TOTAL_EVENTS,
    totalEvents: data,
})

const getTopSourceAction = data => ({
    type: GET_TOP_SOURCE,
    topSources: data,
})

const getHeadcountAction = data => ({
    type: GET_HEADCOUNT,
    headCount: data,
})

const getTotalApplicantsAction = data => ({
    type: GET_APPLICANTS,
    applicants: data,
})

const getTotalFilledAction = data => ({
    type: GET_TOTAL_FILLED,
    totalFilled: data.remaining_positions__sum,
})

const getTotalOpeningsAction = data => ({
    type: GET_TOTAL_OPENINGS,
    totalOpenings: data?.total_positions__sum || 0,
})

const getTotalRemainingAction = data => ({
    type: GET_TOTAL_REMAINING,
    totalRemaining: data?.available_positions__sum || 0,
})

const errorHandler = error => dispatch => {
    if (error.response?.data.message) {
        dispatch(addToast('error', 'Error', error.response.data.message))
        dispatch(setLoader(false))
    }
    const message = error.message || 'Something went wrong, please try after sometime.'
    dispatch(addToast('error', 'Error', message))
    dispatch(setLoader(false))
}

const commonHandler = (orgId, queryParams, responseHandler, postData = {}) => {
    let url = `${APP_URL}/${orgId}/jobs/chart`

    if (queryParams) url += `?${queryParams}`

    return dispatch => {
        dispatch(setLoader(true))
        axios.post(url, postData)
            .then(response => {
                if (response.data.data) dispatch(responseHandler(response.data.data))
                else dispatch(responseHandler(0))
            })
            .catch(error => dispatch(errorHandler(error)))
            .finally(() => {
                counter -= 1
                if (counter === 0) dispatch(setLoader(false))
            })
    }
}

export const getTotalEvents = (orgId, postData = {}) => {
    counter += 1
    const queryParams = 'chartName=TotalEvents'
    return dispatch => dispatch(commonHandler(orgId, queryParams, getTotalEventsAction, postData))
}

export const getTopSource = (orgId, postData = {}) => {
    counter += 1
    const queryParams = 'chartName=TopSource'
    return dispatch => dispatch(commonHandler(orgId, queryParams, getTopSourceAction, postData))
}

export const getHeadcount = (orgId, postData = {}) => { 
    counter += 1
    const queryParams = 'chartName=HeadCount'
    return dispatch => dispatch(commonHandler(orgId, queryParams, getHeadcountAction, postData))
}

export const getTotalApplicants = (orgId, postData = {}) => { 
    counter += 1
    const queryParams = 'chartName=TotalApplicants'
    return dispatch => dispatch(commonHandler(orgId, queryParams, getTotalApplicantsAction, postData))
}

export const getTotalFilled = (orgId, postData = {}) => {
    counter += 1
    const queryParams = 'chartName=TotalFilled'
    return dispatch => dispatch(commonHandler(orgId, queryParams, getTotalFilledAction, postData))
}

export const getTotalOpenings = (orgId, postData = {}) => {
    counter += 1
    const queryParams = 'chartName=TotalOpening'
    return dispatch => dispatch(commonHandler(orgId, queryParams, getTotalOpeningsAction, postData))
}

export const getTotalRemaining = (orgId, postData = {}) => {
    counter += 1
    const queryParams = 'chartName=TotalRemaining'
    return dispatch => dispatch(commonHandler(orgId, queryParams, getTotalRemainingAction, postData))
}
