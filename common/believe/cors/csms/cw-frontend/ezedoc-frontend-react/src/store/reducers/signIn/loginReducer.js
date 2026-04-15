import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    token: null,
    username: null,
    error: null,
    loading: false,
    message:null,
    id:null,
    authRedirect: false,
    involved_groups: [],
    workflow_permissions: {
    },
};

const authStart = ( state ) => {
    return updateObject( state, { error: null, loading: true } );
};

const authSuccess = (state, action) => {
    return updateObject( state, { 
        // token: action.props.token,
        id:action.props.id,
        error: null,
        loading: false,
        message:null,
        authRedirect:true,
        involved_groups: action.props.involved_groups,
        processFilter: action.props.processFilter,
        current_task_owner : action.props.current_task_owner ,
        notificationSupport: action.props.notificationSupport,
        dashboardView:action.props.dashboardView,
        workflow_permissions: action.props.workflow_permissions,
        show_completed_tasks: action.props.show_completed_tasks
     });

};

const authFail = (state, action) => {
    return updateObject( state, {
        message: action.error,
        loading: false
    });
};

const authLogout = (state) => {
    return updateObject(state, { token: null, username: null });
};

const authExpired = (state, action) => {
    return updateObject(state, {
        token: action.token,
     });
}

const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.AUTH_START: return authStart(state, action);
        case actionTypes.AUTH_SUCCESS: return authSuccess(state, action);
        case actionTypes.AUTH_ERROR: return authFail(state, action);
        case actionTypes.AUTH_LOGOUT: return authLogout(state, action);
        case actionTypes.SESSION_EXPIRED: return authExpired(state, action);
        case actionTypes.AUTH_CLEAR: return {...initialState};
        default:
            return state;
    }
};

export default reducer;