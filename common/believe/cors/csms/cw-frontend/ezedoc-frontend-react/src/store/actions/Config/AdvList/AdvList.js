import Axios from 'axios';

import * as actionTypes from '../../actionTypes';
import { addToast } from '../../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

const setAdvListLoaderState = (loader) => ({
    type: actionTypes.SET_ADVANCED_LIST_LOADER,
    loader
})

const getAdvListData = (data,activePage,size, filters, sorter, activeFilters, activeSorter) => {
  return {
    type: actionTypes.GET_ADVANCED_LIST_DATA,
    datas: data.data,
    totalCount: data.pagination_data.total_count,
    activePage,
    size,
    filters,
    sorter,
    activeFilters,
    activeSorter,
} 
}

const searchAdvListResults = (data, searchData, page) => ({
    type: actionTypes.SEARCH_ADVANCED_LIST,
    searchResult: data.data,
    totalCount: data.pagination_data.total_count,
    searchData,
    page
})

const clearAdvListSearchResults = () => ({
    type: actionTypes.CLEAR_ADVANCED_LIST_SEARCH,
    searchData: null,
    searchResult: null
})

export const setAdvListLoader = (loader) => dispatch => {
    dispatch(setAdvListLoaderState(loader));
}

 export const getAdvListDatas = (orgId, page = 1,size = 10, filters, sorter, activeFilters, activeSorter, history) => {
    return dispatch=>{
    dispatch(setAdvListLoader(true));
    
        let url = `${APP_URL}/${orgId}/lists/advanced?page=${page}&page_count=${size}`
    Object.keys(filters).map(item => {
        
            url += `&${item}__icontains=${filters[item]}`
        
        return null
    })

    if (sorter) url += `&ordering=${sorter}`
    Axios.get(url).then(response => {
        if (response.data.data && response.data.pagination_data) 
        dispatch(getAdvListData(response.data, page, size, filters, sorter, activeFilters, activeSorter));
        if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
            const total = response.data.total
            let nextPage
            if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
            else nextPage = Math.floor(total / 10)
            history.push({ pathname: '', search: `?page=${nextPage}` })
        }
    }).catch(()=>{
        dispatch(setAdvListLoader(false))
    })
}

}


export const searchAdvList = (orgId, searchData, page = 1) => dispatch => {
    dispatch(setAdvListLoader(true));
    Axios.get(`${APP_URL}/${orgId}/lists/advanced?search=${searchData}&page=${page}`)
        .then(response => dispatch(searchAdvListResults(response.data, searchData, page)))
        .catch(() => dispatch(addToast('error', 'Error', 'Something went wrong!')))
        .finally(() => dispatch(setAdvListLoader(false)))
}

export const clearAdvListSearch = () => dispatch => {
    dispatch(clearAdvListSearchResults())
}
