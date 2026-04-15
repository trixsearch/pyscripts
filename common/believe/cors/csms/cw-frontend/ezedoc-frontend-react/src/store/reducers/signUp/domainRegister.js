import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loader: false,
    domain_url:null,
    ownerSignupPage: false,
};

const domainRegStart = ( state, action ) => {
    return updateObject( state, { error: null, loading: true } );
};

const domainRegSuccess = (state, action) => {
    return updateObject( state, { 
    error: null,
    loader:false,
    domain_url:action.domain_url,
    companyName: action.companyName,
    ownerSignupPage: true
     });
};

const domainRegFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loader: false

    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.DOMAIN_REG_START: return domainRegStart(state, action);
        case actionTypes.DOMAIN_REG_SUCCESS: return domainRegSuccess(state, action);
        case actionTypes.DOMAIN_REG_ERROR: return domainRegFail(state, action);
        default:
            return state;
    }
};

export default reducer;