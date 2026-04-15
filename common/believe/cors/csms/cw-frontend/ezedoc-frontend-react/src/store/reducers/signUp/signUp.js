import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loader: false,
    domainCreated:false
};

const signUpStart = ( state, action ) => {
    return updateObject( state, { error: null, loader: true } );
};

const signUpSuccess = (state, action) => {
    return updateObject( state, { 
    error: null,
    loader:false,
    domainCreated:true,
    message:action.message
     });
};

const signUpFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loader: false

    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.SIGNUP_START: return signUpStart(state, action);
        case actionTypes.SIGNUP_SUCCESS: return signUpSuccess(state, action);
        case actionTypes.SIGNUP_ERROR: return signUpFail(state, action);
        default:
            return state;
    }
};

export default reducer;