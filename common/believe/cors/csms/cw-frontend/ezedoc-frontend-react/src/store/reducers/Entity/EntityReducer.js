import {
  GET_ENTITY_LIST,
  ENTITY_LOADER,
  GET_ENTITY_SEARCH,
  ENTITY_SEARCH_CLEAR,
  ENTITY_ERROR,
  TOGGLE_ENTITY_SEARCH_BAR,
  SET_ENTITY_SEARCH,
} from "../../actions/actionTypes";
import { updateObject } from "../utility";

const initialState = {
  error: null,
  message: null,
  loader: false,
  data: [],
  head: [],
  active: 1,
  total: 1,
  searchQuery: {
    field: "",
    query: "",
  },
  searchData: null,
  searchResults: null,
  workflows: [],
  showSearchBar: true,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ENTITY_LOADER:
      return updateObject(state, {
        loader: true,
      });

    case GET_ENTITY_LIST:
      return updateObject(state, {
        loader: false,
        data: action.payload,
        workflows: action.workflows,
        active: action.active,
        total: action.total,
        error: false,
      });

    case GET_ENTITY_SEARCH:
      return updateObject(state, {
        loader: false,
        data: action.payload,
        active: action.active,
        total: action.total,
        searchQuery: action.searchQuery,
        error: false,
      });

    case SET_ENTITY_SEARCH:
      return updateObject(state, {
        searchQuery: action.searchQuery
      });

    case ENTITY_SEARCH_CLEAR:
      return updateObject(state, {
        searchQuery: {
          field: "",
          query: "",
        },
      });

    case ENTITY_ERROR:
      return updateObject(state, {
        error: action.error,
        message: action.message,
        loader: false,
      });

    case TOGGLE_ENTITY_SEARCH_BAR:
      return updateObject(state, {
        showSearchBar: action.showSearchBar
      });

    default:
      return state;
  }
};

export default reducer;
