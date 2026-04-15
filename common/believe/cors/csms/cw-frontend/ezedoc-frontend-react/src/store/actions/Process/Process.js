/* eslint-disable max-len */
/* eslint-disable react-hooks/exhaustive-deps */

import axios from "axios";
import {emailPhone} from "containers/utils";

import * as actionTypes from "../actionTypes";

import { 
  ONGOING_PROCESS,
  COMPLETED_PROCESS,
  WITHDRAWN_PROCESS,

  DEFAULT_PAGE_SIZE,
} from "../../../Data/constants"
import { addToast } from '../../../components/Toast/actions';
import { getUrlVars, isCompletedWithdrawnActive } from "../../../containers/utils";

const APP_URL = process.env.REACT_APP_APP_URL;
const SIZE = 5;

export const processStart = (app) => {
  return {
    type: actionTypes.PROCESS_START,
    appLoading: app
  }
}

export const processSuccess = (process, currentProcess ,ongoing = null,completed = null, withdrawn=null, process_key= "", process_type = ONGOING_PROCESS,name, page, pageSize = DEFAULT_PAGE_SIZE, filterOptions, selectedOption, processStateFilter) => {
  let allAppsAdvFilterQuery = {}
  process.data.data.map(workflow => {
    let processKey = workflow.process_key
    allAppsAdvFilterQuery[processKey] = process?.data?.filter_query ? process?.data?.filter_query[processKey] || {} : {}
    return null
  })
  return {
    type: actionTypes.PROCESS_SUCCESS,
    apps: process.data.data,
    name:name,
    app:currentProcess,
    process_type:process_type,
    withdrawn: withdrawn? withdrawn.data.data.data : [],
    withdrawnCount: withdrawn ? withdrawn.data.data.total : 0,
    ongoing:ongoing? ongoing.data.data.data : [],
    ongoingCount:ongoing? ongoing.data.data.total : 0,
    completed:completed? completed.data.data.data : [],
    completedCount:completed? completed.data.data.total : 0,
    process_key:process_key,
    selected_card_list : [],
    offset: page,
    size : pageSize,
    filterOptions,
    selectedOption,
    processStateFilter,
    allAppsAdvFilterQuery
  };
};

export const updateAdvancedFilter = (
  processKey, filterQuery, ongoing = null, completed = null, withdrawn = null
) => {
  return {
    type: actionTypes.UPDATE_ADVANCED_FILTER,
    ongoing: ongoing ? ongoing.data.data.data : [],
    completed: completed ? completed.data.data.data : [],
    withdrawn: withdrawn ? withdrawn.data.data.data : [],
    ongoingCount: ongoing ? ongoing.data.data.total : 0,
    completedCount: completed ? completed.data.data.total : 0,
    withdrawnCount: withdrawn ? withdrawn.data.data.total : 0,
    processKey,
    filterQuery,
  }
}

export const processDetailsOngoing = (ongoing,offset, size) => {
  return {
    type: actionTypes.PROCESS_DETAILS_PAGINATION,
    ongoing:ongoing.data.data.data,
    total: ongoing.data.data.total,
    offset :offset, 
    size: size
  };
};

export const processKeyUpdate =(process_key)=>{
  return {
    type:actionTypes.PROCESS_KEY_UPDATE,
    process_key:process_key
  }
}

export const selectApp =(app={}, updateLoader)=>{
  return {
    type: actionTypes.SELECT_APP,
    appData: app,
    process_key: app.process_key,
    updateLoader
  }
}

export const processWithdraw = (id) => {
  return {
    type: actionTypes.PROCESS_WITHDRAW,
    id
  }
}

export const processDetailsCompleted = (completed,offset, size) => {
  return {
    type: actionTypes.PROCESS_DETAILS_COMPLETED,
    completed:completed.data.data.data,
    total: completed.data.data.total,
    offset :offset,
    size: size
  };
};


export const clearAllSelected = () => {
  return {
    type: actionTypes.CLEAR_ALL,
    clearAll:[],
  };
};

export const selectedProcessType = (processType) => {
  return {
    type: actionTypes.SELECT_DETAILS,
    processType,
  };
}

export const selectedprocessCard = (event,id,email,phone,switchAll) => {
  return {
    type: actionTypes.SELECT_CARD_DETAILS,
    event :event ,
    id :id ,
    email : email,
    phone :phone,
    selected_all : switchAll
  };
}

