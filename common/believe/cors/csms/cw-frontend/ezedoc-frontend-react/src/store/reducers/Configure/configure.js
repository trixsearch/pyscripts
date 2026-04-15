import * as actionTypes from "../../actions/actionTypes";
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message:null,
    loader: false,
    data :[]
};
const configStart =(state, action) => {
    return updateObject( state, { 
    loader:true,
     });
};
  
const configSuccess = (state, action) => {
   
    return updateObject( state, { 
    loader:false,
    data:action.data,
    });
};
  
const configError = (state, action) => {
    return updateObject( state, { 
    loader:true,
     });
};
  


const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.CONFIGURE_START: return configStart(state, action);
        case actionTypes.CONFIGURE_SUCCESS: return configSuccess(state, action);
        case actionTypes.CONFIGURE_ERROR: return configError(state, action);
        
        default:
            return state;
    }
};

export default reducer;
