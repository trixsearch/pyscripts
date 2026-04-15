import * as actionTypes from "../actionTypes";
import axios from "axios";



export const SignUpStart = () => {
  return {
    type: actionTypes.SIGNUP_START
  }
}
export const SignUpSuccess = (message) => {
  return {
    type: actionTypes.SIGNUP_SUCCESS,
    message: message
  };
};

export const SignUpFail = (error) => {
  return {
    type: actionTypes.SIGNUP_ERROR,
    error: error
  };
};



export const signUpAuth = (first,middle,last,email,domain_url, companyName, queryParams) => {
  return dispatch => {
    dispatch(SignUpStart());
    
    const autoSignUp = {
      middle_name: middle,
      first_name: first,
      last_name: last,
      domain_url:domain_url,
      email: email,
      name: companyName,
      ...queryParams,
    }
  
    const urlSignUp = '/api/organisations/'
    axios.post(urlSignUp, autoSignUp)
      .then(response => {
        dispatch(SignUpSuccess(response.data.message));
      }).catch(err => {
        if(err.response) {
          dispatch(SignUpFail(err.response.data.message))
        }
        else dispatch(SignUpFail("Failed to create organisation owner."))
      })
  }

};
