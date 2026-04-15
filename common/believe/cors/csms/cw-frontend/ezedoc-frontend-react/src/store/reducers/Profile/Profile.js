import * as actionTypes from "../../actions/actionTypes";
import { updateObject } from '../utility';

const initialState = {
    loader: false,
    profilePhoto: null,
    signaturePhoto:null,
    manager: null,
    employeeId: null,
    groupName : null,
    gender : null,
    firstName : null,
    middleName : null,
    lastName : null,
    involved_groups: [],
    entity_list: []
};
const profileStart =(state) => {
    return updateObject( state, { 
    loader:true,
     });
};
  
const profileSuccess = (state, action) => {
    
    return updateObject(state, {
        loader: false,
        profilePhoto: action.profilePhoto,
        signaturePhoto: action.signaturePhoto,
        manager: action.manager,
        employeeId : action.employeeId,
        groupName: action.groupName,
        gender : action.gender,
        firstName : action.firstName,
        middleName : action.middleName,
        lastName : action.lastName,
        mobile: action.mobile,
        involved_groups: action.involved_groups,
        dashboard_view: action.dashboard_view,
        entity_list: action.entity_list,
        entity_routes_match:  action.entity_routes_match
    });
};

const profileUpdateSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        mobile: action.mobile,
    });
};


const profileError = (state) => {
    return updateObject( state, { 
    loader:false,
     });
};
  

const profilePhotoUpdateSuccess = (state, action) => {
    // const randomQueryParam = `?random=${Math.random().toString(36).substring(7)}`
    let timestamp=`?${new Date().getTime()}`;
    return updateObject(state, {
        profilePhoto: action.props.display_picture + timestamp,
        loader: false,
        error: false,
    });
};

const signaturePhotoUpdateSuccess = (state, action) => {
    // const randomQueryParam = `?random=${Math.random().toString(36).substring(7)}`
    let timestamp=`?${new Date().getTime()}`;
    return updateObject(state, {
        signaturePhoto: action.props.signature + timestamp,
        loader: false,
        error: false,
    });
};

const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.PROFILE_START: return profileStart(state, action);
        case actionTypes.PROFILE_SUCCESS: return profileSuccess(state, action);
        case actionTypes.PROFILE_ERROR: return profileError(state, action);
        case actionTypes.PROFILEPHOTO_UPDATE_SUCCESS: return profilePhotoUpdateSuccess(state, action);
        case actionTypes.PROFILEUPDATE_SUCCESS: return profileUpdateSuccess(state, action);
        case actionTypes.SIGNATUREPHOTO_UPDATE_SUCCESS: return signaturePhotoUpdateSuccess(state, action);
        default:
            return state;
    }
};

export default reducer;
