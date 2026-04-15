import * as actionTypes from "../actionTypes";
import axios from "axios";
import datatype from "../../../Data/Createdata"


// auth initiation action 
export const domainStart = () => {
  return {
    type: actionTypes.DOMAIN_START  
  };
}

export const domainSuccess = (count) => {
  return {
    type: actionTypes.DOMAIN_SUCCESS,
    count:count
  };
}

export const domainFail = (error) => {
  return {
    type: actionTypes.DOMAIN_ERROR,
    error: error
  };
}
// TODO : this api should return 0 and 1 ..If the domain is available 0 and domain is not available 1
export const DomainCheck = (data) => {
  return dispatch => {
    dispatch(domainStart());
    let domain_url = [data, datatype.base_domain].join(".");
    let url = `/api/organisations/?domain_url=${domain_url}`;
    axios.get(url)
      .then(response => {
          dispatch(domainSuccess(1));
        })
      .catch(err => { 
        if (err.response && err.response.status === 404){
          dispatch(domainSuccess(0));
        }
        else dispatch(domainFail("Something Went Wrong."))
      });
  }
}
