import axios from "axios";

import { addToast } from '../../../components/Toast/actions';
import * as actionTypes from "../actionTypes";
import { MY_TASKS, GROUP_TASKS, COMPLETED_TASKS } from '../../../containers/Tasks/TaskConstants';
// import { OWNER, SUPER_ADMINISTRATOR } from "../../../Data/constants";
import { clientLogger } from "../../../containers/utils"
import { objectToQueryParams, replaceWords } from "../../../utils/misc";

const APP_URL = process.env.REACT_APP_APP_URL;


export const taskStart = () => {
  return {
    type: actionTypes.TASK_START
  }
}

export const removeTaskData = () => {
  return {
    type: actionTypes.REMOVE_TASK_DATA
  }
}
export const taskSuccess = (data, taskType, page, pageSize, filter, filter_name, process_key, filteredTasktitle) => {

  return {
    type: actionTypes.TASK_SUCCESS,
    tasks: data.data,
    count: data.total,
    taskType,
    page,
    processKey: process_key,
    taskTitle: filteredTasktitle,
    filter_name,
    size: pageSize,
  };
};

export const taskClaim = (id) => {
  return {
    type: actionTypes.TASK_CLAIM,
    id: id
  }
}

export const taskFail = (error) => {
  return {
    type: actionTypes.TASK_ERROR,
    error: error
  }
}

export const taskUpdate = (filter, process_key, appName, taskType, total, page, taskTitle, pageSize) => {
  return {
    type: actionTypes.TASK_UPDATE,
    filter: filter,
    processKey: process_key,
    appName: appName,
    taskType: taskType,
    total: total,
    page: page,
    pageSize,
    taskTitle: taskTitle

  }
}

export const taskUpdateGroup = (filter, process_key, appName, taskType, total, page, taskTitle, pageSize) => {
  return {
    type: actionTypes.TASK_UPDATE_GROUP,
    filter: filter,
    processKey: process_key,
    appName: appName,
    taskType: taskType,
    total: total,
    page: page,
    pageSize,
    taskTitle: taskTitle
  }
}

export const toggleTaskHomeScreen = (val, process_key) => {
  return {
    type: actionTypes.TASK_TOGGLE_HOME_SCREEN,
    value: val,
    process_key
  }
}

export const saveFilteredData = (data, key) => {
  return {
    type: actionTypes.TASK_SAVE_FILTERED_DATA,
    data,
    key,
  }
}


export const searchedTask = (res, taskType, searchData, page = null, filter_name, pageSize) => {
  return {
    type: actionTypes.SEARCH_TASK,
    searchedTasks: res.data.data.data,
    count: res.data.data.total,
    taskType,
    searchData,
    page,
    pageSize,
    filter_name,
  }
}

export const countUpdate = (data, type) => {
  return {
    type: actionTypes.COUNT_UPDATE,
    taskCount: {
      [type]: data.data.total || 0
    },
    filter_based_count: { [type]: data.filter_base_count || 0 }
  }
}

export const clearTaskSearchResult = () => {
  return {
    type: actionTypes.CLEAR_TASK_SEARCH
  }
}

export const getUserTaskLists = (list) => {
  return {
    type: actionTypes.GET_USER_TASK_LIST,
    taskList: list
  }
}
export const getInvolvedUserGroupResult = (groups) => {
  return {
    type: actionTypes.GET_USER_INVOLVED_GROUP,
    involved_groups: groups
  }
}

export const taskError = (error) => {
  return {
    type: actionTypes.TASK_ERROR,
    error
  }
};

export const unMountTaskData = () => {
  return dispatch => {
    return dispatch(removeTaskData())
  }

}

export const getMyApps = (orgId) => async (dispatch) => {

  dispatch(taskStart());
  dispatch({
    type: actionTypes.TASK_APP_STATUS,
    loading: true
  })

  try {
    const response = await axios.get(`${APP_URL}/${orgId}/apps/?is_global=true&page_count=100&from_task_page=true`);
    return dispatch({
      type: actionTypes.TASK_APPS,
      apps: response.data.data
    });
  } catch (error) {
    dispatch({
      type: actionTypes.TASK_APP_STATUS,
      loading: false
    })
    return dispatch(taskError(error));
  }
};

