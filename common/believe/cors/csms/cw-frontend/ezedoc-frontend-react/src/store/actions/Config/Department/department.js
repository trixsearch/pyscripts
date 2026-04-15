import axios from "axios";

import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

export const DepartmentStart = () => {
    return {
        type: actionTypes.DEPARTMENT_START,
    }
}
export const DepartmentGetSuccess = (data, page, size, filters, sorter, activeFilters, activeSorter, extraColumns) => {    
    return {
        type: actionTypes.DEPARTMENT_GET,
        data: data.data,
        active: page,
        total: data.pagination_data.total_count,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
        extraColumns,
    }
}

export const DepartmentDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.DEPARTMENT_DELETE,
        renderPage,
        id
    }
}

export const DepartmentSuccess = (message) => {
    return {
        type: actionTypes.DEPARTMENT_SUCCESS,
        message: message

    }
}

const DepartmentError = (err, dispatch, getError=false) => {
    try {
        if (err.response) {
            dispatch(addToast('error', 'Error', err.response.data.message))
            return {
                type: actionTypes.DEPARTMENT_ERROR,
                error: getError ? err.response.data.message : false
            }
        }
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.DEPARTMENT_ERROR,
            error: getError ? (err.message || "Something went wrong, please try after sometime.") : false
        };
    } catch (error) {
        dispatch(addToast('error', 'Error', error.message))
        return {
            type: actionTypes.DEPARTMENT_ERROR,
            error: getError ? error.message : false
        }
    }
}

export const getDepartment = (orgId, page=1, size = 10, filters, sorter, activeFilters, activeSorter, extraColumns, history) => {
    let url = `${APP_URL}/${orgId}/departments/?page=${page}&page_count=${size}`
    Object.keys(filters).map(item => {
        if (item.includes('extra_fields')) {
            const matchedObj = extraColumns.find(column => `department__extra_fields__${column.key}` === item)
            if (matchedObj.type === 'string') url += `&${item}__icontains=${filters[item]}`
            if (matchedObj.type === 'number' || matchedObj.type === 'date') url += `&${item}=${filters[item]}`
        } else url += `&${item}__icontains=${filters[item]}`
        return null
    })
    if (sorter) url += `&ordering=${sorter}`
    return dispatch => {
        dispatch(DepartmentStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(DepartmentGetSuccess(response.data, page, size, filters, sorter, activeFilters, activeSorter, extraColumns));
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err => {
            dispatch(DepartmentError(err, dispatch, true))
        })
    }
}

export const deleteDepartment = (orgId, department_id, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(DepartmentStart())
        axios.delete(`${APP_URL}/${orgId}/departments/${department_id}`).then(() => {
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(DepartmentDeleteSuccess(department_id, isRenderRequired))
            dispatch(addToast('success', 'Success', 'A department has been deleted successfully'))
        }).catch(err => {
            dispatch(DepartmentError(err, dispatch))
        })
    }
}