import * as actionTypes from './actionTypes';
import { updateObject } from './utility';

const initialState = {
  getDataState: 'INIT',
  data: {},
  error: null,
};

const initState = () => initialState;

// GET DATA REDUCERS
const getTagListLoading = (state) => updateObject(state, {
  getDataState: 'LOADING',
});

const getTagListSuccess = (state, action) => updateObject(state, {
  getDataState: 'SUCCESS',
  data: {
    [action.name]: action.tagList,
  },
  error: null,
});

const getTagListError = (state, action) => updateObject(state, {
  getDataState: 'ERROR',
  error: action.error,
});

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.INIT_STATE: return initState();

    case actionTypes.GET_TAG_LIST_LOADING: return getTagListLoading(state, action);
    case actionTypes.GET_TAG_LIST_SUCCESS: return getTagListSuccess(state, action);
    case actionTypes.GET_TAG_LIST_ERROR: return getTagListError(state, action);

    default: return state;
  }
};

export default reducer;