export const selectedCardsList = (selected_all) => {
  return {
    type: actionTypes.SELECT_CARD_ALL,
    selected_all : selected_all,
  };
}

export const getMyApps = (apps) => async (dispatch) => {
    return dispatch({
      type: actionTypes.PROCESS_APPS,
      apps,
    });
};

  
export const processDetails = (app,name = null,ongoing=null,completed=null, withdrawn=null,process_key="", filteredOptions, selectedOption, processStateFilter, size) => {
  return {
    type: actionTypes.PROCESS_DETAILS,
    name:name,
    withdrawn: withdrawn? withdrawn.data.data.data : [],
    withdrawnCount: withdrawn ? withdrawn.data.data.total : 0, 
    ongoing:ongoing? ongoing.data.data.data : [],
    ongoingCount:ongoing ? ongoing.data.data.total : 0,
    completed:completed? completed.data.data.data : [],
    completedCount:completed ? completed.data.data.total : 0,
    process_key:process_key,
    app: app.data.data,
    filteredOptions,
    selectedOption,
    processStateFilter,
    size
  };
};


export const startProcessForm = (formData,submission_data) => {
  return {
    type : actionTypes.START_PROCESS_FORM,
    formData : formData,
    submission_data
  }
}  

export const startFormError = () => {
  return {
    type : actionTypes.START_PROCESS_ERROR,
  } 

}
export const processLaunch = (data) => {
  return {
    type: actionTypes.PROCESS_LAUNCH,
    data: data
  };
};

export const processFail = (error) => {
  return {
    type: actionTypes.PROCESS_ERROR,
    error: error
  };
};

export const processLaunchFail =() => {
  return {
    type : actionTypes.PROCESS_LAUNCH_ERROR,
  }
}

const processDetailsWithdrawn = (withdrawn, offset, size) => {
  return {
    type: actionTypes.WITHDRAWN_PROCESS_PAGINATION,
    withdrawn:withdrawn.data.data.data,
    total: withdrawn.data.data.total,
    offset,
    size
  }
}

const taskUsers = (data) => {
  return {
    type: actionTypes.GET_TASK_USERS,
    data
  }
}
  
export const processSearchResult = (results, processType, searchData, page, size) => {
  return {
    type    : actionTypes.PROCESS_SEARCH,
    results : results.data.data,
    searchData,
    processType,
    offset  : page,
    size: size
  }
}

export const processSearchResultCount =(processType, count, data) =>{
  return {
    type    : actionTypes.PROCESS_SEARCH_COUNT,
    count   : count,
    process_type : processType,
    data    :data
  }
}

export const clearProcessSearchResult = () => {
  return {
    type  : actionTypes.CLEAR_SEARCH
  }
}

export const getAllApps = (orgId) => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      dispatch(processStart(true))
      const processData = getState().process;
      return axios.get(
        `${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`
      ).then(process => {
        dispatch(getMyApps(process?.data?.data))
        let selectedApp = process?.data?.data?.find(appData => appData?.process_key === (processData?.process_key || processData?.appData?.process_key)) || 
        process?.data?.data[0];
        const urlVar = getUrlVars();
        if(urlVar.process_key && urlVar?.process_key !== selectedApp?.process_key){
          selectedApp = process?.data?.data?.find(appData => appData?.process_key === urlVar?.process_key) || 
          process?.data?.data[0];
        }
        dispatch(
          selectedProcessType(
            isCompletedWithdrawnActive() ?
            urlVar?.processType?.replace("%20"," ") || ONGOING_PROCESS :
            ONGOING_PROCESS
          )
        )
        dispatch(selectApp(selectedApp, true))
        return resolve()
      })
      .catch((err) => {
        dispatch(selectApp(null, true))
        if (err.response && err.response.status) {
          if (err.response.status !== 500) {
            dispatch(addToast('error', 'Error', err.response.data.message))
          } else {
            dispatch(addToast('error', 'Error', 'Something Went Wrong!'))
          }
        }
        return reject()
      })
    })
  }
}

