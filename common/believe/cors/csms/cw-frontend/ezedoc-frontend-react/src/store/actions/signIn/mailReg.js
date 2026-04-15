import axios from "axios";
import * as actionTypes from "../actionTypes";

const APP_URL = process.env.REACT_APP_APP_URL;

export const emailStart = () => {
    return {
      type: actionTypes.EMAIL_REQ_START
    };
  }
  
  export const emailSuccess = (message) => {
    return {
      type: actionTypes.EMAIL_REQ_SUCCESS,
    message:message
    }
  }
  
  export const emailFail = (error) => {
    return {
      type: actionTypes.EMAIL_REQ_ERROR,
      error: error
    }
  }


  export const emailForPassword = (orgId, email) => {
    return dispatch => {
      dispatch(emailStart());

      const loginData = {
        email: email
      }

      axios.post(`${APP_URL}/${orgId}/users/org_users/send_reset_password_link`, loginData)
        .then(response => {
            dispatch(emailSuccess(response.data.message));
        })
        .catch(err => {
          dispatch(emailFail(err.response.data.message));
        });
    }
  }  