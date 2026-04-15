import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loader: false,
    data : [],
    length:1
};
const allAppsStart = (state, action) => {
    return updateObject( state, { 
    loader:true,
     });
};

const allAppsSuccess = (state, action) => {
    return updateObject( state, { 
    error: null,
    loader:false,
    data:action.data,
    length:action.data.length
     });
};

const allAppsFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loader: false

    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.ALL_START: return allAppsStart(state, action);
        case actionTypes.ALL_SUCCESS: return allAppsSuccess(state, action);
        case actionTypes.ALL_ERROR: return allAppsFail(state, action);
        default:
            return state;
    }
};

export default reducer;