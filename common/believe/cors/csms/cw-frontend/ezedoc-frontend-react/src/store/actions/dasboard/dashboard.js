import axios from "axios";
import * as actionTypes from "../actionTypes";
import * as constants from "../../../Data/constants";
import {saveToLocalStorage} from "../../../localStorage";

import { handleError } from "../../authConfig";
import { addToast } from '../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

const QUICK_ACTION_SIZE = 5;

export const dashboardStart = () => {
  return {
    type: actionTypes.DASHBOARD_START
  }
}
export const dashboardSuccess = (apps = null, count = null) => {
  return {
    type: actionTypes.DASHBOARD_SUCCESS,
    apps,
    processesCount: count
  };
};

export const dashboardCountSuccess = (count = null) => {
  return {
    type: actionTypes.DASHBOARD_COUNT_SUCCESS,
    processesCount: count
  };
};


export const dashboardProcessCountFilter = (count, id, process_key) => {
  return {
    type: actionTypes.DASHBOARD_FILTER,
    processCount: count.data.data,
    id,
    processKey: process_key,
  }
}
export const dashboardWorkflowFilter = (app, id, process_key) => {
  return {
    type: actionTypes.DASHBOARD_APP_FILTER,
    app,
    id,
    processKey: process_key
  }
}
export const dashboardFail = (error) => {
  return {
    type: actionTypes.DASHBOARD_ERROR,
    error
  };
};

export const quickActionSuccess = (tasks, total, groupTaskTotal) => {
  return {
    type: actionTypes.QUICK_ACTIONS,
    tasks: tasks,
    total: total,
    groupTaskTotal
  }
}

export const quickActionFail = (error="") => {
  return {
    type: actionTypes.QUICK_ACTIONS_FAIL,
    error
  }
}
export const quickActionStart = () => {
  return {
    type: actionTypes.QUICK_ACTIONS_START,
  }
}


export const dashboardProcessCountLoaderState = (loaderState) => {
  return {
    type: actionTypes.DASHBOARD_PROCESS_COUNT_LOADER_STATE,
    processCountLoader: loaderState
  }
}

export const taskFilterSuccess = (taskFilterData) => {
  return {
    type: actionTypes.TASK_FILTER_SUCCESS,
    taskFilterData
  }
}

export const dashboardDetails = (orgId) => {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
        dispatch(dashboardStart());

        function apps() {
          return axios.get(`${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`)
        }

        // function appsCount() {
        //   return axios.get(`${APP_URL}/${orgId}/apps/count`)
        // }

        // if(!getAllAppsData) {
        //   appsCount().then(res => {
        //     dispatch(dashboardCountSuccess(res.data.data));
        //     resolve(res);
        //   })
        //   .catch(err => {
        //     dispatch(dashboardProcessCountLoaderState(false))
        //     dispatch(dashboardFail(err.response));
        //     reject(err)
        //   })
        // }else if (allApps) {
          dispatch(dashboardProcessCountLoaderState(true))

          let listOfAPIs = [apps()]

          axios.all(listOfAPIs)
            .then(res => {
              dispatch(dashboardSuccess(res[0].data.data, res[1] ? res[1].data.data : {}))
              // dispatch(dashboardProcessCountLoaderState(false))
              return resolve(res)
            })
            .catch(err => {
              handleError({
                error: err,
                type: actionTypes.DASHBOARD_ERROR,
                payload: {},
                showToast: true
              });
              dispatch(dashboardFail(err.response))
              // dispatch(dashboardProcessCountLoaderState(false))
              reject(err)
            })
      })
    }
    };

  export const dashboardQuickActions = (orgId) => {
    return dispatch => {
      dispatch(quickActionStart());
      function myTask() {
        return axios
          .get(`${APP_URL}/${orgId}/proxy-bpm/tasks/?start=0&size=1&includeProcessVariables=true&order=asc&sort=createTime`)
        // .get(`http://localhost:5000/mock_proxy_bpm_tasks`)
      }
      function myGroupTask() {
        return axios
        // .get(`https://applicant-dev-api.betterplace.co.in/hire/${orgId}/proxy-bpm/group-tasks/?size=1`)
          .get(`${APP_URL}/${orgId}/proxy-bpm/group-tasks/?size=1`)
        // .get(`http://localhost:5000/mock_proxy_bpm_group_tasks`)
      }
      axios.all([myTask(), myGroupTask()]).then(res => {
          const tasks = res[0].data.data.data;
          const total = res[0].data.data.total;
          const groupTaskTotal = res[1].data.data.total;
          dispatch(quickActionSuccess(tasks, total,groupTaskTotal))
        })
        .catch((err) => {
          dispatch(quickActionFail(err.response))
        });
    }
  };


  export const dashboardCountFilter = (orgId, id, process_key) => {
    return dispatch => {
      dispatch(dashboardStart())
      dispatch(dashboardProcessCountLoaderState(true))

      axios
        .get(
          `${APP_URL}/${orgId}/apps/count/${id}`
          // `http://localhost:5000/mock_count_dashboard`
        )
        .then(count => {
          dispatch(dashboardProcessCountFilter(count, id, process_key));
          dispatch(dashboardProcessCountLoaderState(false))
        })
        .catch(err => {
          dispatch(dashboardFail(err.response));
          dispatch(dashboardProcessCountLoaderState(false))
          if (err.response && err.response.status) {
            if (err.response.status !== 500) {
              dispatch(addToast('error', 'Error', err.response.data.message))
            } else { 
              dispatch(addToast('error', 'Error', 'Something went wrong!'))
          }
          } 
        })
    }
  }

  export const dashboardAppFilter = (orgId, id, process_key) => {
    return dispatch => {
      dispatch(dashboardStart())

      axios.get(`${APP_URL}/${orgId}/apps/${id}`)
      // axios.get(`http://localhost:5000/mock_month_dasboard`)
        .then(app => {
          saveToLocalStorage({
            processKey : process_key,
            id,
          }, constants.DASHBOARD_CURRENT_APP_FILTER_NAME);
          dispatch(dashboardWorkflowFilter(app.data.data, id, process_key));
        })
        .catch(err => {
          dispatch(dashboardFail(err.response));
        })
    }
  }

  export const taskFilter = (orgId, groupId) => {
    return dispatch => {
      // axios.get(`http://localhost:5000/mock_count_dashboard`)
      axios.post(`${APP_URL}/${orgId}/apps/group_task_count?group_id=${groupId}`)
      .then( res => {
        if(Array.isArray(res.data.filter_base_count) && res.data.filter_base_count.length>0) {
          const taskFilterData = res.data.filter_base_count[0].name
          dispatch(taskFilterSuccess(taskFilterData));
        }
      })
      .catch(() => {})
    }
  }