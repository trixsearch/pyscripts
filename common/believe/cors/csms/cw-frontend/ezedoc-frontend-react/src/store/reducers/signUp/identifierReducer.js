import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    count:null,
    checked:false,
    
};

const doaminStart = ( state, action ) => {
    return updateObject( state, { error: null, loading: true } );
};

const domainSuccess = (state, action) => {
    return updateObject( state, { 
        count:action.count,
        error: null,
        checked:true,
        loading: false
     });
};

const domainFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loading: false
    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.DOMAIN_START: return doaminStart(state, action);
        case actionTypes.DOMAIN_SUCCESS: return domainSuccess(state, action);
        case actionTypes.DOMAIN_ERROR: return domainFail(state, action);
        default:
            return state;
    }
};

export default reducer;