const dateFilterMapping = new Map([
  ['dueBefore', 'taskCompletedBefore'],
  ['dueAfter', 'taskCompletedAfter'],
  ['createdBefore', 'taskCreatedBefore'],
  ['createdAfter', 'taskCreatedAfter']
])

export const getAllTaskCount = (orgId, taskTypes = [], taskType, searchData, dateFilters = [], process_key, filteredTasktitle) => async (dispatch) => {
  let queryParams = decodeURIComponent(dateFilters?.map(objectToQueryParams).join('&'));

  return new Promise((resolve, reject) => {
    // const showGroupTasks = userRole === OWNER || userRole === SUPER_ADMINISTRATOR;
    const showGroupTasks = false;
    try {
      taskTypes.reduce(async (acc, type) => {
        let URL = `${APP_URL}/${orgId}/apps/search_task?start=0&size=0${filteredTasktitle ? `&nameLike=${filteredTasktitle}` : ``}&`;
        let url = ""
        let Type = type
        let response = [];
        if (type === COMPLETED_TASKS) {
          queryParams = replaceWords(queryParams, dateFilterMapping);
        }
        if (!showGroupTasks && type !== taskType && (type === COMPLETED_TASKS || type === MY_TASKS || type === GROUP_TASKS)) {
          url = `${URL}${queryParams}&task_type=${type}${process_key ? `&processDefinitionKey=${process_key}` : ``}`;
        } else if (showGroupTasks && type !== taskType && (type === GROUP_TASKS || type === MY_TASKS)) {
          url = `${URL}${queryParams}&task_type=${type}${process_key ? `&processDefinitionKey=${process_key}` : ``}`;
        }
        if (url) {
          if (searchData?.length) {
            const payload = searchData?.length ? (searchData?.[0]?.hasOwnProperty('or_query') ? searchData[0] : { "search": true, search_data: searchData }) : {}
            response = await axios.post(url, payload);
          } else {
            response = await axios.post(url, { "deletePrevFilterData": false });
          }
          dispatch({
            type: actionTypes.TASK_COUNT,
            taskCount: {
              ...acc,
              [Type]: response?.data?.data?.total || 0
            },
            filter_based_count: { [Type]: response?.data?.filter_base_count || 0 }
          })
          // return {
          //   ...acc,
          //   [Type]: response.data.data.total || 0
          // }
        }
      }, {}).then(() => { return resolve() });

    } catch (error) {
      dispatch(taskError(error));
      if (error.response && error.response.status) {
        dispatch(taskFail(error.response))
        if (error.response.status !== 500) {
          dispatch(addToast('error', 'Error', error.response.data.message))
        } else dispatch(addToast('error', 'Error', 'Something went wrong!'))
      }

      return reject(error);
    }
    return null
  })
}

export const getGroupBasedCount = (orgId, task_type, searchData, process_key) => {
  return dispatch => {
    return new Promise((resolve, reject) => {
      const url = `${APP_URL}/${orgId}/apps/group_task_count?group_id=${task_type}${process_key ? `&processDefinitionKey=${process_key}` : ``}`
      if (searchData) {
        axios.post(url, { "search": true, ...searchData }).then((res) => {
          dispatch(countUpdate(res.data, task_type))
          return resolve(res)
        })
      } else {
        axios.post(url, { "deletePrevFilterData": false }).then((res) => {
          dispatch(countUpdate(res.data, task_type))
          return resolve(res)
        }).catch((err) => {
          if (err.response && err.response.status) {
            dispatch(taskFail(err.response))
            if (err.response.status !== 500) {
              dispatch(addToast('error', 'Error', err.response.data.message))
            } else dispatch(addToast('error', 'Error', 'Something went wrong!'))
          }

          return reject(err);
        })
      }
    });
  }
}

