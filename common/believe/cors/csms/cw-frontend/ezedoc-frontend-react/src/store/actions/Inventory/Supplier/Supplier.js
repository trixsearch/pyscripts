import axios from "axios";

import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const SupplierStart = () => {
    return {
        type: actionTypes.SUPPLIER_START,
    }
}

const SupplierGetSucces = (data, page, size, filters, sorter, activeFilters, activeSorter) => {    
     return {
        type: actionTypes.SUPPLIER_GET_SUCCESS,
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

const SupplierCreateSuccess = () => {   
    return {
        type: actionTypes.SUPPLIER_CREATE_SUCCESS,
    }
}

const SupplierUpdateSuccess = (data) => {
    return {
        type: actionTypes.SUPPLIER_UPDATE_SUCCESS,
        data: data.data
    }
}

const SupplierDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.SUPPLIER_DELETE_SUCCESS,
        renderPage,
        id
    }
}

const SupplierError = (errorMessage, dispatch) => {    
    if (errorMessage.response.data.message) {        
        dispatch(addToast('error', 'Error', errorMessage.response.data.message))
      return {
        type: actionTypes.SUPPLIER_ERROR,
      };
    } 
    let message = errorMessage.message || "Something went wrong, please try after sometime.";
    dispatch(addToast('error', 'Error', message))
    return {
        type: actionTypes.SUPPLIER_ERROR,
    };

  };


export const getSupplier = (page=1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `/api/inventory/supplier?page=${page}&page_count=${size}`
        Object.keys(filters).map(item => {
            url += `&${item}__icontains=${filters[item]}`
            return null
        })

        if (sorter) url += `&ordering=${sorter}`
    return dispatch => {
        dispatch(SupplierStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(SupplierGetSucces(response.data, page, size, filters, sorter, activeFilters, activeSorter));
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err => {
            dispatch(SupplierError(err, dispatch))
        })
    }
}

export const createSupplier = (data, history, next = 1) => {
    return dispatch => {
        dispatch(SupplierStart())
        axios.post(`/api/inventory/supplier`, data).then(response => {
            dispatch(addToast('success', 'Success', 'Supplier Added Successfully'))
            dispatch(SupplierCreateSuccess(response.data))
            history.push(`/inventory/supplier?page=${next}`)
        }).catch((err) => {
            dispatch(SupplierError(err, dispatch))
        })
    }
}
export const editSupplier = (id, data, history, next = 1) => {
    return dispatch => {
        dispatch(SupplierStart())
        let url = `/api/inventory/supplier/${id}`;        
        axios.patch(url ,data).then(response => {
            dispatch(addToast('success', 'Success', 'Supplier Edited Successfully'))
            dispatch(SupplierUpdateSuccess(response.data))
            history.push(`/inventory/supplier?page=${next}`)
        }).catch(err => {
            dispatch(SupplierError(err, dispatch))
        })

    }
}

export const deleteSupplier = (supplierId, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(SupplierStart())
        axios.delete(`/api/inventory/supplier/${supplierId}`).then(() => {
            dispatch(addToast('success', 'Success', 'Supplier Deleted Successfully'))
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(SupplierDeleteSuccess(supplierId, isRenderRequired))
        }).catch(err => {
            dispatch(SupplierError(err, dispatch))
        })
    }
}