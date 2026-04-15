import * as actionTypes from '../../actions/actionTypes';

const initialState = {
    clientVendorRelation: null,
    clientVendorRelationState: 'INIT',
}

const initState = () => {
    return initState;
}

  const getClientVendorRelation = (state, action) => {
    return {
        ...state,
        clientVendorRelation: action.payload,
        clientVendorRelationState: 'SUCCESS'
    }
  }

  const getClientVendorRelationLoading = (state) => {
    return {
        ...state,
        clientVendorRelationState: 'LOADING'
    }
  } 


const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.GET_CLIENT_VENDOR_RELATION: return getClientVendorRelation(state, action);
        case actionTypes.GET_CLIENT_VENDOR_RELATION_LOADING: return getClientVendorRelationLoading(state, action);
        default: return state;
    }
};

export default reducer;