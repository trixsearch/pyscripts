import axios from "axios";

import routes from "urls"
import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const SupplyStart = () => {
    return {
        type: actionTypes.SUPPLY_START,
    }
}

const SupplyGetSuccess = (data, page, size, filters, sorter, activeFilters, activeSorter) => {    
     return {
        type: actionTypes.SUPPLY_GET_SUCCESS,
        data: data.data,
        paginationData: data.pagination_data,
        activePage: page,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
    }
}

const SupplyCreateSuccess = () => {   
    return {
        type: actionTypes.SUPPLY_CREATE_SUCCESS,
    }
}

const SupplyUpdateSuccess = (renderPage = null) => {
    return {
        type: actionTypes.SUPPLY_UPDATE_SUCCESS,
        renderPage,
    }
}

const SupplyDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.SUPPLY_DELETE_SUCCESS,
        renderPage,
        id
    }
}

const SupplyError = (errorMessage, dispatch) => {
    if (errorMessage.response.data.message) {        
        dispatch(addToast('error', 'Error', errorMessage.response.data.message))
      return {
        type: actionTypes.SUPPLY_ERROR,
      };
    }
    let message = errorMessage.message || "Something went wrong, please try after sometime.";
    dispatch(addToast('error', 'Error', message))
    return {
        type: actionTypes.SUPPLY_ERROR,
    };

  };

export const getSupply = (page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `/api/inventory/supply?page=${page}&page_count=${size}`
    
    Object.keys(filters).map(item => {
        if (item === 'quantity') url += `&${item}=${filters[item]}`
        else url += `&${item}__icontains=${filters[item]}`
        return null
    })

    if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(SupplyStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(SupplyGetSuccess(response.data, page, size, filters, sorter, activeFilters, activeSorter))
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err => {
            dispatch(SupplyError(err, dispatch))
        })
    }
}

export const createSupply = (orgId, data, history, next = 1) => {
    let {
        asset, supplier, orderedAt, arrivedAt, quantity, checker, location 
    } = data
    quantity = Number(quantity)
    const setSupply = {
        asset: asset,
        supplier: supplier,
        ordered_at: orderedAt,
        arrived_at: arrivedAt,
        quantity,
        checker: checker,
        location

    }
    return dispatch => {
        dispatch(SupplyStart())
        axios.post(`/api/inventory/supply`, setSupply).then(response => {
            dispatch(addToast('success', 'Success', 'Supply Added Successfully'))
            dispatch(SupplyCreateSuccess(response.data))            
            history.push(routes.SUPPLY_LIST.to(orgId, next))
        }).catch(err => {
            dispatch(SupplyError(err, dispatch))
        })
    }
}

export const editSupply = (orgId, id, data, history, next = 1, renderPage = null) => {
    if("checked" in data) {        
        const url = `/api/inventory/check/${id}`
        return dispatch => {
            dispatch(SupplyStart())
            axios.patch(url ,data).then(() => {
                dispatch(addToast('success', 'Success', 'Supply Added to Stock'))
                dispatch(SupplyUpdateSuccess(`${renderPage}*`))
            }).catch(err => {
                dispatch(SupplyError(err, dispatch))
            })
        }
    }
    const url = `/api/inventory/supply/${id}`;
    return dispatch => {
        dispatch(SupplyStart())
        let {orderedAt, arrivedAt, ...newData} = data
        if(orderedAt) {
            newData.ordered_at = orderedAt
        }
        if(arrivedAt) {
            newData.arrived_at = arrivedAt
        }
        axios.patch(url ,newData).then(() => {
            dispatch(addToast('success', 'Success', 'Supply Edited Successfully'))
            dispatch(SupplyUpdateSuccess())
            history.push(routes.SUPPLY_LIST.to(orgId, next))
        }).catch(err => {
            dispatch(SupplyError(err, dispatch))
        })
    }    
 
}

export const deleteSupply = (supplyId, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(SupplyStart())
        axios.delete(`/api/inventory/supply/${supplyId}`).then(() => {
            dispatch(addToast('success', 'Success', 'Supply Deleted Successfully'))
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) <= expectedPage ? `${renderPage}*` : renderPage
            dispatch(SupplyDeleteSuccess(supplyId, isRenderRequired))
        }).catch(err => {
            dispatch(SupplyError(err, dispatch))
        })
    }
}