import axios from "axios";

import * as actionTypes from "../actionTypes";
import { addToast} from "../../../components/Toast/actions"

const APP_URL = process.env.REACT_APP_APP_URL;

export const ContentStart = () => {
  return {
    type: actionTypes.CONTENT_START,
  }
}
export const ContentSuccess = (data) => {
  return {
    type: actionTypes.CONTENT_DETAILS,
    data: data
  };
};


export const ContentEdit = (data) => {
  return {
    type: actionTypes.CONTENT_EDIT,
    data: data
  };
};

export const ContentDetail = (data) => {
    return {
        type: actionTypes.CONTENT_CREATE,
        data: data
      };
}

export const ContentFail = (error) => {
  return {
    type: actionTypes.CONTENT_ERROR,
    error: error
  };
};

export const ContentUpdate = (data) => {
    return {
      type: actionTypes.CONTENT_DETAIL,
      data: data
    };
  };
export const ContentDelete = (data) => {
    return {
      type: actionTypes.CONTENT_DELETE,
      data: data
    };
  };

export const ContentDetails = (orgId) => {
  return dispatch => {
    let url = `${APP_URL}/${orgId}/portal/content`;
    dispatch(ContentStart())
    axios.get(url)
      .then(response => {
        dispatch(ContentSuccess(response.data.data));
      })
      .catch(err => {
        dispatch(ContentFail(err.response.data));
      });
  }

};
export const ContentDetailId = (orgId, id) => {
  return dispatch => {
    let url = `${APP_URL}/${orgId}/portal/content/${id}`;

    dispatch(ContentStart())
    axios.get(url)
      .then(response => {
        dispatch(ContentDetail(response.data.data));
      })
      .catch(err => {
        dispatch(ContentFail(err.response.data));
      });
  }

};


export const ContentEditId = (orgId, id, data) => {
    return dispatch => {
      let url = `${APP_URL}/${orgId}/portal/content/${id}`;
      dispatch(ContentStart())
      axios.put(url,data)
        .then(response => {
          dispatch(ContentEdit(response.data.data));
          dispatch(addToast('success', 'Success', response.data.message))
        })
        .catch(err => {
          dispatch(addToast('error', 'Error', err.response.data.message))
          dispatch(ContentFail(err.response.data));
        });
    }
  
  };

export const ContentCreateId = (orgId,heading,desc,html,publish) => {
    return dispatch => {
     let data= {
        "name" : heading,
        "is_published" : publish,
        "description" : desc,
         "content": html 
}
      let url = `${APP_URL}/${orgId}/portal/content`;
      dispatch(ContentStart())
      axios.post(url,data)
        .then(response => {
          dispatch(ContentUpdate(response.data.data));
          dispatch(addToast('success', 'Success', response.data.message))
        })
        .catch(err => {
          dispatch(ContentFail(err.response.data));
          dispatch(addToast('error', 'Error', err.response.data.message))
        });
    }
  
  };
  export const PortalContentCreate = (orgId,heading,desc,html,publish,history) => {
    return dispatch => {
     let data= {
        "name" : heading,
        "is_published" : publish,
        "description" : desc,
         "content": html 
}
      let url = `${APP_URL}/${orgId}/portal/content`;
      dispatch(ContentStart())
      axios.post(url,data)
        .then(response => {
          dispatch(ContentUpdate(response.data.data));
          history.push(`/custom-workflow/org/${orgId}/config/contents`)
          dispatch(addToast('success', 'Success', response.data.message))
        })
        .catch(err => {
          dispatch(ContentFail(err.response.data));
          dispatch(addToast('error', 'Error', err.response.data.message))
        });
    }
  
  };

  export const contentDelete = (orgId, id) => {
    return dispatch => {
      let url = `${APP_URL}/${orgId}/portal/content/${id}`
      axios.delete(url)
          .then(response => {
            dispatch(ContentDelete(id));
            dispatch(addToast('success', 'Success', response.data.message))
          })
          .catch(err => {
            dispatch(ContentFail(err.response.data));
            dispatch(addToast('error', 'Error', err.response.data.message))
          }); 
    
    }
  
  };
