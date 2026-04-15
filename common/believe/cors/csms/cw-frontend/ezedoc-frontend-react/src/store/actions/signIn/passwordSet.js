import axios from "axios";
import * as actionTypes from "../actionTypes";
import routes from "../../../urls";

const APP_URL = process.env.REACT_APP_APP_URL;

export const passwordStart = () => {
    return {
      type: actionTypes.PASSWORD_SET_START
    };
  }
  
  export const passwordSuccess = (message) => {
    return {
      type: actionTypes.PASSWORD_SET_SUCCESS,
      message:message
    }
  }
  
  export const passwordFail = (error) => {
    return {
      type: actionTypes.PASSWORD_SET_ERROR,
      error: error
    }
  }

  export const clearPswdSetMessage = () => {
    return {
      type: 'CLEAR_MESSAGE',
      message: null
    }
  }

  export const passwordSet = (orgId,password,id,token,history) => {
    return dispatch => {
      dispatch(passwordStart());
      const passwordData = {
        password: password
      }
      const url= routes.SET_PASSWORD.api(orgId,id,token)
      axios.post(url,passwordData)
        .then(response => {
            dispatch(passwordSuccess(response.data.message));
        })
        .catch(err => {
          dispatch(passwordFail(err.response.data.message));
        });
    }
  }
  //${uidb64}/${token}

  export const resetPwd = (orgId, data, CB) => {
    return dispatch => {
      axios.post(`${APP_URL}/${orgId}/users/org_users/change_password`, data)
        .then(response => {
            CB(response.data);
        })
        .catch(err => {
          CB(err.response.data);
        });
    }
  }
