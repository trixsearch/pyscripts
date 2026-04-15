import axios from 'axios'

import * as actionTypes from '../../actionTypes'
import { addToast } from '../../../../components/Toast/actions'

const KitStart = () => {
    return {
        type: actionTypes.KIT_START,
    }
}

const KitGetSuccess = (data, page, size, filters, sorter, activeFilters, activeSorter) => {
    return {
        type: actionTypes.KIT_GET_SUCCESS,
        data: data.data,
        paginationData: data.pagination_data,
        activePage: page,
        total: data.pagination_data.total_count,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
    }
}

const KitCreateSuccess = () => {
    return {
        type: actionTypes.KIT_CREATE_SUCCESS,
    }
}

const KitUpdateSuccess = (data) => {
    return {
        type: actionTypes.KIT_UPDATE_SUCCESS,
        data: data.data
    }
}

const KitDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.KIT_DELETE_SUCCESS,
        renderPage,
        id
    }
}

const KitError = (errorMessage, dispatch) => {
    if (errorMessage.response.data.message) {
        dispatch(addToast('error', 'Error', errorMessage.response.data.message))
        return {
            type: actionTypes.KIT_ERROR,
        }
    }
    let message = errorMessage.message || 'Something went wrong, please try after sometime.'
    dispatch(addToast('error', 'Error', message))
    return {
        type: actionTypes.KIT_ERROR,
    }
}

export const getKit = (page=1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `/api/inventory/kit?page=${page}&page_count=${size}`
        Object.keys(filters).map(item => {
            url += `&${item}__icontains=${filters[item]}`
            return null
        })

        if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(KitStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(KitGetSuccess(response.data, page, size, filters, sorter, activeFilters, activeSorter));
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err => {
            dispatch(KitError(err, dispatch))
        })
    }
}

export const createKit = (data, history) => {
    return dispatch => {
        dispatch(KitStart())
        axios.post('/api/inventory/kit', data).then(response => {
            dispatch(addToast('success', 'Success', 'Kit Added Successfully'))
            dispatch(KitCreateSuccess(response.data))
            history.push('/inventory/kit')
        }).catch((err) => {
            dispatch(KitError(err, dispatch))
        })
    }
}

export const editKit = (id, newData, history) => {
    return dispatch => {
        dispatch(KitStart())
        let url = `/api/inventory/kit/${id}`
        axios.patch(url, newData).then(response => {
            dispatch(addToast('success', 'Success', 'Kit Edited Successfully'))
            dispatch(KitUpdateSuccess(response.data))
            history.push('/inventory/kit')
        }).catch(err => {
            dispatch(KitError(err, dispatch))
        })
    }
}

export const deleteKit = (kitId, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(KitStart())
        axios.delete(`/api/inventory/kit/${kitId}`).then(() => {
            dispatch(addToast('success', 'Success', 'Kit Deleted Successfully'))
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(KitDeleteSuccess(kitId, isRenderRequired))
        }).catch(err => {
            dispatch(KitError(err, dispatch))
        })
    }
}