export const getAllTaskPersist = (orgId, task_type, order, sort, page = 1, pageSize, filter_name, searchData, dateFilters = [], process_key, filteredTasktitle, selectedInvolvedGroup) => (

  async (dispatch) => {
    dispatch(taskStart());
    const START = (page - 1) * pageSize;
    let taskType = task_type
    let queryParams = decodeURIComponent(dateFilters?.map(objectToQueryParams).join('&'));
    if (task_type === COMPLETED_TASKS) {
      queryParams = replaceWords(queryParams, dateFilterMapping);
    }
    let URL = `${APP_URL}/${orgId}/apps/search_task?start=${START}&size=${pageSize}&order=${order}&sort=${sort}${process_key ? `&processDefinitionKey=${process_key}` : ``}${filteredTasktitle ? `&nameLike=${filteredTasktitle}` : ``}&${queryParams}`;

    if (task_type === MY_TASKS || task_type === GROUP_TASKS || task_type === COMPLETED_TASKS) {
      try {
        let response = {}
        if (searchData?.length && task_type !== COMPLETED_TASKS) {
          response = await axios.post(`${URL}&task_type=${task_type}`, (searchData[0]?.hasOwnProperty('or_query') ? searchData[0] : { "search": true, search_data: searchData }));
        } else {
          const payload = { "deletePrevFilterData": false }
          if(selectedInvolvedGroup?.id && selectedInvolvedGroup?.id !== "mine"){
            payload["taskCandidateGroup"] = selectedInvolvedGroup?.key
          }
          response = await axios.post(`${URL}&task_type=${task_type}`, payload);
        }
        dispatch(taskSuccess(response?.data?.data, taskType, page, pageSize, response?.data?.filterData, filter_name, process_key, filteredTasktitle));
      } catch (error) {
        dispatch(taskFail(error));
      }
    } else {
      try {
        if (filter_name) {
          URL = `${URL}&filter_value=${filter_name}`;
        }
        taskType = `${task_type}@subfilter`
        let response = {}
        if (searchData) {
          response = await axios.post(`${URL}&task_type=group_tasks${task_type && `&group_id=${task_type}`}`, { "search": true, ...searchData });
        } else {
          response = await axios.post(`${URL}&task_type=group_tasks${task_type && `&group_id=${task_type}`}`, { "deletePrevFilterData": false });
        }
        dispatch(taskSuccess(response.data.data, taskType, page, pageSize, response.data.filterData, filter_name, process_key, filteredTasktitle))
      } catch (error) {
        if (error.response && error.response.status) {
          dispatch(taskFail(error.response))
          if (error.response.status !== 500) {
            dispatch(addToast('error', 'Error', error.response.data.message))
          } else dispatch(addToast('error', 'Error', 'Something went wrong!'))
        }

      }
    }
    return null
  });

export const getFilterTask = (orgId, process_key, appName, taskType, pageSize, order, sort, taskTitle = "", involved_groups, filter_name, filterData, dateFilters = [], selectedInvolvedGroup) => {
  let queryParams = decodeURIComponent(dateFilters?.map(objectToQueryParams).join('&'));
  if (taskType === COMPLETED_TASKS) {
    queryParams = replaceWords(queryParams, dateFilterMapping);
  }
  let filters = (filterData?.length) ? (filterData[0]?.hasOwnProperty('or_query') ? filterData[0] : { search: true, search_data: filterData }) : {};
  return dispatch => {
    return new Promise((resolve, reject) => {
      dispatch(taskStart())
      const page = 1
      let filteredTasktitle = taskTitle;
      if (taskType === "tasks" || taskType === COMPLETED_TASKS) {
        if(taskType === COMPLETED_TASKS && selectedInvolvedGroup?.id && selectedInvolvedGroup?.id !== "mine"){
          filters["taskCandidateGroup"] = selectedInvolvedGroup?.key
        }
        let url = encodeURI(`${APP_URL}/${orgId}/apps/search_task?task_type=${taskType}${process_key ? `&processDefinitionKey=${process_key}` : ``}&start=0&size=${pageSize}&order=${order}&sort=${sort}${filteredTasktitle ? `&nameLike=${filteredTasktitle}` : ``}&${queryParams}`)
        axios.post(url, filters)
          .then(res => {
            const tasks = res.data.data.data;
            const total = res.data.data.total;
            dispatch(taskUpdate(tasks, process_key, appName, taskType, total, page, taskTitle, pageSize))
            return resolve(res)
          }).catch((err) => {
            dispatch(taskFail(err.response))
          })
      } else {
        let URL = ""

        if (taskType !== GROUP_TASKS) {

          URL = `&group_id=${taskType}${filter_name ? `&filter_value=${filter_name}` : ``}`;
        }
        let url = encodeURI(`${APP_URL}/${orgId}/apps/search_task?task_type=group_tasks${process_key ? `&processDefinitionKey=${process_key}` : ``}&start=0&size=${pageSize}&order=${order}&${queryParams}&sort=${sort}${filteredTasktitle ? `&nameLike=${filteredTasktitle}` : ``}${URL}`)
        axios.post(url,filters).then(res => {
          const tasks = res.data.data.data;
          const total = res.data.data.total;
          dispatch(taskUpdateGroup(tasks, process_key, appName, taskType, total, page, taskTitle, pageSize))
          return resolve(res)
        }).catch((err) => {
          if (err.response && err.response.status) {
            dispatch(taskFail(err.response))
            if (err.response.status !== 500) {
              dispatch(addToast('error', 'Error', err.response.data.message))
            } else dispatch(addToast('error', 'Error', 'Something went wrong!'))
          }

          return reject(err);
        })
      }

    })
  }
}

