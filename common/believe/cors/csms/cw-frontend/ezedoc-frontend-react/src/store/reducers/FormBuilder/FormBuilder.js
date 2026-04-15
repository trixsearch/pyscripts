import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loader: false,
    data : {},
    appData:{},
};
const formIoStart = (state, action) => {
    return updateObject( state, { 
    loader:true,
     });
};

const formIoSuccess = (state, action) => {
    return updateObject( state, { 
    error: null,
    loader:false,
    data:action.data

     });
};

const formIoFail = (state, action) => {
    return updateObject( state, {
        error: action.error,
        loader: false

    });
};


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.FORM_IO_START: return formIoStart(state, action);
        case actionTypes.FORM_IO_SUCCESS: return formIoSuccess(state, action);
        case actionTypes.FORM_IO_ERROR: return formIoFail(state, action);
                        
        default:
            return state;
    }
};

export default reducer;