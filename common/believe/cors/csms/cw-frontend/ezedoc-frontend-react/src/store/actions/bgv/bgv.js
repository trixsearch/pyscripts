import { CLEAR_BGV_SEARCH, SET_BGV_SEARCH } from "../actionTypes";

export const setBgvSearch = (query) => (dispatch) => {
  return dispatch({
    type: SET_BGV_SEARCH,
    query: query,
  });
};

export const clearBgvSearch = () => (dispatch) => {
  return dispatch({
    type: CLEAR_BGV_SEARCH,
    query: "",
  });
};
