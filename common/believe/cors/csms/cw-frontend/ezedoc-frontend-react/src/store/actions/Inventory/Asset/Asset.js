import axios from "axios";

import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const AssetStart = () => {
    return {
        type: actionTypes.ASSET_START,
    }
}

const AssetGetSucces = (data, page, size, filters, sorter, activeFilters, activeSorter) => {    
     return {
        type: actionTypes.ASSET_GET_SUCCESS,
        data: data.data,
        paginationData: data.pagination_data,
        total: data.pagination_data.total_count,
        activePage: page,
        size,
        filters,
        sorter,
        activeFilters,
        activeSorter,
    }
}

const AssetCreateSuccess = () => {   
    return {
        type: actionTypes.ASSET_CREATE_SUCCESS,
        error : false,
    }
}

const AssetUpdateSuccess = (data) => {
    return {
        type: actionTypes.ASSET_UPDATE_SUCCESS,
        data: data.data
    }
}

const AssetDeleteSuccess = (id, renderPage) => {
    return {
        type: actionTypes.ASSET_DELETE_SUCCESS,
        renderPage,
        id
    }
}

const AssetError = (errorMessage, dispatch) => {
    if (errorMessage.response.data.message) {
        dispatch(addToast('error', 'Error', errorMessage.response.data.message))
      return {
        type: actionTypes.ASSET_ERROR,
      };
    } 
    let message = errorMessage.message || "Something went wrong, please try after sometime.";
    dispatch(addToast('error', 'Error', message))
    return {
        type: actionTypes.ASSET_ERROR,
    };
  };


export const getAsset = (page=1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    let url = `/api/inventory/asset?page=${page}&page_count=${size}`
        Object.keys(filters).map(item => {
            url += `&${item}__icontains=${filters[item]}`
            return null
        })

        if (sorter) url += `&ordering=${sorter}`
    return dispatch => {
        dispatch(AssetStart())
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(AssetGetSucces(response.data, page, size, filters, sorter, activeFilters, activeSorter));
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err => {
            dispatch(AssetError(err, dispatch))
        })
    }
}

export const createAsset = (data, history, next = 1) => {
    let setAsset = {
        name: data.name,
        descriptions: data.descriptions,
        // extra_fields: {}
    }
    return dispatch => {
        dispatch(AssetStart())
        axios.post(`/api/inventory/asset`, setAsset).then(response => {
            dispatch(addToast('success', 'Success', 'Asset Added Successfully'))
            dispatch(AssetCreateSuccess(response.data))
            history.push(`/inventory/asset?page=${next}`)
        }).catch((err) => {
            dispatch(AssetError(err, dispatch))
        })
    }
}

export const editAsset = (id, newData, history, next = 1) => {
    return dispatch => {
        dispatch(AssetStart())
        let url = `/api/inventory/asset/${id}`;      
        axios.patch(url ,newData).then(response => {
            dispatch(addToast('success', 'Success', 'Asset Edited Successfully'))
            dispatch(AssetUpdateSuccess(response.data))
            history.push(`/inventory/asset?page=${next}`)
        }).catch(err => {
            dispatch(AssetError(err, dispatch))
        })

    }
}

export const deleteAsset = (assetId, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(AssetStart())
        axios.delete(`/api/inventory/asset/${assetId}`).then(() => {
            dispatch(addToast('success', 'Success', 'Asset Deleted Successfully'))
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(AssetDeleteSuccess(assetId, isRenderRequired))
        }).catch(err => {
            dispatch(AssetError(err, dispatch))
        })
    }
}