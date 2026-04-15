import Axios from "axios";
import { dispatch } from "store";

import { addToast } from "components/Toast/actions";
// import { TOKEN } from "../Data/constants";
import { SESSION_EXPIRED } from "./actions/actionTypes";


/**
 * Generic handler for all errors
 * @param {Object} action
 * @param {Error} action.error
 * @param {Object} action.payload
 * @param {String} action.type
 * @param {Boolean} action.showToast
 */

export const handleError = (action) => {
  const { 
    error, 
    type, 
    payload, 
    showToast
  } = action;

  // Axios Errors will have response
  if (error.response && error.response.status) {
    const errors =  Object.values(error.response.data.error);
    const ErrorMessage = error.response.data.message;
    // client errors
    if (error.response.status >= 400 && error.response.status <= 499) {
      // token expired or credentials not provided
      if (error.response.status === 401) {
        const Current_URL = window.location.pathname;

        //  * filter current path by removing '/org' which is a basePath,
        // eslint-disable-next-line no-unused-vars
        const Next_Path = Current_URL.substring(4);
        /* TODO: add `?next=${Next_Path}` to path
         * so that user can be redirected back there after logging in again.
         */

          dispatch(
            addToast(
              "error",
              "Your current Session has expired.",
              "Please Login again to continue."
            )
          );
        return dispatch({type: SESSION_EXPIRED, token: null, user: null});
      }
      if (showToast) {
        dispatch(addToast("error", "Error", errors.length ? errors[0] : ErrorMessage));
      }
      return dispatch({
        type,
        ...payload,
      });
    }
    // server errors
    if (error.response.status >= 500 && error.response.status <= 599) {
      if (showToast) {
        dispatch(addToast("error", "Error", ErrorMessage));
      }
      return dispatch({
        type,
        message: ErrorMessage,
        serverError: true,
        ...payload,
      });
    }
  }
  // Non XHR errors
  console.log(error);
  if (showToast) {
    dispatch(addToast("error", "There was an Error", error.message));
  }
  return dispatch({
    type,
    error: true,
    message: error.message,
    ...payload,
  });
};

const AuthenticatedAxios = Axios.create();

// TODO: to remove this interceptor
// AuthenticatedAxios.interceptors.request.use(
//   (config) => {
//     const USER_TOKEN = localStorage.getItem(TOKEN);
//     if (USER_TOKEN) {
//       config.headers.Authorization = `JWT ${USER_TOKEN}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

AuthenticatedAxios.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default AuthenticatedAxios;
