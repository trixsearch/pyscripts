import axios from 'axios';
import { cloneDeep, isEmpty } from 'lodash';
import * as actionTypes from './actionTypes';
import { insertItemInArray, removeItemsInArray } from './utility';

const CUST_MGMT = process.env.REACT_APP_CUSTOMER_MGMT_API_URL;

// Init State Action Dispatch
export const initState = () => (dispatch) => {
  dispatch({
    type: actionTypes.INIT_STATE,
  });
};

// Get TagList Action Dispatch
export const getTagTraverse = (orgId, category, sharedTagQuery) => (dispatch) => {
  dispatch({
    type: actionTypes.GET_TAG_TRAVERSE_LOADING,
  });

  let apiURL = `${CUST_MGMT}/org/${orgId}`;
  if (!isEmpty(sharedTagQuery)) {
    apiURL = `${apiURL}/shared/tag${sharedTagQuery}&category=${category}`;
  } else {
    apiURL = `${apiURL}/tag?category=${category}`;
  }
  axios.get(apiURL)
    .then((response) => {
      if (response.status === 200 || response.status === 201) {
        const updatedTagArray = [{
          selectedId: null,
          selectedTag: null,
          tagId: null,
          tagType: response.data.type,
          tagList: cloneDeep(response.data.tagList),
        }];
        dispatch({
          type: actionTypes.GET_TAG_TRAVERSE_SUCCESS,
          tagsArray: updatedTagArray,
        });
      }
    })
    .catch((error) => {
      let errMsg = error;
      if (error.response.data && error.response.data.errorMessage) {
        errMsg = error.response.data.errorMessage;
      }
      dispatch({
        type: actionTypes.GET_TAG_TRAVERSE_ERROR,
        error: errMsg,
      });
    });
};

// Get SubTagList Action Dispatch
export const getSubTagTraverse = (arrayIndex, tagId, tagName, orgId,
  category, sharedTagQuery) => (dispatch, getState) => {
  dispatch({
    type: actionTypes.GET_SUBTAGS_TRAVERSE_LOADING,
  });
  let apiURL = `${CUST_MGMT}/org/${orgId}`;
  if (!isEmpty(sharedTagQuery)) {
    apiURL = `${apiURL}/shared/tag/${tagId}/subtag${sharedTagQuery}&category=${category}`;
  } else {
    apiURL = `${apiURL}/tag/${tagId}/subtag?category=${category}`;
  }
  axios.get(apiURL)
    .then((response) => {
      if (response.status === 200 || response.status === 201) {
        let updatedTagArray = cloneDeep(getState().tagTraverse.tagsArray);
        if (response.data.tagList.length !== 0) {
          updatedTagArray[arrayIndex].selectedId = tagId;
          updatedTagArray[arrayIndex].selectedTag = tagName;
          updatedTagArray = removeItemsInArray(updatedTagArray, arrayIndex);
          const newArrayItem = {
            selectedId: null,
            selectedTag: null,
            tagId,
            tagType: response.data.type,
            tagList: response.data.tagList,
          };
          updatedTagArray = insertItemInArray(updatedTagArray, newArrayItem);
        }
        dispatch({
          type: actionTypes.GET_SUBTAGS_TRAVERSE_SUCCESS,
          tagsArray: updatedTagArray,
        });
      }
    })
    .catch((error) => {
      let errMsg = error;
      if (error.response.data && error.response.data.errorMessage) {
        errMsg = error.response.data.errorMessage;
      }
      dispatch({
        type: actionTypes.GET_SUBTAGS_TRAVERSE_ERROR,
        error: errMsg,
      });
    });
};
