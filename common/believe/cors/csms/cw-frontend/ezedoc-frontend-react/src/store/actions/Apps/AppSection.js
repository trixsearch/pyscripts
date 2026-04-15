import axios from "axios";
import * as actionTypes from "../actionTypes";

const APP_URL = process.env.REACT_APP_APP_URL;

export const AppSectionStart = () => {
  return {
    type: actionTypes.APP_SECTION_START
  }
}
export const AppSectionSuccess = (data) => {
  return {
    type: actionTypes.APP_SECTION_COUNT,
    data: data
  };
};
export const AppDeploySuccess = (data) => {
  return {
    type: actionTypes.APP_DEPLOY_SECTION_COUNT,
    data: data
  };
};

export const AppSectionFail = (error) => {
  return {
    type: actionTypes.APP_SECTION_ERROR,
    error: error
  };
};
export const AppSectionId = (id) => {
  return {
    type: actionTypes.APP_SECTION_ID,
    id: id
  };
};

export const AppSectionDetails = () => dispatch => new Promise((resolve, reject) => {
        dispatch(AppSectionStart())
        axios.get(`/api/categories/`)
          .then(response => {
              dispatch(AppSectionSuccess(response.data.data));
              resolve(response.data.data);
            })
          .catch(err => {
            dispatch(AppSectionFail(err.response.data));
            reject(err.response.data)
          });
  })


export const AppSelection = (id) => {
  return dispatch => {
    let url1 = `/api/categories/${id}`;
    dispatch(AppSectionStart())
    axios.get(url1)
      .then(response => {
        dispatch(AppDeploySuccess(response.data.data));
      })
      .catch(err => {
        dispatch(AppSectionFail(err.response.data));
      });
  }

};

export const AppInstall = (orgId, id, appId) => {
  return dispatch => {
    let data= {
      "app_registry" :id
    }
    let url1 = `${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`;
    dispatch(AppSectionStart())
    axios.post(url1,data)
      .then(() => {
        dispatch(AppSelection(appId))
      })
      .catch(err => {
        dispatch(AppSectionFail(err.response.data));
      });
  }

};