export const getAllProcess = (props) => {
  const {
    processType1:type,
    page, 
    pageSize, 
    processFilter:filters, 
    selectedOption:selectedFilter,
    orgId,
    vTenantId
  }=props
  // processKey, type, page, pageSize, filters, selectedFilter,selectedOptionProp,orgId
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      dispatch(processStart())
      const processData = getState().process;
      let updateApp = false;
      let processKey = processData?.appData?.process_key;
      return axios.get(
        `${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`
      ).then(process => {
        let process_key
        let process_type
        let name 
        let id
        let currentProcess = []
        let start = 0
        let advFilterQuery = {};

        if(updateApp){
          dispatch(getMyApps(process?.data?.data))
        }

        if(page > 1) {
          start = (page - 1) * pageSize;
        }
        let selectedApp = ""
        let processStateFilter = null
        if (processKey) {
          selectedApp = processKey
        }else{
          selectedApp = process.data?.data?.[0]?.process_key
        }
        if (process?.data?.filterData?.processStateFilter) {
          processStateFilter = process.data.filterData.processStateFilter
        }
        
        let click_process =process.data.data.filter(app => app.process_key === selectedApp)
        if(click_process.length) {  
          process_key =click_process[0].process_key;
          currentProcess = click_process[0]
          name = click_process[0].name
          id = click_process[0].id
          advFilterQuery = process.data.filter_query 
          ? process.data.filter_query[process_key] || {} : {}
        } else{
          process_key = process?.data?.data[0]?.process_key;
          name = process.data.data[0].name
          currentProcess = process.data.data[0]
          id = process.data.data[0].id
          advFilterQuery = process.data.filter_query 
          ? process.data.filter_query[process_key] || {} : {}
        }
        // if(type)
        //     process_type = type
        //   else{
            process_type ="Ongoing process"
          // }
        let activeFilter = '';
        let filterOptions = [];
        let selectedOption = '';
        if (filters && process_key in filters) {
          let processFilter = filters[process_key];
          if(Array.isArray(processFilter) && processFilter.length>1) {
            if (selectedFilter) {
              activeFilter = `?filter=${selectedFilter}`;
              selectedOption = selectedFilter;
              filterOptions = processFilter;
            }else{
            activeFilter = `?filter=${processFilter[0]}`;
            selectedOption = processFilter[0];
            filterOptions = processFilter;
            }
          }
        }
        if(vTenantId){
          if(activeFilter){
            activeFilter +=  `&vendor_policy=${vTenantId}`
          } else {
            activeFilter = `?vendor_policy=${vTenantId}`
          }
        }

        if(!process_key){
          return;
        }

        function completed() {
          let payload = {
            processDefinitionKey: process_key,
            start: start,
            size: pageSize,
            sort: "endTime",
            order: "desc",
            finished: true,
            deleted: false,
            includeProcessVariables: true,
            filter_query: advFilterQuery
          }
          
          // return axios.post(`http://localhost:5000/mock_completed`, payload) //
          return axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
        }
        function ongoing() {
            let payload = {
                processDefinitionKey: process_key,
                start: start,
                size: pageSize,
                sort: "startTime",
                order: "desc",
                finished: false,
                deleted: false,
                includeProcessVariables: true,
                selectedState: processStateFilter,
                filter_query: advFilterQuery
              }
              // return axios.post(`http://localhost:5000/mock_ongoing`, payload) //
          return axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
            }
          function withdrawn() {
            let payload = {
              processDefinitionKey: process_key,
              start: start,
              size: pageSize,
              sort: "endTime",
              order: "desc",
              finished: true,
              deleted: true,
              includeProcessVariables: true,
              filter_query: advFilterQuery
            }
            // return axios.post(`http://localhost:5000/mock_withdrawn`, payload) //
            return axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
            }

          axios.all([ongoing()/*, completed(), withdrawn()*/])
              .then(res => {
              dispatch(processSuccess(
                process, currentProcess, res[0], null, null, 
                process_key, process_type, name, page, pageSize, filterOptions, selectedOption, 
                processStateFilter
              ))
              return resolve()
            })
            .catch((err) => {
              dispatch(processSuccess(
                process, null, null, null, null, 
                process_key, process_type, name, [], null
                ));
              if (err.response && err.response.status) {
              if (err.response.status !== 500) {
                dispatch(addToast('error', 'Error', err.response.data.message))
              } else {
                dispatch(addToast('error', 'Error', 'Something Went Wrong!'))
              }
            }
              return resolve()
            })
      }).catch(err => {
        dispatch(processFail(err.response))
        if (err.response && err.response.status) {
          if (err.response.status !== 500) {
            dispatch(addToast('error', 'Error', err.response.data.message))
          } else {
            dispatch(addToast('error', 'Error', 'Something Went Wrong!'))
          }
        }
        return reject()
      })
    })
  }
}

