import {
    GET_HEAD_COUNTS,
    SET_HEAD_COUNT_LOADER,
    SET_HEAD_COUNT_ROLE_LOCATION_DATA,
} from 'store/actions/actionTypes'
import { ITEMS_PER_PAGE } from 'Data/constants'
import { updateObject } from 'store/reducers/utility'

const initialState = {
    total: 0,
    total2: 0,
    loader: false,
    headcounts: [],
    headcounts2: [],
    size: ITEMS_PER_PAGE,
    size2: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'role__name',
    activeSorter: {},
    activeFilters: [],
    selectedData: [],
}

const getSelectedHeadCountList = (state, action) => {
    const selectedList = action.selectedData.map(id => state.headcounts.filter(item => item.id === id))
    const flattenArr = selectedList.flat()

    let modifiedArr = flattenArr.map(item => {
        const {
            created_at,
            id,
            location,
            location_name,
            role,
            role_name,
            updated_at,
            ...years
        } = item
        const returnObj = {
            created_at,
            id,
            location,
            location_name,
            role,
            role_name,
            updated_at,
        }

        Object.keys(years).forEach(year => {
            Object.keys(years[year]).forEach(month => {
                returnObj[`${year}-${month}`] = years[year][month].plan_count
            })
        })
        returnObj.key = id
        return returnObj
    })

    return updateObject(state, {
        selectedData: action.selectedData,
        headcounts2: modifiedArr,
        total2: modifiedArr.length,
    })
}

export default (state = initialState, action) => {
    switch (action.type) {

        case SET_HEAD_COUNT_LOADER:
            return updateObject(state, { ...action })

        case GET_HEAD_COUNTS:
            return updateObject(state, { ...action })

        case SET_HEAD_COUNT_ROLE_LOCATION_DATA:
            return getSelectedHeadCountList(state, action)

        default:
            return state
    }
}
