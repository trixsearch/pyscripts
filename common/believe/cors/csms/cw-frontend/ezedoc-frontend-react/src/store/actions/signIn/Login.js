import axios from "axios";

import * as actionTypes from "../actionTypes";
import * as constants from "../../../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

export const authStart = () => {
  return {
    type: actionTypes.AUTH_START
  };
}

export const authSuccess = (response_data) => {
  return {
    type: actionTypes.AUTH_SUCCESS,
    props: response_data,
  }
}

export const authFail = (error) => {
  return {
    type: actionTypes.AUTH_ERROR,
    error: error
  }
}

export const authLogout = () => {
  const themeInfo = localStorage.getItem(constants.THEME_CONTROLLER);
  localStorage.clear();
  localStorage.setItem(constants.THEME_CONTROLLER, themeInfo);
  
  return {
    type: actionTypes.AUTH_LOGOUT
  }
}


export const checkAuthTimeout = () => {
  return dispatch => {
    setTimeout(() => {
      dispatch(authLogout())
    }, 300000 * 1000);
  }
}

export const getAuthUserById = (orgId, userId, CB = () => {}) => {
  return (dispatch) => {
    dispatch(authStart());
    axios
      .get(`${APP_URL}/${orgId}/users/org_users?userId=${userId}`)
      .then((response) => {
                let response_data = {
          id: response.data.data.id,
          involved_groups: response.data.data.involved_groups,
          processFilter: response.data.data.process_filter,
          current_task_owner: {...response.data.data, userId: userId},
          notificationSupport: response.data.data.support_notification,
          dashboardView: response.data.data.dashboard_view,
          workflow_permissions: response.data.data.workflow_permissions || {},
          show_completed_tasks: response.data.data.show_completed_tasks
        };
        // if (uiPermissions.masterrecords.manage) {
        //   axios.get(`${APP_URL}/${orgId}/entity/master`).then((entity) => {
        //     let list = entity.data.data.filter(master=> master.model_type === "entities")
        //     let entity_list =list && list.map((item) => {
        //       let entity_search_fields = [];
        //       if(item.search_fields && item.keyvaluepair) {
        //         entity_search_fields = item.search_fields
        //         .filter(field => item.keyvaluepair[field])
        //         .map((field) => {
        //             if(item.keyvaluepair[field]) {
        //               return {
        //                 id: field,
        //                 name: item.keyvaluepair[field]
        //               }
        //             }
        //             return null;
        //           });
        //         }
        //       return {
        //           "displayName" : item.name,
        //           "id" : item.name,
        //           "url" :item.id,
        //           "appClass" : "icon-id",
        //           "icon":item.name === "Employees" ? iconEmployees : iconApplicants,
        //           "show" : item.view_permission,
        //           "feature": true,
        //           entity_search_fields,
        //           "master_model_id":item.id,
        //           "bulk_update_permission":item.bulk_update_permission,
        //       }
        //     })        
        //     let entity_routes_match = list.map((e)=> new RegExp(`entity/${e.id}`))
        //     dispatch(authSuccess(response_data, entity_list, entity_routes_match))
        //   })
        // }
        
        // Each time page refresh
        // We will set the all the reponses
        dispatch(authSuccess(response_data));
        CB();
      })
      .catch(() => {
        CB();
      });
  };
};
