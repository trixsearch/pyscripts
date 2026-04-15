import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loader: false,
    data : [],
    appData:[],
    app:[],
    content:[]
};
const appSectionStart = (state, action) => {
    return updateObject( state, { 
    loader:true,
     });
};

const portalSuccess = (state, action) => {
    return updateObject( state, { 
    error: null,
    loader:false,
    data:action.data

     });
};
const portalUpdate = (state, action) => {
    return updateObject( state, { 
        data: [...state.data, action.data],
        loader : false,
     });
};
const portalDetail = (state, action) => {
    return updateObject( state, { 
    error: null,
    loader:false,
    appData:action.data

     });
};
const portalEdit = (state, action) => {
    return updateObject( state, { 
        data:action.data
     });
};
const  portalContent = (state, action) => {
    return updateObject( state, { 
       content:action.content
     });
};


const appSectionFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loader: false

    });
};
const AppDetail = (state, action) => {
    return updateObject( state, {
        app: action.app,
        loader: false

    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.PORTAL_START: return appSectionStart(state, action);
        case actionTypes.PORTAL_DETAILS: return portalSuccess(state, action);
        case actionTypes.PORTAL_EDIT: return portalEdit(state, action);
        case actionTypes.PORTALS_CREATE : return portalUpdate(state, action);
        case actionTypes.PORTALS_ERROR: return appSectionFail(state, action);
        case actionTypes.PORTAL_DETAIL : return portalDetail(state,action); 
        case actionTypes.APPS_LIST : return AppDetail(state,action); 
        case actionTypes.PORTAL_CONTENT: return portalContent(state,action); 
                     
        default:
            return state;
    }
};

export default reducer;