import Axios from "axios";

import { addToast } from "components/Toast/actions";
import {
  GET_ENTITY_LIST,
  ENTITY_LOADER,
  GET_ENTITY_SEARCH,
  SET_ENTITY_SEARCH,
  ENTITY_SEARCH_CLEAR,
  ENTITY_ERROR,
  TOGGLE_ENTITY_SEARCH_BAR,
} from "../actionTypes";

const APP_URL = process.env.REACT_APP_APP_URL;

const handleError = (dispatch, err) => {
  let errorMessage = "Something went wrong, please try after sometime.";
  try {
    if (err.response) {
      errorMessage = err.response.data.message;
      dispatch(addToast("error", "Error", errorMessage));
      dispatch({
        type: ENTITY_ERROR,
        error: true,
        message:errorMessage,
      });
    } else{
      errorMessage = err.message || errorMessage;
      dispatch({
        type: ENTITY_ERROR,
        error: true,
        message:errorMessage,
      });
    }
  } catch (error) {
    dispatch(addToast("error", "Error", error.message));
    dispatch({
      type: ENTITY_ERROR,
      error: true,
      message:errorMessage,
    });
  }
};

export const getEntityList = (orgId, id, status="active", page = 1, size = 10, filters, sorter, history) => (dispatch) => {
  // /api/entity/master/data/get_all?get_config_data=true&masterModelID=ba7c8c89-71f1-46f2-a3ed-da50db5a827e&page=1
  let url = `${APP_URL}/${orgId}/entity/master/data/get_all?get_config_data=true&masterModelID=${id}&page=${page}&page_count=${size}`

  if (filters) {
    Object.keys(filters).map(item => {
      url += `&${item}=${filters[item]}`
      return null
    })
  }

  if (sorter) url += `&ordering=${sorter}`
  
  dispatch({
    type: ENTITY_LOADER,
  });
  Axios.post(url, {
    data : status,
  })
    .then((response) => {
      if(response.data.data && response.data.pagination_data) {
        dispatch({
          type: GET_ENTITY_LIST,
          payload: response.data.data,
          active: page,
          total: response.data.pagination_data.total_count,
          workflows: response.data.data.workflows,
        })
        return;
      }
      let lastPage = Math.ceil(response.data.total / 10) || 1;
      if (history) history.replace({ pathname: '', search: `?page=${lastPage}` })
    })
    .catch((err) => {
      handleError(dispatch, err);
    });
};

export const getEntitySearchList = (orgId, id, status="active", searchQuery, page = 1) => (
  dispatch
) => {
  
  dispatch({
    type: ENTITY_LOADER,
  });

  // /api/entity/master/data/get_all?get_config_data=true&masterModelID=ba7c8c89-71f1-46f2-a3ed-da50db5a827e&page=1
  Axios.post(`${APP_URL}/${orgId}/entity/master/data/get_all?get_config_data=true&masterModelID=${id}&page=${page}`, {
    data : status,
    search_key: searchQuery.field,
    search_value: searchQuery.query,
  })
    .then((res) => {
      dispatch({
        type: GET_ENTITY_SEARCH,
        payload: res.data.data,
        active: page,
        total: res.data.pagination_data
          ? res.data.pagination_data.total_count
          : 0,
        searchQuery: searchQuery,
      });
    })
    .catch((err) => {
      handleError(dispatch, err);
    });
};

export const setEntitySearch = (searchQuery) => (dispatch) => {
  dispatch({
    type: SET_ENTITY_SEARCH,
    searchQuery: searchQuery
  });
}

export const clearEntitySearch = () => (dispatch) => {
  dispatch({
    type: ENTITY_SEARCH_CLEAR,
  });
};

export const toggleEntitySearchBar = (showSearchBar) => (dispatch) => {
  dispatch({
    type: TOGGLE_ENTITY_SEARCH_BAR,
    showSearchBar: showSearchBar
  })
}