export const withdrawProcess = (id, comment, page, processKey, pageSize, history, orgId) => {
  return (dispatch, getState) => {
    const pageNum = Number(page)
    const processType = getState().process.processType
    const ongoingDataCount = getState().process.ongoingCount
    dispatch(processStart());
    let url = `${APP_URL}/${orgId}/proxy-bpm/process-instances/delete/${id}?deleteReason=${comment}`
    axios
    .delete(
      url
    )
    .then((response) => {
      dispatch(processWithdraw(id));
      dispatch(addToast('success', 'Success', response.data.message))

      const lastPage = Math.ceil(ongoingDataCount / 5)

      const pageNumber = ((ongoingDataCount % 5 === 1) && (lastPage === pageNum)) ? pageNum - 1 : pageNum

    })
    .catch(err => {
      dispatch(addToast('error', 'Error', err.response.data.message))
      dispatch(processFail(err.response));
    })
  }
}

export const getFilterProcess = (props) => {
  const {
    orgId,
    processType,
    name,
    id,
    processKey,
    pageSize,
    filters,
    selectedFilter,
    selectedState,
    vTenantId
  }=props
  return (dispatch, getState) => {
      dispatch(processStart())
      let activeFilter = '';
      let filterOptions = null;
      let selectedOption = '';
      let processStateFilter = null;
    let advFilterQuery = getState().process.allAppsAdvFilterQuery[processKey]
      if (selectedState) {
        processStateFilter = selectedState
      }
    if (filters && processKey in filters) {
      let processFilter = filters[processKey];
        if(Array.isArray(processFilter) && processFilter.length>1) {
          if (selectedFilter) {
            activeFilter = `?filter=${selectedFilter}`;
            selectedOption = selectedFilter;
          }else {
            activeFilter = `?filter=${processFilter[0]}`;
            selectedOption = processFilter[0];
          }
          filterOptions = processFilter;
        }
      }
      if(vTenantId){
        if(activeFilter){
          activeFilter +=  `&vendor_policy=${vTenantId}`
        } else {
          activeFilter = `?vendor_policy=${vTenantId}`
        }
      }
      if(!processKey){
        return;
      }
    axios.get(`${APP_URL}/${orgId}/apps/${id}`).then(app => {
        let size = pageSize || SIZE
        function completed() {
          let payload = {
            processDefinitionKey: processKey,
            start: 0,
            size: processType === COMPLETED_PROCESS ? size : 0,
            sort: "endTime",
            order: "desc",
            finished: true,
            deleted: false,
            includeProcessVariables: true,
            filter_query: advFilterQuery
          }
          return axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
        }
        function ongoing() {
          let payload = {
            processDefinitionKey: processKey,
            start: 0,
            size: processType === ONGOING_PROCESS ? size : 0,
            sort: "startTime",
            order: "desc",
            finished: false,
            deleted: false,
            includeProcessVariables: true,
            selectedState: processStateFilter,
            filter_query: advFilterQuery
          }
          return axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
            }
          function withdrawn() {
            let payload = {
              processDefinitionKey: processKey,
              start: 0,
              size: processType === WITHDRAWN_PROCESS ? size : 0,
              sort: "endTime",
              order: "desc",
              finished: true,
              deleted: true,
              includeProcessVariables: true,
              filter_query: advFilterQuery
            }
            return axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
            }
          axios.all([ongoing(), completed(), withdrawn()])
          .then(res => {                       
              dispatch(processDetails(
                app, name, res[0], res[1], res[2], processKey, 
                filterOptions, selectedOption, processStateFilter, size
              ));
            })
            .catch((err) => {
              dispatch(processDetails(app, name, null, null, null, processKey, [], null, size));
              if (err.response && err.response.status) {
                if (err.response.status !== 500) {
                  dispatch(addToast('error', 'Error', err.response.data.message))
                } else {
                  dispatch(addToast('error', 'Error', 'Something Went Wrong!'))
                }
              }
          })
      })
      .catch(err=>{
        dispatch(processFail(err.response))
        if (err.response && err.response.status) {
          if (err.response.status !== 500) {
            dispatch(addToast('error', 'Error', err.response.data.message))
          } else {
            dispatch(addToast('error', 'Error', 'Something Went Wrong!'))
          }
        }
      })
  }
}

