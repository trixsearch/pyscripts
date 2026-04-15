import axios from "axios";

import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

export const GroupPending = () => {
    return {
        type : actionTypes.GROUP_LOADER
    }
}
export const GroupsGet= (groups, page, size, filters, sorter, activeFilters, activeSorter)=>{
    return{
        type: actionTypes.GROUP_GET,
        groups: groups.data,
        total: groups.pagination_data.total_count,
        active: page,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
    }
}

export const GroupsDelete= (id, renderPage)=>{
    return{
        type:actionTypes.GROUP_DELETE,
        renderPage,
        id
    }
}

export const GroupsSuccess= (message)=>{
    return{
        type:actionTypes.GROUP_SUCCESS,
        message:message
    }
}

export const GroupsError = (err, dispatch, getError=false) => {
    try {
        if (err.response) {
            dispatch(addToast('error', 'Error', err.response.data.message))
            return {
                type: actionTypes.GROUP_ERROR,
                error: getError ? err.response.data.message : false
            }
        }
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.GROUP_ERROR,
            error: getError ? (err.message || "Something went wrong, please try after sometime.") : false
        };
    } catch (error) {
        dispatch(addToast('error', 'Error', error.message))
        return {
            type: actionTypes.GROUP_ERROR,
            error: getError ? error.message : false
        }
    }
}
export const groupSearchSuccess = (data, searchItem, page) => {
    return {
        type: actionTypes.GROUP_SEARCH, 
        total: data.pagination_data.total_count,
        data: data.data,
        searchItem,
        page
    }
}

export const clearGroupSearchResult = () => ({
    type : actionTypes.CLEAR_GROUP_SEARCH
})

export const getGroups = (orgId, page=1, size = 10, filters, sorter, activeFilters, activeSorter, history)=>{
    return dispatch => {
        dispatch(GroupPending())
        let url = `${APP_URL}/${orgId}/groups/?page=${page}&page_count=${size}`
        Object.keys(filters).map(item => {
            if(item ==='users__email') {
                url += `&search=${filters[item]}&${item}_only`
            } else{
                url += `&${item}__icontains=${filters[item]}`
            }
            return null
        })

        if (sorter) url += `&ordering=${sorter}`
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(GroupsGet(response.data, page, size, filters, sorter, activeFilters, activeSorter));
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err=>{
            dispatch(GroupsError(err, dispatch, true))
        })
    }
}

export const deleteGroup = (orgId, id, total, itemsPerPage, page, renderPage)=>{
    return dispatch =>{
        dispatch(GroupPending())
        axios.delete(`${APP_URL}/${orgId}/groups/${id}`).then(() => {
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(GroupsDelete(id, isRenderRequired))
            dispatch(addToast('success', 'Success', 'A group has been deleted successfully'))
        }).catch(err=>{
            dispatch(GroupsError(err, dispatch))
        })
    }
}


export const searchGroups = (orgId, searchItem, page = 1) => {
    return dispatch => {
        axios.get(`${APP_URL}/${orgId}/groups?search=${searchItem}&page=${page}`)
        .then(res => {
            dispatch(groupSearchSuccess(res.data, searchItem , page));
        })
        .catch(err => {
            dispatch(GroupsError(err, dispatch, true))
        })
    }
}

export const clearGroupSearch = () => {
    return dispatch => {
        dispatch(clearGroupSearchResult())
    }
}

export const setGroupSearch = (query) => {
    return dispatch => {
        dispatch({
            type: actionTypes.SET_GROUP_SEARCH,
            query
        })
    }
}