import axios from "axios";
import * as actionTypes from "../actionTypes";
import { addToast } from "../../../components/Toast/actions"

const APP_URL = process.env.REACT_APP_APP_URL;

export const PortalStart = () => {
  return {
    type: actionTypes.PORTAL_START
  }
}
export const PortalSuccess = (data) => {
  return {
    type: actionTypes.PORTAL_DETAILS,
    data: data
  };
};
export const PortalEdit = (data) => {
  return {
    type: actionTypes.PORTAL_EDIT,
    data: data
  };
};
export const AppDetail = (data) => {
  return {
    type: actionTypes.APPS_LIST,
    app: data
  };
};
export const PortalCreate = (data) => {
    return {
        type: actionTypes.PORTALS_CREATE,
        data: data
      };
}

export const PortalFail = (error) => {
  return {
    type: actionTypes.PORTALS_ERROR,
    error: error
  };
};
export const PortalDetail = (data) => {
    return {
      type: actionTypes.PORTAL_DETAIL,
      data: data
    };
  };
  export const PortalContent = (data) => {
    return {
      type: actionTypes.PORTAL_CONTENT,
      content: data
    };
  };


export const PortalDetails = (orgId) => {
  return dispatch => {
    let url = `${APP_URL}/${orgId}/portal/`;
    url=decodeURI(url)
    dispatch(PortalStart())
    axios.get(url)
      .then(response => {
        dispatch(PortalSuccess(response.data.data));
      })
      .catch(err => {
        dispatch(PortalFail(err.response.data));
      });
  }

};
export const PortalDetailId = (orgId, id) => {
  return dispatch => {
    let url = `${APP_URL}/${orgId}/portal${id}`;
    dispatch(PortalStart())
    axios.get(url)
      .then(response => {
        dispatch(PortalDetail(response.data.data));
      })
      .catch(err => {
        dispatch(PortalFail(err.response.data));
      });
  }

};

export const PortalEditId = (orgId, id) => {
    return dispatch => {
      let url = `${APP_URL}/${orgId}/portal${id}`;
      dispatch(PortalStart())
      axios.put(url)
        .then(response => {
          dispatch(PortalDetail(response.data.data));
          dispatch(addToast('success', 'Success', response.data.message))
        })
        .catch(err => {
          dispatch(PortalFail(err.response.data));
          dispatch(addToast('error', 'Error', err.response.data.message))
        });
    }
  
  };

export const PortalCreateId = (orgId, data) => {
    return dispatch => {
      let url = `${APP_URL}/${orgId}/portal/`;
      dispatch(PortalStart())
      axios.post(url,data)
        .then(response => {
          dispatch(addToast('success', 'Success', response.data.message))
          dispatch(PortalCreate(response.data.data));
        })
        .catch(err => {
          dispatch(addToast('error', 'Error', err.response.data.message))
          dispatch(PortalFail(err.response.data));
          
        });
    }
  
  };

  export const listApps = (orgId) => {
    return dispatch => {
      let url = `${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`;
      dispatch(PortalStart())
      axios.get(url)
        .then(response => {
          dispatch(AppDetail(response.data.data));
        })
        .catch(err => {
          dispatch(PortalFail(err.response.data));
        });
    }
}
export const ContentDetail = (orgId) => {
  return dispatch => {
    let url = `${APP_URL}/${orgId}/portal/content?is_published=True`;
    dispatch(PortalStart())
    axios.get(url)
      .then(response => {
        dispatch(PortalContent(response.data.data));
      })
      .catch(err => {
        dispatch(PortalFail(err.response.data));
      })
  }

};