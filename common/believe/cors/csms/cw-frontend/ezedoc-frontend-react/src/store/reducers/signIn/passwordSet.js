import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loading: false,
    redriect:false
};

const passwordSetStart = ( state, action ) => {
    return updateObject( state, { error: null, loading: true} );
};

const passwordSetSuccess = (state, action) => {
    return updateObject( state, { 
    error: null,
    loading:false,
    message:action.message,
    redriect:true

    });
};

const passwordSetFail = (state, action) => {
    return updateObject( state, {
        message: action.error,
        loading: false,
        redriect:false
    });
};

const clearMessage = (state, action) => {
    return updateObject(state, {
        message: action.message,
    })
}

const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.PASSWORD_SET_START: return passwordSetStart(state, action);
        case actionTypes.PASSWORD_SET_SUCCESS: return passwordSetSuccess(state, action);
        case actionTypes.PASSWORD_SET_ERROR: return passwordSetFail(state, action);
        case "CLEAR_MESSAGE": return clearMessage(state, action);
        default:
            return state;
    }
};

export default reducer;