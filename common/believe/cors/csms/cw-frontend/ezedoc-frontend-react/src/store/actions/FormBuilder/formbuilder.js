import axios from "axios";

import { handleRedirect , parseQueryString } from "containers/utils";
import * as actionTypes from "../actionTypes";
import { addToast } from '../../../components/Toast/actions';
// import base_url from "../../../../config/dev"

const APP_URL = process.env.REACT_APP_APP_URL;

export const formIoAppStart = () => {
  return {
    type: actionTypes.FORM_IO_START
  };
};

export const formIoAppSuccess = (data) => {
  return {
    type: actionTypes.FORM_IO_SUCCESS,
    data: data
  };
};

export const formIoAppsError = (error) => {
  return {
    type: actionTypes.FORM_IO_ERROR,
    error: error
  };
};

export const formIoStore = (orgId, schema, id) => {
  return dispatch => {
    let data = { "content": schema }
    dispatch(formIoAppStart());
    let redirect_url = handleRedirect(window.location.href,window.location.hash)
    axios.put(`${APP_URL}/${orgId}/forms/${id}`, data)
      .then(() => {
        window.location.href = redirect_url
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.log(err);
      });
  }

};
export const formIoEdit = (orgId) => dispatch => new Promise((resolve, reject) => {
    dispatch(formIoAppStart());
    let queryparams = parseQueryString(window.location.href)
    let key = queryparams.key
    let promsise = []
  promsise.push(axios.get(`${APP_URL}/${orgId}/forms/modeler/${key}`))
  promsise.push(axios.get(`${APP_URL}/${orgId}/forms/?key=${key}`))
    axios.all(promsise)
      .then(res => {
        let data = []
         data.push(res[0].data.data)
         data.push(res[1].data)
         resolve(data);
      })
      .catch(err => {
        dispatch(formIoAppsError(err));
        reject(err)
      });
  })


export const formIoVersioning = (orgId, schema, dataContent,formStructure) => {
  return dispatch => {
    let data = {
      "content": schema,
      "name": dataContent.name,
      "description": dataContent.description,
      "key": dataContent.key_value
    }
    dispatch(formIoAppStart());
    axios.post(`${APP_URL}/${orgId}/forms/`, data)
      .then(()=> {
        dispatch(addToast('success', 'Success', 'Form Updated Successfully'))
        formStructure()
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.log(err);
      });
  }

};

export const formIoStoreVersion = (orgId, schema, dataContent) => {
  return dispatch => {
    let data = {
      "content": schema,
      "name": dataContent.name,
      "description": dataContent.description,
      "key": dataContent.key_value
    }
    dispatch(formIoAppStart());
    axios.put(`${APP_URL}/${orgId}/forms/${dataContent.id}`, data)
      .then(() => {
        dispatch(addToast('success', 'Success', 'Form Updated Successfully'))
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.log(err);
      });
  
      }  

};