import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loader: false,
    data : [],
    appData:[],
    id :1
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
const ContentUpdate = (state, action) => {
    return updateObject(state, {
            data: [...state.data, action.data],
            loader : false,
        })
}
const portalUpdate = (state, action) => {
    return updateObject( state, { 
    error: null,
    loader:false,
    appData:action.data

     });
};

const ContentDelete = (state, action) => {

    return updateObject( state, { 
        data: [...state.data.filter(content => content.id !== action.data)],
        error: null,
        loader:false,
     });
};

const portalEdit = (state, action) => {
        return updateObject(state, {
            data: [...state.data.map(content => {
            if (content.id === action.data.id)
                  return action.data
                return content
            })],
            loader: false,
            message: action.message,
            error: null
            })
};

const appSectionFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loader: false

    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.CONTENT_START: return appSectionStart(state, action);
        case actionTypes.CONTENT_DETAILS: return portalSuccess(state, action);
        case actionTypes.CONTENT_EDIT: return portalEdit(state,action);
        case actionTypes.CONTENT_CREATE : return portalUpdate(state, action);
        case actionTypes.CONTENT_ERROR: return appSectionFail(state, action);
        case actionTypes.CONTENT_DETAIL : return ContentUpdate(state,action);   
        case actionTypes.CONTENT_DELETE : return ContentDelete(state,action);  
        default:
            return state;
    }
};

export default reducer;