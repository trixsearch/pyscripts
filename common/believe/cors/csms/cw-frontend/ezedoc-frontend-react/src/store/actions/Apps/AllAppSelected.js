import axios from "axios";

import * as actionTypes from "../actionTypes";

const APP_URL = process.env.REACT_APP_APP_URL;

export const AppListStart = () => {
  return {
    type: actionTypes.APP_LIST_START
  }
}
export const AppListSuccess = (data) => {
  return {
    type: actionTypes.APP_LIST_COUNT,
    data: data
  };
};


export const AppListFail = (error) => {
  return {
    type: actionTypes.APP_LIST_ERROR,
    error: error
  };
};


export const AppListDetails = (orgId) => {
  return dispatch => {
    return new Promise((resolve, reject) => {
      dispatch(AppListStart())
      axios
        .get(`${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`)
      .then(response => {
          dispatch(AppListSuccess(response.data.data));
          return resolve();
      })
      .catch(err => {
          dispatch(AppListFail(err.response.data));
          return reject();
      });
      })
  }
};