import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loading: false,
    success: false
};

const emailRegStart = ( state, action ) => {
    return updateObject( state, { error: null, loading: true } );
};

const emailRegSuccess = (state, action) => {
    return updateObject( state, { 
    error: null,
    loading:false,
    message:action.message,
    success :true
     });
};

const emailRegFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loading: false,
        success :false

    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.EMAIL_REQ_START: return emailRegStart(state, action);
        case actionTypes.EMAIL_REQ_SUCCESS: return emailRegSuccess(state, action);
        case actionTypes.EMAIL_REQ_ERROR: return emailRegFail(state, action);
        default:
            return state;
    }
};

export default reducer;