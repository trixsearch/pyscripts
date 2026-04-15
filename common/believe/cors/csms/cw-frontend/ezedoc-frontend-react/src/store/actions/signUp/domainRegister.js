import * as actionTypes from "../actionTypes";
import datatype from "../../../Data/Createdata"

export const domainRegStart = () => {
  return {
    type: actionTypes.DOMAIN_REG_START
  }
}
export const domainRegSuccess = (domain_url, companyName) => {
  return {
    type: actionTypes.DOMAIN_REG_SUCCESS,
    domain_url: domain_url,
    companyName,
  };
};

export const domainRegFail = (error) => {
  return {
    type: actionTypes.DOMAIN_REG_ERROR,
    error: error
  };
};

export const domainRegister = (companyName,domainUrl) => {
  return dispatch => {
    dispatch(domainRegStart());
    const domain_url = [domainUrl, datatype.base_domain].join(".")
    dispatch(domainRegSuccess(domain_url, companyName));
  }

};
