import {
    GET_JOB,
    GET_JOB_CANDIDATES,
    GET_JOB_SLOTS,
    SET_JOB_VIEW_LOADER,
    CLEAR_JOB_CANDIDATES,
    CLEAR_JOB_SLOTS,
    SLOT_DELETE
} from 'store/actions/actionTypes'
import { ITEMS_PER_PAGE } from 'Data/constants'
import { updateObject } from 'store/reducers/utility'

const initialState = {
    total: 0,
    job: {},
    candidates: [],
    slots: [],
    loader: false,
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'candidateId',
    sorter1: 'id',
    activeSorter: {},
    activeFilters: [],
}

export default (state = initialState, action) => {
    switch (action.type) {

        case GET_JOB:
        case GET_JOB_CANDIDATES:
        case GET_JOB_SLOTS:
        case SET_JOB_VIEW_LOADER:
        case CLEAR_JOB_CANDIDATES:
        case CLEAR_JOB_SLOTS:
        case SLOT_DELETE:
            return updateObject(state, { ...action })

        default:
            return state
    }
}
