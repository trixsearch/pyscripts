import axios from "axios";

import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

export const LocationStart = () => {
    return {
        type: actionTypes.LOCATION_START,
    }
}
export const LocationGetSuccess = (data, page, size, filters, sorter, activeFilters, activeSorter, extraColumns) => {
    return {
        type: actionTypes.LOCATION_GET_SUCCESS,
        data: data.data.data,
        active: page === "last" ? Math.ceil(data.data.pagination_data.total_count / 10 ): page,
        total: data.data.pagination_data.total_count,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
        activePage: page,
        extraColumns,
    }
}

export const LocationDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.LOCATION_DELETE_SUCCESS,
        renderPage,
        id
    }
}

export const LocationHeadSuccess = (data) => {
    return {
        type: actionTypes.LOCATION_HEAD,
        data
    }
}

export const LocationSearchSuccess = (data, searchItem, page) => {
    return {
        type: actionTypes.LOCATION_SEARCH, 
        total: data.pagination_data.total_count,
        data: data.data,
        searchItem,
        page
    }
}

export const clearLocationSearchResult = () => ({
    type : actionTypes.LOCATION_CLEAR_SEARCH
})
    
export const LocationError = (err, dispatch, getError=false) => {
    try {
        if (err.response) {
            dispatch(addToast('error', 'Error', err.response.data.message))
            return {
                type: actionTypes.LOCATION_ERROR,
                error: getError ? err.response.data.message : false
            }
        }
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.LOCATION_ERROR,
            error: getError ? (err.message || "Something went wrong, please try after sometime.") : false
        };
    } catch (error) {
        dispatch(addToast('error', 'Error', error.message))
        return {
            type: actionTypes.LOCATION_ERROR,
            error: getError ? error.message : false
        }
    }
}

export const getLocation = (orgId, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, extraColumns, history) => {
    let url = `${APP_URL}/${orgId}/locations/?page=${page}&page_count=${size}`
    Object.keys(filters).map(item => {
        if (item.includes('extra_fields')) {
            const matchedObj = extraColumns.find(column => `extra_fields__${column.key}` === item)
            if (matchedObj.type === 'string') url += `&${item}__icontains=${filters[item]}`
            if (matchedObj.type === 'number' || matchedObj.type === 'date') url += `&${item}=${filters[item]}`
        } else url += `&${item}__icontains=${filters[item]}`
        return null
    })
    if (sorter) url += `&ordering=${sorter}`
    return dispatch => {
        dispatch(LocationStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(LocationGetSuccess(response, page, size, filters, sorter, activeFilters, activeSorter, extraColumns));
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err => {
            dispatch(LocationError(err, dispatch, true));
        })
    }
}

export const deleteLocation = (orgId, location_id, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(LocationStart())
        axios.delete(`${APP_URL}/${orgId}/locations/${location_id}`).then(() => {
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(LocationDeleteSuccess(location_id, isRenderRequired))
            dispatch(addToast('success', 'Success', 'A location has been deleted successfully'))
        }).catch(err => {
            dispatch(LocationError(err, dispatch))
        })
    }
}

export const setLocationSearch = (searchItem) => {
  return (dispatch) => {
    dispatch({
      type: "SET_LOCN_SEARCH",
      searchItem,
    });
  };
};

export const searchLocation = (orgId, searchItem, page = 1) => {
    return dispatch => {
        if (searchItem.length > 2) {
            dispatch(LocationStart());
            axios.get(`${APP_URL}/${orgId}/locations/?search=${searchItem}&page=${page}`)
            .then(res => {
                dispatch(LocationSearchSuccess(res.data, searchItem , page));
            })
            .catch(err => {
                dispatch(LocationError(err, dispatch, true))
            })
        }
    }
}

export const clearLocationSearch = () => {
    return dispatch => {
        dispatch(clearLocationSearchResult())
    }
}