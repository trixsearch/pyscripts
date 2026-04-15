import axios from 'axios';
import { isEmpty } from 'lodash';
import { SEARCHED_TAGS } from '../../gtm-events';
import * as actionTypes from './actionTypes';


const CUST_MGMT = process.env.REACT_APP_CUSTOMER_MGMT_API_URL;

// Init State Action Dispatch
export const initState = () => (dispatch) => {
  dispatch({
    type: actionTypes.INIT_STATE,
  });
};

// Get DataList Action Dispatch
export const getTagList = (orgId, category, type, key, name, vendorId, clientId, usedIn, subVendorId, superClientId) => (dispatch, getState) => {
  dispatch({
    type: actionTypes.GET_TAG_LIST_LOADING,
  });
  let apiURL = CUST_MGMT;
  if (!isEmpty(vendorId)) {
    const additionalQuery = `${subVendorId ? `&subVendorId=${subVendorId}` : ''}`
    if (category && !type) {
      apiURL = `${apiURL}/org/${orgId}/shared/tags/search?vendorId=${vendorId}&category=${category}&key=${key}${additionalQuery}`;
    } else if (category && type) {
      apiURL = `${apiURL}/org/${orgId}/shared/tags/search?vendorId=${vendorId}&category=${category}&type=${type}&key=${key}${additionalQuery}`;
    } else if (!category && type) {
      apiURL = `${apiURL}/org/${orgId}/shared/tags/search?vendorId=${vendorId}&type=${type}&key=${key}${additionalQuery}`;
    } else {
      apiURL = `${apiURL}/org/${orgId}/shared/tags/search?vendorId=${vendorId}&key=${key}${additionalQuery}`;
    }
  } else if (!isEmpty(clientId)) {
    const additionalQuery = `${superClientId ? `&superClientId=${superClientId}` : ''}`
    if (category && !type) {
      apiURL = `${apiURL}/org/${orgId}/shared/tags/search?clientId=${clientId}&category=${category}&key=${key}${additionalQuery}`;
    } else if (category && type) {
      apiURL = `${apiURL}/org/${orgId}/shared/tags/search?clientId=${clientId}&category=${category}&type=${type}&key=${key}${additionalQuery}`;
    } else if (!category && type) {
      apiURL = `${apiURL}/org/${orgId}/shared/tags/search?clientId=${clientId}&type=${type}&key=${key}${additionalQuery}`;
    } else {
      apiURL = `${apiURL}/org/${orgId}/shared/tags/search?clientId=${clientId}&key=${key}${additionalQuery}`;
    }
  } else if (category && !type) {
    apiURL = `${apiURL}/org/${orgId}/tags/search?category=${category}&key=${key}`;
  } else if (category && type) {
    apiURL = `${apiURL}/org/${orgId}/tags/search?category=${category}&type=${type}&key=${key}`;
  } else if (!category && type) {
    apiURL = `${apiURL}/org/${orgId}/tags/search?&type=${type}&key=${key}`;
  } else {
    apiURL = `${apiURL}/org/${orgId}/tags/search?key=${key}`;
  }

  axios.get(apiURL)
    .then((response) => {
      if (response.status === 200 || response.status === 201) {
        if(usedIn === 'EmpList') {
          const state = getState();
          const event = {
              event: SEARCHED_TAGS,
              organisationName: state?.orgMgmt?.orgProfile?.data?.name,
              organisationId: state?.orgMgmt?.orgProfile?.data?.uuid,
              organisationIndustry: state?.orgMgmt?.orgProfile?.data?.industry,
              userName: state?.auth?.user?.email,
              userBpssID: state?.auth?.user?.userId,
              userEmailId: state?.auth?.user?.email,
              userEntityType: state?.auth?.user?.entityType,
              userEmployeeType: state?.auth?.user?.employeeType,
              userDefaultLocation: state?.auth?.user?.defaultLocation,
              userDefaultRole: state?.auth?.user?.defaultRole,
              userOtherLocation: state?.auth?.user?.sharedTags,
              userOtherRole: state?.auth?.user?.otherRole,
              userCustomTag: state?.auth?.user?.customTag,
              timestamp: Date(),
              searchedTagName: key
          };
          window?.dataLayer?.push(event);
        }
        dispatch({
          type: actionTypes.GET_TAG_LIST_SUCCESS,
          name,
          tagList: response.data,
        });
      }
    })
    .catch((error) => {
      let errMsg = error;
      if (error.response.data && error.response.data.errorMessage) {
        errMsg = error.response.data.errorMessage;
      }
      dispatch({
        type: actionTypes.GET_TAG_LIST_ERROR,
        error: errMsg,
      });
    });
};
