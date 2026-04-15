import axios from "axios";
import * as actionTypes from "../../actionTypes";

const APP_URL = process.env.REACT_APP_APP_URL;

export const allAppStart = () => {
  return {
    type: actionTypes.ALL_START
  };
};

export const allAppSuccess = (data) => {
  return {
    type: actionTypes.ALL_SUCCESS,
    data: data
  };
};

export const allAppsError = (error) => {
  return {
    type: actionTypes.ALL_ERROR,
    error: error
  };
};

export const AllApps = (orgId) => {
  return dispatch => {
    dispatch(allAppStart());
 
    axios.get(`${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`)
      .then(response => {
       
        dispatch(allAppSuccess(response.data.data));
      })
      .catch(err => {
        
        dispatch(allAppsError(err));
      });
  }

};