export const updateAdvancedFilteredData = (appData, filterQuery) => {
  return dispatch => {
    dispatch(processStart())

    function ongoing() {
      let payload = {
        processDefinitionKey: appData.process_key,
        start: 0,
        size: SIZE,
        sort: "startTime",
        order: "desc",
        finished: false,
        deleted: false,
        includeProcessVariables: true,
        filter_query: filterQuery
      }
      // return axios.post(`http://localhost:5000/process-instance`, payload)
      return axios.post('/api/apps/process-instances', payload)
    }

    function completed() {
      let payload = {
        processDefinitionKey: appData.process_key,
        start: 0,
        size: SIZE,
        sort: "endTime",
        order: "desc",
        finished: true,
        deleted: false,
        includeProcessVariables: true,
        filter_query: filterQuery
      }
      // return axios.post(`http://localhost:5000/process-instance`, payload)
      return axios.post('/api/apps/process-instances', payload)
    }

    function withdrawn() {
      let payload = {
        processDefinitionKey: appData.process_key,
        start: 0,
        size: SIZE,
        sort: "endTime",
        order: "desc",
        finished: true,
        deleted: true,
        includeProcessVariables: true,
        filter_query: filterQuery
      }
      // return axios.post(`http://localhost:5000/process-instance`, payload)
      return axios.post('/api/apps/process-instances', payload)
    }

    if (appData.view_permission) {
      axios.all([ongoing(), completed(), withdrawn()])
        .then(res => {
            dispatch(
              updateAdvancedFilter(appData.process_key, filterQuery, res[0], res[1], res[2])
            );
          })
          .catch((err) => {
            dispatch(updateAdvancedFilter(appData.process_key, filterQuery));
            if (err.response && err.response.status) {
              if (err.response.status !== 500) {
                dispatch(addToast('error', 'Error', err.response.data.message))
              } else {
                dispatch(addToast('error', 'Error', 'Something Went Wrong!'))
              }
            }
        })
    } else {
      dispatch(processFail('Doesn\'t have permission to perform this action'))
    }
  }
}

export const getProcessOngoing = (
  offset,process_key, pageSize, filter, processStateFilter = null, orgId, vTenantId
  ) => {
  return (dispatch, getState) => {
    if(!process_key){
      return;
    }
    let advFilterQuery = getState().process.allAppsAdvFilterQuery[process_key] || {};
      dispatch(processStart())
      let size = pageSize || SIZE;
      let page =(offset-1)*size;
      let payload = {
        processDefinitionKey: process_key,
        start: page < 0 ? 0 : page,
        size: size,
        sort: "startTime",
        order: "desc",
        finished: false,
        deleted: false,
        includeProcessVariables: true,
        selectedState: processStateFilter,
        filter_query: advFilterQuery
      }
      let activeFilter = '';
      if(filter) {
        activeFilter = `?filter=${filter}`
      }

      if(vTenantId){
        if(activeFilter){
          activeFilter +=  `&vendor_policy=${vTenantId}`
        } else {
          activeFilter = `?vendor_policy=${vTenantId}`
        }
      }
      
    axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
        .then(ongoing=>{
          
          dispatch(processDetailsOngoing(ongoing,offset, size))
      })
      .catch(err=>{
          dispatch(processFail(err.response))
      })
  }
  
}
export const getProcessOngoingAll = (process_key,size,cards, filter, vTenantId)=>{
  return (dispatch, getState) => {
    if(!process_key){
      return;
    }
    let advFilterQuery = getState().process.allAppsAdvFilterQuery[process_key]
      // dispatch(processStart())
      let payload = {
        processDefinitionKey: process_key,
        start: 0,
        size: size,
        sort: "startTime",
        order: "desc",
        finished: false,
        deleted: false,
        includeProcessVariables: true,
        filter_query: advFilterQuery
      }
      let activeFilter = '';
      if(filter) {
        activeFilter = `?filter=${filter}`
      }
      if(vTenantId){
        if(activeFilter){
          activeFilter +=  `&vendor_policy=${vTenantId}`
        } else {
          activeFilter = `?vendor_policy=${vTenantId}`
        }
      }
      axios.post(`/api/apps/process-instances${activeFilter}`, payload)
        .then(ongoing=>{
        let result = emailPhone(ongoing.data.data.data)
        dispatch(selectedCardsList(result))
        
      })
      .catch(err=>{
          dispatch(processFail(err.response))
      })
  }
}

