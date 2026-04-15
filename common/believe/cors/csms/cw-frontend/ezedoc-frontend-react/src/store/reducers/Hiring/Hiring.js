import {
    SET_LOADER,
    GET_HEADCOUNT,
    GET_TOP_SOURCE,
    GET_TOTAL_EVENTS,
    GET_APPLICANTS,
    GET_TOTAL_FILLED,
    GET_TOTAL_OPENINGS,
    GET_TOTAL_REMAINING,
} from 'store/actions/actionTypes'
import { updateObject } from 'store/reducers/utility'

const initialState = {
    loader: false,
    totalOpenings: 0,
    totalEvents: 0,
    totalFilled: 0,
    totalRemaining: 0,
    topSources: [],
    headCount: 0,
    applicants: 0
}

export default (state = initialState, action) => {
    switch (action.type) {
        case SET_LOADER:
        case GET_TOTAL_EVENTS:
        case GET_HEADCOUNT:
        case GET_TOP_SOURCE:
        case GET_TOTAL_FILLED:
        case GET_TOTAL_OPENINGS:
        case GET_APPLICANTS:
        case GET_TOTAL_REMAINING:
            return updateObject(state, { ...action })
        default:
            return state
    }
}
