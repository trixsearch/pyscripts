import { CLEAR_BGV_SEARCH, SET_BGV_SEARCH } from "store/actions/actionTypes";

const initialState = {
  query: "",
};

const BgvReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_BGV_SEARCH:
      return {
        ...state,
        query: action.query,
      };
    case CLEAR_BGV_SEARCH:
      return {
        ...state,
        query: "",
      };
    default:
      return state;
  }
};

export default BgvReducer;