export const getProcessCompleted = (offset,process_key, pageSize, filter, orgId, vTenantId)=>{
  return (dispatch, getState) => {
    if(!process_key){
      return;
    }
    let advFilterQuery = getState().process.allAppsAdvFilterQuery[process_key]
    dispatch(processStart())
    let size = pageSize || SIZE;
    let page =(offset-1)*size;
    let payload = {
      processDefinitionKey: process_key,
      start: page < 0 ? 0 : page,
      size: size,
      sort: "endTime",
      order: "desc",
      finished: true,
      deleted: false,
      includeProcessVariables: true,
      filter_query: advFilterQuery
    }
    let activeFilter = '';
    if(filter) {
      activeFilter = `?filter=${filter}`
    }
    if(vTenantId){
      if(activeFilter){
        activeFilter +=  `&vendor_policy=${vTenantId}`
      } else {
        activeFilter = `?vendor_policy=${vTenantId}`
      }
    }
    // axios.post(`http://localhost:5000/process-instance`, payload)
    axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
    .then(completed=>{
        dispatch(processDetailsCompleted(completed,offset, size))
    })
    .catch(err=>{
        dispatch(processFail(err.response.data))
    })
  }
}

export const getProcessWithdrawn = (offset, process_key, pageSize, filter, orgId, vTenantId) => {
  return (dispatch, getState) => {
    if(!process_key){
      return;
    }
    let advFilterQuery = getState().process.allAppsAdvFilterQuery[process_key]
    dispatch(processStart());
    let size = pageSize || SIZE;
    let page = (offset-1)*size;
    let payload = {
      processDefinitionKey: process_key,
      start: page < 0 ? 0 : page,
      size: size,
      sort: "endTime",
      order: "desc",
      finished: true,
      deleted: true,
      includeProcessVariables: true,
      filter_query: advFilterQuery
    }
    let activeFilter = '';
    if(filter) {
      activeFilter = `?filter=${filter}`
    }
    if(vTenantId){
      if(activeFilter){
        activeFilter +=  `&vendor_policy=${vTenantId}`
      } else {
        activeFilter = `?vendor_policy=${vTenantId}`
      }
    }
    // axios.post(`http://localhost:5000/process-instance`, payload)
    axios.post(`${APP_URL}/${orgId}/apps/process-instances${activeFilter}`, payload)
    .then(withdrawn => {
      dispatch(processDetailsWithdrawn(withdrawn, offset, size))
    })
    .catch(err => {
      dispatch(processFail(err.response.data))
    })

  }
}

export const onHandleStore = (event,id,email,phone,switchAll)=>{
  return dispatch =>{
    dispatch(selectedprocessCard(event,id,email,phone,switchAll))
  }
}


export const clearAll = ()=> {
  return dispatch =>{
    dispatch(clearAllSelected())
  }
}

export const selectedProcess = (processType)=>{
  return dispatch =>{
    dispatch(selectedProcessType(processType))
  }
}

export const getTaskUsers = (orgId) => {
  return async dispatch => {
    try {
      // const res = await axios.get(`http://localhost:5000/task_user_mock`);
      const res = await axios.get(`${APP_URL}/${orgId}/users/org_users/task_users`);
      dispatch(taskUsers(res.data.data));
    } catch (e) {
      dispatch(addToast('error', 'Error', 'Failed to get task users!'))
    }
  }
}