export const getClaimTask = (orgId, id, history, assignee, current_task_owner, claimFailTaskRefreshHandler, isBulkAction = false, selectedTasks = []) => {
  return dispatch => {
    dispatch(taskStart())
    let data = {
      action: "claim"
    }
    let url = `/custom-workflow/org/${orgId}/tasks/${id}`;
    axios
      .post(
        `${APP_URL}/${orgId}/proxy-bpm/tasks/${id}`, data
      )
      .then(() => {
        history.push({
          pathname: url,
          state: {
            isBulkAction,
            taskIds: selectedTasks
          }
        })
      })
      .catch(err => {
        if (err.response && err.response.status) {
          dispatch(taskFail(err.response));
          if (err.response.status === 409) {
            dispatch(taskClaim(id));
          }
          try {
            const errorMessage = JSON.parse(err.response.data.error).message;
            dispatch(addToast('error', 'Error', errorMessage));
          } catch (error) {
            dispatch(addToast('error', 'Error', err.response.data.message));
          }
          if (err.response.status === 409) claimFailTaskRefreshHandler()
          // dispatch(taskFail(err.response))
          // dispatch(taskClaim(id))
        } else {
          dispatch(addToast('error', 'Error', err.message));
        }
        clientLogger.log({
          message: {
            error: "Failed to claim the task.",
            taskID: id,
            url: window.location.href,
            assignee: assignee,
            current_task_owner: current_task_owner.userId
          }
        });
      });
  }
}

export const searchTask = (orgId, processDefinitionKey, taskType, searchData, dateFilters = [], pageSize, order, sort, page, filter_name, selectedInvolvedGroup, taskTitle) => {
  let queryParams = decodeURIComponent(dateFilters?.map(objectToQueryParams).join('&'));
  if (taskType === COMPLETED_TASKS) {
    queryParams = replaceWords(queryParams, dateFilterMapping);
  }
  let URL = ""
  let start = page ? (page - 1) * pageSize : 0;
  let url = `${APP_URL}/${orgId}/apps/search_task?${processDefinitionKey ? `processDefinitionKey=${processDefinitionKey}` : ``}&start=${start}&size=${pageSize}&order=${order}&sort=${sort}&${queryParams}`;
  if (taskType === MY_TASKS || taskType === GROUP_TASKS || taskType === COMPLETED_TASKS) {
    URL = `${url}&task_type=${taskType}`
  } else {
    URL = `${url}&task_type=group_tasks&group_id=${taskType}${filter_name ? `&filter_value=${filter_name}` : ``}`
  }

  if(taskTitle){
    URL += `&nameLike=${taskTitle}`
  }

  return dispatch => {
    dispatch(taskStart())
    const searchPayload = searchData?.[0]?.hasOwnProperty('or_query') ? searchData[0] : { "search": true, search_data: searchData }
    if(taskType === COMPLETED_TASKS && selectedInvolvedGroup?.id && selectedInvolvedGroup?.id !== "mine"){
      searchPayload["taskCandidateGroup"] = selectedInvolvedGroup?.key
    }
    axios.post(URL, searchPayload)
      .then(res => {
        dispatch(searchedTask(res, taskType, searchData, page, filter_name, pageSize))
      })
      .catch(err => {
        if (err.response && err.response.status) {
          dispatch(taskFail(err.response))
          if (err.response.status !== 500) {
            dispatch(addToast('error', 'Error', err.response.data.message))
          } else dispatch(addToast('error', 'Error', 'Something went wrong!'))
        }
      })
  }
}

