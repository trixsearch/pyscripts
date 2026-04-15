import {
    GET_JOBS,
    EDIT_JOB,
    DELETE_JOB,
    SET_JOB_LOADER,
    JOB_ERROR
} from 'store/actions/actionTypes'
import { ITEMS_PER_PAGE } from 'Data/constants'
import { updateObject } from 'store/reducers/utility'

const initialState = {
    total: 0,
    jobs: [],
    loader: false,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: '-job_id',
    activeSorter: {},
    activeFilters: [],
    size2: ITEMS_PER_PAGE,
    filters2: {},
    sorter2: '-job_id',
    activeSorter2: {},
    activeFilters2: [],
}

const deleteJob = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        jobs: [...state.jobs.filter(supply => supply.id !== action.id)],
    })
}

export default (state = initialState, action) => {
    switch (action.type) {

        case GET_JOBS:
        case EDIT_JOB:
        case SET_JOB_LOADER:
        case JOB_ERROR:
            return updateObject(state, { ...action })

        case DELETE_JOB:
            return deleteJob(state, action)

        default:
            return state
    }
}