export const searchProcess = (...args) => {
  const [isNewSearchData, processId, processType, searchData, pageNo = null, pageSize, filter, orgId]=args
  return dispatch => {
    dispatch(processStart())
    let page = Number(pageNo)
    let start = page ? (page - 1) * pageSize : 0;
    let size = pageSize || SIZE

    let searchFilter = '';
    if(filter) {
      searchFilter = `&filter=${filter}`;
    }  

    if(processType === "Ongoing process") {
      axios
        .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=${processType}&start=${start}&size=${size}&order=desc&sort=startTime${searchFilter}`, searchData)
      .then(res => {
        dispatch(processSearchResult(res, processType, searchData, page, size));
      }).catch(err => {
        dispatch(processFail(err.response))
      })
      if (isNewSearchData) {
      axios
        .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=Completed process&start=${start}&size=${0}&order=desc&sort=endTime${searchFilter}`, searchData)
      .then(res1 => {
        let process_type = "Completed process"
        let count = res1.data.data.completed.total
        let data = res1.data.data.completed.data
        dispatch(processSearchResultCount(process_type, count, data));
      })
      axios
        .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=Withdrawn process&start=${start}&size=${0}&order=desc&sort=endTime${searchFilter}`, searchData)
      .then(res2 => {
        let process_type = "Withdrawn process"
        let count = res2.data.data.withdrawn.total
        let data = res2.data.data.withdrawn.data
        dispatch(processSearchResultCount(process_type, count, data));
    }).catch(err => {
      dispatch(processFail(err.response))
    })
  }
      
    } else if(processType === "Completed process") {
      axios
        .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=${processType}&start=${start}&size=${size}&order=desc&sort=endTime${searchFilter}`, searchData)
        .then(res => {
          dispatch(processSearchResult(res, processType, searchData, page, size));
        })
        if (isNewSearchData) {
        axios
          .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=Ongoing process&start=${start}&size=${0}&order=desc&sort=startTime${searchFilter}`, searchData)
        .then(res1 => {
          let process_type = "Ongoing process"
          let count = res1.data.data.ongoing.total
          let data = res1.data.data.ongoing.data
          dispatch(processSearchResultCount(process_type, count, data));
        })
        axios
          .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=Withdrawn process&start=${start}&size=${0}&order=desc&sort=endTime${searchFilter}`, searchData)
        .then(res2 => {
          let process_type = "Withdrawn process"
          let count = res2.data.data.withdrawn.total
          let data = res2.data.data.withdrawn.data
          dispatch(processSearchResultCount(process_type, count, data));
      })
        .catch(err => {
          dispatch(processFail(err.response))
        })
      }
      } else if(processType === "Withdrawn process") {
        axios
          .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=${processType}&start=${start}&size=${size}&order=desc&sort=endTime${searchFilter}`, searchData)
          .then(res => {
            dispatch(processSearchResult(res, processType, searchData, page, size));
          })
          if (isNewSearchData) {
          axios
            .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=Ongoing process&start=${start}&size=${0}&order=desc&sort=startTime${searchFilter}`, searchData)
          .then(res1 => {
            let process_type = "Ongoing process"
            let count = res1.data.data.ongoing.total
            let data = res1.data.data.ongoing.data
            dispatch(processSearchResultCount(process_type, count, data));
          })
          axios
            .post(`${APP_URL}/${orgId}/apps/${processId}/search?process_type=Completed process&start=${start}&size=${0}&order=desc&sort=endTime${searchFilter}`, searchData)
          .then(res2 => {
            let process_type = "Completed process"
            let count = res2.data.data.completed.total
            let data = res2.data.data.completed.data
            dispatch(processSearchResultCount(process_type, count, data));
        })
          .catch(err => {
            dispatch(processFail(err.response))
          })
        }
        }
  }
}

export const clearSearch = () => {
  return dispatch => {
    dispatch(clearProcessSearchResult())
  }
}

export const setProcessFilter = (filteredOptions,selectedOption) => {
  return dispatch => {
    dispatch({
      type: actionTypes.FILTER_FROM_DASHBOARD,
      filteredOptions,
      selectedOption
    })
  }
}

export const toggleProcessSearchBar = (show) => {
  return dispatch => {
    dispatch({
      type: actionTypes.TOGGLE_PROCESS_SEARCH_BAR,
      show
    })
  }
}

export const updateSearchData = (searchData) => {
  return dispatch => {
    dispatch({
      type: actionTypes.UPDATE_SEARCH_DATA,
      searchData
    })
  }
}

export const clearAllProcess = () => {
  return dispatch => {
    dispatch({
      type: actionTypes.CLEAR_ALL_PROCESS,
    })
  }
}