export const clearTaskSearch = () => {
  return dispatch => {
    dispatch(clearTaskSearchResult())
  }
}

export const getUserTaskList = (orgId, appId) => {
  let url = encodeURI(`${APP_URL}/${orgId}/apps/${appId}/user_task_list`)
  return dispatch => {
    axios.get(url)
      .then(res => {
        let list = { [appId]: res.data.data }
        dispatch(getUserTaskLists(list))
      })
      .catch(err => {
        let list = { [appId]: [] }
        dispatch(getUserTaskLists(list))
      })
  }
};

export const getInvolvedUserGroup = (orgId, userId) => {
  let url = encodeURI(`${APP_URL}/${orgId}/users/org_users/${userId}/user_involved_group`)
  if(!userId){
    return;
  }
  return dispatch => {
    return new Promise((resolve, reject) => {
      axios.get(url)
        .then(res => {
          dispatch(getInvolvedUserGroupResult(res.data.data))
          return resolve(res)
        })
        .catch(err => {
          if (err.response && err.response.status) {
            dispatch(taskFail(err.response))
            if (err.response.status !== 404) return reject(err);
            if (err.response.status !== 500) {
              dispatch(addToast('error', 'Error', err.response.data.message))
            } else dispatch(addToast('error', 'Error', 'Something went wrong!'))
          }

          return reject(err);

        })
    });
  }
}

/* TODO: Temporary fix. This is the check to verify that the user who is task assignee can only take action on the task. */

export const getTaskAction = (orgId, id, history, assignee, current_task_owner, isBulkAction = false, selectedTasks = []) => {
  return dispatch => {
    let url = `/custom-workflow/org/${orgId}/tasks/${id}`;
    let message = "You cannot take action on this task as this task is not assigned to you. Contact your System Administrator"
    if (assignee === current_task_owner || isBulkAction) {
      history.push({
        pathname: url,
        state: {
          isBulkAction,
          taskIds: selectedTasks
        }
      })
    } else {
      dispatch(addToast('error', 'Error', message))
      clientLogger.log({
        message: {
          error: "This user tried to take action on the task which is not assigned to him.",
          taskID: id,
          url: window.location.href,
          assignee: assignee,
          current_task_owner: current_task_owner
        }
      });
    }
  }
}

/* TODO: This is the extra check we are adding due to some folks can claim and able to complete the task which does not even belongs to their groups.
This will be the temporary fix & once we get the actual reasone for this problem we should remove this. */

export const claimTask = (orgId, id, history, assignee, current_task_owner, claimFailTaskRefreshHandler, isBulkAction = false, selectedTasks = []) => {
  return dispatch => {
    let groups_data = []
    let check_list = []
    let url = `${APP_URL}/${orgId}/proxy-bpm/task/${id}/identity`
    let message = 'You can not claim this task as this task is not assigned to your group. Contact your System Administrator'
    axios
      .get(
        url
      )
      .then((res) => {
        groups_data = res.data.data
        if (groups_data) {
          check_list = groups_data.map((group_data) => {
            if (group_data.group === null) {
              return true
            }
            let group_flag = false
            current_task_owner.involved_groups.forEach((group) => {
              if(group_data.group === group.id || group_data.group === group.key) {
               group_flag = true
              }
            })
            return group_flag
          });
        }
        if (check_list.includes(false)) {
          dispatch(addToast('error', 'Error', message))
          clientLogger.log({
            message: {
              error: "This task does not belongs to this user's group",
              taskID: id,
              url: window.location.href,
              assignee: assignee,
              current_task_owner: current_task_owner.userId
            }
          });
        } else {
          dispatch(getClaimTask(orgId, id, history, assignee, current_task_owner, claimFailTaskRefreshHandler, isBulkAction, selectedTasks))
        }
      })
      .catch(() => {
        dispatch(getClaimTask(orgId, id, history, assignee, current_task_owner, claimFailTaskRefreshHandler, isBulkAction, selectedTasks))
        clientLogger.log({
          message: {
            error: "This task is already completed or claimed by other user.",
            taskID: id,
            url: window.location.href,
            assignee: assignee,
            current_task_owner: current_task_owner.userId
          }
        });
      })
  }
}
