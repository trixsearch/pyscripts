import axios from "axios";
import * as actionTypes from "../actionTypes";

const APP_URL = process.env.REACT_APP_APP_URL;

export const configureStart = () => {
  return {
    type: actionTypes.CONFIGURE_START
  }
}
export const configureSuccess = (data) => {
  return {

    type: actionTypes.CONFIGURE_SUCCESS,
    data:data.data

  };
};

// export const dasboardAppFilter = (process,task)=>{
//   return {
//     type:actionTypes.DASHBOARD_FILTER,
    
//   }
// }
export const configureFail = (error) => {
  return {
    type: actionTypes.CONFIGURE_ERROR,
    error: error
  };
};


export const configureDetails = (orgId, id) => {
  return d => {
    d(configureStart())
    // let assignee =  localStorage.getItem("email");
    // let tenant_id = new URL(window.location).hostname.split(".")[0]
    let url = `${APP_URL}/${orgId}/apps/${id}`;
    axios.get(url).then(process=>{
            d(configureSuccess(process))
      }).catch(err=>{
        d(configureFail(err.response.data))
      })
   
  }

};

// export const dasboardFilter=(id,process_key,name)=>{
//   return dispatch =>{
      
//       let tenant_id = new URL(window.location).hostname.split(".")[0]
//       let assignee =  localStorage.getItem("email");
//       axios.get(
//         `/api/apps/count/${id}`
//         ).then(process=>{
//                 axios.get(
//                   `/api/proxy-bpm/tasks/?tenantId=${tenant_id}&processDefinitionKey=${process_key}&assignee=${assignee}`
//                 ).then(task=>{
//                   dispatch(dasboardAppFilter(process,task))
//                 });
//       }).catch(err=>{
//         dispatch(dashboardFail(err.response.data))
//       })
//   }
// }

// export const dashboardDetailsId = (id) => {
//   return dispatch => {
//     let url1 = routes.APP.to();
//     let url = `/api/apps/count/` + id;

//     axios.get(url)
//       .then(response => {
//         dispatch(dashboardSuccess(response.data.data));
//       })
//       .catch(err => {
//         dashboardFail(err.response.data);
//       });
//   }
// }