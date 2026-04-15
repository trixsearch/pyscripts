import axios from "axios";

import * as actionTypes from "../actionTypes";
import { addToast } from '../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

export const profileStart = () => {
    return {
      type: actionTypes.PROFILE_START
    };
  }
  

export const profileSuccess = (data,entity_list,entity_routes_match) => {
  return {
    type: actionTypes.PROFILE_SUCCESS,
    profilePhoto: data.display_picture,
    signaturePhoto: data.signature,
    manager : data.manager,
    groupName : data.roles[0].name,
    employeeId : data.employee_Id,
    gender : data.gender,
    firstName : data.first_name,
    middleName : data.middle_name,
    lastName : data.last_name,
    mobile: data.mobile,
    involved_groups: data.involved_groups,
    dashboard_view:data.dashboard_view,
    entity_list:entity_list,
    entity_routes_match: entity_routes_match
  };
}

export const profileUpdateSuccess = (data) => {
  return {
    type: actionTypes.PROFILEUPDATE_SUCCESS,
    mobile: data.mobile,
  };
}


export const profileError = () => {
  return {
    type: actionTypes.PROFILE_ERROR,
  };
}

export const profileGet = (orgId, userId) => {
  const id = localStorage.getItem('userId');
  return dispatch => {
      axios.get(
        `${APP_URL}/${orgId}/users/org_users/${userId || id}`,
          ).then(res=>{
            let ui_permissions = res.data.data.ui_permissions;
          //   if (ui_permissions.masterrecords.manage) {
          //     axios.get(`${APP_URL}/${orgId}/entity/master`).then((entity) => {
          //       let list = entity.data.data.filter(master=> master.model_type === "entities")
          //       let entity_list =list && list.map((item) => {
          //         let entity_search_fields = [];
          //         if(item.search_fields && item.keyvaluepair) {
          //          entity_search_fields = item.search_fields
          //           .filter(field => item.keyvaluepair[field])
          //           .map((field) => {
          //               if(item.keyvaluepair[field]) {
          //                 return {
          //                   id: field,
          //                   name: item.keyvaluepair[field]
          //                 }
          //               }
          //               return null;
          //             });
          //           }
                    
          //         return {
          //             "displayName" : item.name,
          //             "id" : item.name,
          //             "url" :item.id,
          //             "appClass" : "icon-id",
          //             "show" : item.view_permission,
          //             "feature": true,
          //             entity_search_fields,
          //             "master_model_id":item.id,
          //             "bulk_update_permission":item.bulk_update_permission,
          //         }
          //       })        
          //       let entity_routes_match = list.map((e)=> new RegExp(`entity/${e.id}`))
          //       console.log(res.data.data,entity_list,entity_routes_match);
          //       dispatch(profileSuccess(res.data.data,entity_list,entity_routes_match));
          //   }).catch(()=> {
          //     dispatch(profileError());
          //   })
          // }else {
             dispatch(profileSuccess(res.data.data,[],[]));
          // }
        }).catch(()=>{
        dispatch(profileError());
      });
  }
}


export const profilephotoUpdateSuccess = (data) => {
  return {
    type: actionTypes.PROFILEPHOTO_UPDATE_SUCCESS,
    props: data
  };
}


export const profilephotoUpdate = (orgId, data) => {
  return dispatch => {
    let url = `${APP_URL}/${orgId}/users/org_users/${data.id}`;
    const formData = new FormData();
    const config = {
      'Content-Type': 'multipart/form-data',
    }
    formData.append('display_picture', data.profilePhoto)
    axios.put(
      url, formData, config
    ).then(response => {
      // TODO need to be refactor
      // eslint-disable-next-line no-shadow
      let data = {
        display_picture: response.data.data.display_picture,
      }
      dispatch(profilephotoUpdateSuccess(data));
    }).catch(err => {
      dispatch(addToast('error', 'Error', 'Unable to update Profile Picture'))
      dispatch(profileError(err));
    })
  }
}


export const profileUpdate =(orgId, id, data) => {
  return dispatch => {
    dispatch(profileStart());
    axios.put(`${APP_URL}/${orgId}/users/org_users/${id}`, data).then((response) => {
      dispatch(addToast('success', 'Success', response.data.message))
    }).catch((error)=>{
      dispatch(addToast('error', 'Error', error.response.data.message))
    })
  }
}

export const signaturephotoUpdateSuccess = (data) => {
  return {
    type: actionTypes.SIGNATUREPHOTO_UPDATE_SUCCESS,
    props: data
  };
}

export const signatureError = () => {
  return {
    type: actionTypes.SIGNATURE_ERROR,
  };
}

export const signaturephotoUpdate = (orgId, data) => {
  return dispatch => {
    let url = `${APP_URL}/${orgId}/users/org_users/${data.id}`;
    const formData = new FormData();
    const config = {
      'Content-Type': 'multipart/form-data',
    }
    formData.append('signature', data.signaturePhoto)
    axios.put(
      url, formData, config
    ).then(response => {
      let data1 = {
        signature: response.data.data.signature,
      }
      dispatch(addToast('success', 'Success', 'Signature updated successfully'));
      dispatch(signaturephotoUpdateSuccess(data1));
    }).catch(err => {
      dispatch(addToast('error', 'Error', 'Unable to update Signature'))
      dispatch(signatureError(err));
    })
  }
}

export const signaturedrawphotoUpdate = (orgId, data) => {
  return dispatch => {
    
    let url = `${APP_URL}/${orgId}/users/org_users/${data.id}`;
    
    const config = {
      'Content-Type': 'multipart/form-data',
      
    }
    const body ={
      "signature" : `${data.signaturePhoto}`
    }
    axios.put(
      url, body, config
    ).then(response => {
      let data1 = {
        signature: response.data.data.signature,
      }
      dispatch(addToast('success', 'Success', 'Signature updated successfully'));
      dispatch(signaturephotoUpdateSuccess(data1));
    }).catch(err => {
      dispatch(addToast('error', 'Error', 'Unable to update Signature'))
      dispatch(profileError(err));
    })
  }
}
