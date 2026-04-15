import * as actionTypes from './actionTypes';
import { updateObject } from './utility';

const initialState = {
  getTagTraverseState: 'INIT',
  getSubTagTraverseState: 'INIT',
  tagsArray: [],
  error: null,
};

const initState = () => initialState;

// TAGS LIST REDUCERS
const getTagsListLoading = (state) => updateObject(state, {
  getTagTraverseState: 'LOADING',
});

const getTagsListSuccess = (state, action) => updateObject(state, {
  getTagTraverseState: 'SUCCESS',
  tagsArray: action.tagsArray,
  error: null,
});

const getTagsListError = (state, action) => updateObject(state, {
  getTagTraverseState: 'ERROR',
  error: action.error,
});

// SUBTAGS LIST REDUCERS
const getSubTagsListLoading = (state) => updateObject(state, {
  getSubTagTraverseState: 'LOADING',
});

const getSubTagsListSuccess = (state, action) => updateObject(state, {
  getSubTagTraverseState: 'SUCCESS',
  tagsArray: action.tagsArray,
  error: null,
});

const getSubTagsListError = (state, action) => updateObject(state, {
  getSubTagTraverseState: 'ERROR',
  error: action.error,
});

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.INIT_STATE: return initState();

    case actionTypes.GET_TAG_TRAVERSE_LOADING: return getTagsListLoading(state, action);
    case actionTypes.GET_TAG_TRAVERSE_SUCCESS: return getTagsListSuccess(state, action);
    case actionTypes.GET_TAG_TRAVERSE_ERROR: return getTagsListError(state, action);

    case actionTypes.GET_SUBTAGS_TRAVERSE_LOADING: return getSubTagsListLoading(state, action);
    case actionTypes.GET_SUBTAGS_TRAVERSE_SUCCESS: return getSubTagsListSuccess(state, action);
    case actionTypes.GET_SUBTAGS_TRAVERSE_ERROR: return getSubTagsListError(state, action);

    default: return state;
  }
};

export default reducer;
