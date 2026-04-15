import {
    JOB_PORTAL_GET_JOB,
    JOB_PORTAL_GET_JOBS,
    SET_JOB_PORTAL_LOADER,
    SET_JOB_PORTAL_LOCATIONS,
    JOB_PORTAL_GET_JOB_ROLES,
} from 'store/actions/actionTypes'
import { updateObject } from 'store/reducers/utility'
import {
    CITY_LIST,
    STATE_LIST,
    LOCATION_LIST,
    JOB_ROLE_LIST,
} from 'containers/Hiring/JobPortal/JobPortal'

const initialState = {
    loader: false,
    total: 0,
    job: {},
    jobs: [],
    states: [],
    cities: [],
    locations: [],
    jobRoles: [],
    filters: {},
    state: STATE_LIST[0],
    city: CITY_LIST[0],
    locationData: LOCATION_LIST[0],
    jobRole: JOB_ROLE_LIST[0],
}

export default (state = initialState, action) => {
    switch (action.type) {

        case JOB_PORTAL_GET_JOB:
        case JOB_PORTAL_GET_JOBS:
        case SET_JOB_PORTAL_LOADER:
        case SET_JOB_PORTAL_LOCATIONS:
        case JOB_PORTAL_GET_JOB_ROLES:
            return updateObject(state, { ...action })

        default:
            return state
    }
}
