import axios from "axios";

import { parseQueryString } from "containers/utils";
import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

const CustomDataLoader = () => ({
    type: actionTypes.CUSTOM_DATA_LOADER,
})

const CustomDataGet = (data, page,size, filters, sorter, activeFilters, activeSorter) => ({
    type: actionTypes.CUSTOM_DATA_GET,
    data: data.data,
    active: page,
    total: data.pagination_data.total_count,
    size,
    filters,
    sorter,
    activeFilters,
    activeSorter,
})

const CustomDataPost = (data) => ({
    type: actionTypes.CUSTOM_DATA_POST,
    data
})

const CustomDataEdit = (data) => ({
    type: actionTypes.CUSTOM_DATA_EDIT,
    data
})

const DeleteCustomList = (id, renderPage) => ({
    type: actionTypes.CUSTOM_DATA_DELETE,
    renderPage,
    id
})

const CustomDataError = (error, dispatch) => {
    let message = ""
    if (error.response) {
        try {
            let errorsObject = error.response.data.error;
            let [key] = Object.keys(errorsObject);
            message = errorsObject[key]
        } catch (e) {
            message = ""
        }
        dispatch(addToast('error', 'Error', error.response.data.message))
        return {
            type: actionTypes.CUSTOM_DATA_ERROR,
            error: error.response.data.message,
            message
        };
    } 
        dispatch(addToast('error', 'Error', error.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.CUSTOM_DATA_ERROR,
            error: error.message || "Something went wrong, please try after sometime.",
            message
        };
    
}

export const ListSearchSuccess = (data, searchItem, page) => {
    return {
        type: actionTypes.LIST_SEARCH, 
        total: data.pagination_data.total_count,
        data: data.data,
        searchItem,
        page
    }
}

export const clearListSearchResult = () => ({
    type : actionTypes.LIST_CLEAR_SEARCH
})


export const getCustomData = (orgId, page=1, size = 10, filters, sorter, activeFilters, activeSorter, history)=>{
    return dispatch => {
        dispatch(CustomDataLoader());
        let url = `${APP_URL}/${orgId}/lists/?page=${page}&page_count=${size}`
        Object.keys(filters).map(item => {
            
                url += `&${item}__icontains=${filters[item]}`
            
            return null
        })

        if (sorter) url += `&ordering=${sorter}`
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(CustomDataGet(response.data, page, size, filters, sorter, activeFilters, activeSorter));
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(err=>{
            dispatch(CustomDataError(err, dispatch))
        })
    }
}


export const postCustomData = (orgId, data, history) => async (dispatch) => {

    let postData = {
        name: data.name,
        key: data.key,
        list: data.list
    }
    try {
        dispatch(CustomDataLoader());

        let response = await axios.post(`${APP_URL}/${orgId}/lists/`, postData);
        dispatch(CustomDataPost(response.data.data))
        dispatch(addToast('success', 'Success', response.data.message))
        const { next = 1 } = parseQueryString(history.location.search);
        history.push(`/custom-workflow/org/${orgId}/config/lists?page=${next}`);
    } catch (error) {
        dispatch(CustomDataError(error, dispatch))
    }

}

export const editCustomData = (orgId, data, history) => async (dispatch) => {
    let postData = {
        name: data.name,
        key: data.key,
        list: data.list
    }

    try {
        dispatch(CustomDataLoader());

        let response = await axios.put(`${APP_URL}/${orgId}/lists/${data.id}`, postData);
        dispatch(CustomDataEdit(response.data.data))
        dispatch(addToast('success', 'Success', response.data.message))
        const { next = 1 } = parseQueryString(history.location.search);
        history.push(`/custom-workflow/org/${orgId}/config/lists?page=${next}`);
    } catch (error) {
        dispatch(CustomDataError(error, dispatch))
    }
}

export const deleteCustomDataList = (orgId, id, total, itemsPerPage, page, renderPage)=>{
    return dispatch =>{
        dispatch(CustomDataLoader())
        axios.delete(`${APP_URL}/${orgId}/lists/${id}`).then(() => {
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(DeleteCustomList(id, isRenderRequired))
            dispatch(addToast('success', 'Success', 'A list has been deleted successfully'))
        }).catch(err=>{
            dispatch(CustomDataError(err, dispatch))
        })
    }
}

export const searchLists = (orgId, searchItem, page = 1) => {
    return dispatch => {
        axios.get(`${APP_URL}/${orgId}/lists/?search=${searchItem}&page=${page}`)
        .then(res => {
            dispatch(ListSearchSuccess(res.data, searchItem , page));
        })
        .catch(err => {
            dispatch(CustomDataError(err, dispatch))
        })
    }
}

export const clearListSearch = () => {
    return dispatch => {
        dispatch(clearListSearchResult())
    }
}

export const setListsSearch = (searchItem) => {
    return (dispatch) => {
      dispatch({
        type: actionTypes.SET_CUSTOM_DATA_SEARCH,
        searchItem,
      });
    };
  };