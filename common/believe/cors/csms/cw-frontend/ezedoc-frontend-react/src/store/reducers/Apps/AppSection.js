import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loader: false,
    data : {},
    appData:{},
    id :1,
};
const appSectionStart = (state, action) => {
    return updateObject( state, { 
        loader:true,
    });
};

const appSectionSuccess = (state, action) => {
    return updateObject( state, { 
        error: null,
        loader:false,
        data:action.data
    });
};
const appSectionDeploy = (state, action) => {
    return updateObject( state, { 
        error: null,
        loader:false,
        appData:action.data
    });
};

const appSectionFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loader: false

    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.APP_SECTION_START: return appSectionStart(state, action);
        case actionTypes.APP_SECTION_COUNT: return appSectionSuccess(state, action);
        case actionTypes.APP_SECTION_ERROR: return appSectionFail(state, action);
        case actionTypes.APP_DEPLOY_SECTION_COUNT: return appSectionDeploy(state, action);
        
        default:
            return state;
    }
};

export default reducer;