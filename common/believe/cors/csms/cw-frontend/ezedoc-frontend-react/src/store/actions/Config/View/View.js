import axios from 'axios'

import { CONFIG_VIEW_JOB } from 'Data/constants'
import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

const setLoader = loader => ({
  type: actionTypes.JOB_EVENT_CONFIG_VIEW_LOADER,
  loader,
})

const getJobConfig = (data, size, filters, sorter, activeFilters, activeSorter) => ({
  type: actionTypes.GET_JOB_CONFIG,
  loader: false,
  jobConfigList: data.data,
  total2: data.pagination_data.total_count,
  size,
  filters,
  sorter,
  activeFilters,
  activeSorter,
})

const getEventConfig = (data, size2, filters2, sorter2, activeFilters2, activeSorter2) => ({
  type: actionTypes.GET_EVENT_CONFIG,
  loader: false,
  eventConfigList: data.data,
  total2: data.pagination_data.total_count,
  size2,
  filters2,
  sorter2,
  activeFilters2,
  activeSorter2,
})

const JobEventConfigDeleteSuccess = (pageType, id, renderPage) => ({
  type: pageType === CONFIG_VIEW_JOB ? actionTypes.DELETE_JOB_CONFIG : actionTypes.DELETE_EVENT_CONFIG,
  renderPage,
  id
})

const dashboardListSuccess = (data, page, size3, filters3, sorter3, activeFilters3, activeSorter3) => {
  return {
    type: actionTypes.CONFIG_DASHBOARD_VIEW,
    dashboardList: data.data,
    total: data.pagination_data.total_count,
    page,
    size3,
    filters3,
    sorter3,
    activeFilters3,
    activeSorter3,
  }
}

const processCountSuccess = (data) => {
  return {
    type: actionTypes.PROCESS_COUNT_SUCCESS,
    data
  }
}

const dashboardUpdateSuccess = (data) => {
  return {
    type: actionTypes.CONFIG_DASHBOARD_UPDATE,
    data
  }
}

const dynamicChartSuccess = (data, query) => {
  return {
    type: actionTypes.DYNAMIC_CHART_SUCCESS,
    data,
    query
  }
}

const dashboardDeleteSuccess = (id, renderPage) => {
  return {
    type: actionTypes.CONFIG_DASHBOARD_DELETE,
    renderPage,
    id
  }
}

const chartFail = () => {
  return {
    type: actionTypes.DYNAMIC_CHART_FAIL,
    chartError: true
  }
}

export const getApps = (orgId) => dispatch => new Promise((resolve, reject) => {
  dispatch({
    type: actionTypes.CONFIG_VIEW_LOADER,
    loader: true
  });

  axios.get(`${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`)
    .then(res => {
      resolve(res.data.data);
    })
    .catch(err => {
      reject(err.response);
      dispatch(addToast('error', 'Error', err.response.data.message))
    });
});

export const getProcessVariables = (orgId, id, type = '') => dispatch => new Promise((resolve, reject) => {
  dispatch({
    type: actionTypes.CONFIG_VIEW_LOADER,
    loader: true
  });
  let url = ''
  if (type === 'ENTITY') {
    url = `${APP_URL}/${orgId}/apps/${id}/config_view?type=entity`
  } else {
    url = `${APP_URL}/${orgId}/apps/${id}/config_view`
  }
  axios.get(url)
    .then(res => {
      resolve(res.data.data);
    })
    .catch(err => {
      reject(err.response.data);
      dispatch(addToast('error', 'Error', err.response.data.message))
    });
});

export const saveProcessVariables = (orgId, id, data, selected_forms, activeRoleId, processViewId) => dispatch => new Promise((resolve, reject) => {
  dispatch({
    type: actionTypes.CONFIG_VIEW_LOADER,
    loader: true
  })
  let patchforms = {
    "selected_form_fields": data,
    "selected_forms": selected_forms
  }
  let postforms = {
    "app": id,
    "role": activeRoleId,
    "selected_form_fields": data,
    "selected_forms": selected_forms
  }
  if (processViewId) {
    axios.put(`${APP_URL}/${orgId}/apps/process_view/${processViewId}`, patchforms)
      .then(res => {
        resolve(res.data.data)
        dispatch(addToast('success', 'Success', res.data.message))
      }).catch(err => {
        reject(err)
        dispatch(addToast('error', 'Error', err.response.data.message))
      })
  } else {
    axios.post(`${APP_URL}/${orgId}/apps/process_view`, postforms)
      .then(res => {
        resolve(res.data.data)
        dispatch(addToast('success', 'Success', res.data.message))
      }).catch(err => {
        reject(err)
        dispatch(addToast('error', 'Error', err.response.data.message))
      })
  }
})

export const processCount = (orgId, id) => dispatch => new Promise((resolve, reject) => {
  dispatch({
    type: actionTypes.PROCESS_COUNT_LOADER,
    loader: true
  })
  axios.get(`${APP_URL}/${orgId}/apps/count${id ? `/${id}` : ``}`)
    .then(res => {
      resolve(res.data.data)
      dispatch(processCountSuccess(res.data.data))
    }).catch(err => {
      reject(err)
      dispatch(addToast('error', 'Error', err.response.data.message))
    })
})

export const configDashboard = (orgId, name, description, role, widgets, id, history = null, nextPage = 1) => dispatch => new Promise((resolve, reject) => {

  let data = {
    "name": name,
    "description": description,
    "role": role,
    "grid_data": widgets
  }
  if (id) {
    axios.put(`${APP_URL}/${orgId}/config/dashboard/${id}`, data).then(res => {
      resolve(res.data.data)
      dispatch(dashboardUpdateSuccess(res.data.data))
      dispatch(addToast('success', 'Success', res.data.message))
      if (history) history.push(`/view?page=${nextPage}`)
    }).catch(err => {
      reject(err)
      dispatch(addToast('error', 'Error', err.response.data.message))
    })
  } else {
    axios.post(`${APP_URL}/${orgId}/config/dashboard`, data).then(res => {
      resolve(res.data.data)
      dispatch(addToast('success', 'Success', res.data.message))
      if (history) history.push(`/view?page=${nextPage}`)
    }).catch(err => {
      reject(err)
      dispatch(addToast('error', 'Error', err.response.data.message))
    })
  }
})


export const getConfigDashboard = (orgId, page=1, size3 = 10, filters3, sorter3, activeFilters3, activeSorter3, history)=>{
  return dispatch => {
    dispatch(setLoader(true))
    let url = `${APP_URL}/${orgId}/config/dashboard?page=${page}&page_count=${size3}`
      Object.keys(filters3).map(item => {
        
          url += `&${item}__icontains=${filters3[item]}`
      
      return null
      })

      if (sorter3) url += `&ordering=${sorter3}`
      axios.get(url).then(response => {
          if (response.data.data && response.data.pagination_data) dispatch(dashboardListSuccess(response.data, page, size3, filters3, sorter3, activeFilters3, activeSorter3));
          if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
              const total = response.data.total
              let nextPage
              if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
              else nextPage = Math.floor(total / 10)
              history.push({ pathname: '', search: `?page=${nextPage}` })
          }
      }).catch(err=>{
        dispatch(setLoader(false))
        if (err.response?.data.message) addToast('error', 'Error', err.response.data.message)
        else addToast('error', 'Error', 'Something went wrong')
      })
  }
}


export const deleteConfigDashboard = (orgId, id, total, itemsPerPage, page, renderPage) => {
  return dispatch => {
    dispatch(setLoader(true))
    axios.delete(`${APP_URL}/${orgId}/config/dashboard/${id}`).then((res) => {
      // Appending asterisk to the renderPage string data results in change in value of renderPage variable
      // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
      const expectedPage = Math.ceil((total - 1) / itemsPerPage)
      const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
      dispatch(dashboardDeleteSuccess(id, isRenderRequired))
      dispatch(addToast('success', 'Success', res.data.message))
    }).catch(err => {
      dispatch(setLoader(false))
      if (err.response) dispatch(addToast('error', 'Error', err.response.data.message))
    })
  }
}

export const getEntityModels = (orgId) => dispatch => new Promise((resolve, reject) => {
  axios
    .get(`${APP_URL}/${orgId}/entity/master?model_type=entities`)
    .then(res => {
      resolve(res.data.data);
    })
    .catch(err => {
      reject(err.response);
      dispatch(addToast('error', 'Error', err.response.data.message))
    });
})

export const getEntitySelectedDatas = (orgId, modelId, roleId) => dispatch => new Promise((resolve, reject) => {
  axios
    .get(`${APP_URL}/${orgId}/entity/master/entity_views/${modelId}/entity_view_data?role=${roleId}`)
    .then(res => {
      resolve(res.data.data);
    })
    .catch(err => {
      reject(err.response);
      dispatch(addToast('error', 'Error', err.response.data.message))
    });
})

export const saveEntityVariables = (
  orgId,
  activeRoleId,
  entityViewId,
  activeModelId,
  selectedForms,
  selectedFormFields,
  selectedEntityWorkflows
) => dispatch => new Promise((resolve, reject) => {
  let patchData = {
    "config_view": selectedFormFields,
    "selected_entity_forms": selectedForms,
    "entity_workflows": selectedEntityWorkflows
  }
  let postData = {
    "role": activeRoleId,
    "config_view": selectedFormFields,
    "entity_master_model": activeModelId,
    "selected_entity_forms": selectedForms,
    "entity_workflows": selectedEntityWorkflows
  }
  if (entityViewId) {
    axios.put(`${APP_URL}/${orgId}/entity/master/entity_views/${entityViewId}`, patchData)
      .then(res => {
        resolve(res.data.data)
        dispatch(addToast('success', 'Success', res.data.message))
      }).catch(err => {
        reject(err)
        dispatch(addToast('error', 'Error', err.response.data.message))
      })
  } else {
    axios.post(`${APP_URL}/${orgId}/entity/master/entity_views`, postData)
      .then(res => {
        resolve(res.data.data)
        dispatch(addToast('success', 'Success', res.data.message))
      }).catch(err => {
        reject(err)
        dispatch(addToast('error', 'Error', err.response.data.message))
      })
  }
})

export const getDynamicChart = (orgId, query) => dispatch => new Promise((resolve, reject) => {
  dispatch({
    type: actionTypes.CONFIG_VIEW_LOADER,
    loader: true
  })
  axios.post(`${APP_URL}/${orgId}/config/dashboard/widgets`, query)
    .then(res => {
      resolve(res)
      dispatch(dynamicChartSuccess(res.data.data, query))
    }).catch(err => {
      reject(err)
      dispatch(chartFail())
      dispatch(addToast('error', 'Error', err.response.data.message))
    })
})

export const unmountWidgetData = () => {
  return dispatch => {
    dispatch({
      type: actionTypes.UNMOUNT_WIDGET_DATA,
    })
  }
}

export const getJobEventChartConfigList = (orgId, pageType, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
  const apiSignature = pageType === CONFIG_VIEW_JOB ? 'job_config' : 'event_config'
  let url = `${APP_URL}/${orgId}/config/${apiSignature}?page=${page}&page_count=${size}`

  Object.keys(filters).forEach(item => {
    url += `&${item}__icontains=${filters[item]}`
  })

  if (sorter) url += `&ordering=${sorter}`

  return dispatch => {
    dispatch(setLoader(true))
    axios.get(url).then(response => {
      if (response.data.data && response.data.pagination_data) {
        if (pageType === CONFIG_VIEW_JOB) dispatch(getJobConfig(response.data, size, filters, sorter, activeFilters, activeSorter))
        else dispatch(getEventConfig(response.data, size, filters, sorter, activeFilters, activeSorter))
      }
      if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
        const total = response.data.total
        let nextPage
        if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
        else nextPage = Math.floor(total / 10)
        history.push({ pathname: '', search: `?page=${nextPage}` })
      }
    }).catch(err => {
      dispatch(setLoader(false))
      if (err.response?.data.message) addToast('error', 'Error', err.response.data.message)
      else addToast('error', 'Error', 'Something went wrong')
    })
  }
}

export const deleteJobEventChartConfig = (orgId, pageType, id, total, itemsPerPage, page, renderPage) => {
  return dispatch => {
    dispatch(setLoader(true))
    const apiSignature = pageType === CONFIG_VIEW_JOB ? 'job_config' : 'event_config'
    const url = `${APP_URL}/${orgId}/config/${apiSignature}/${id}`
    axios.delete(url).then(res => {
      dispatch(addToast('success', 'Success', res.data.message))
      // Appending asterisk to the renderPage string data results in change in value of renderPage variable
      // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
      const expectedPage = Math.ceil((total - 1) / itemsPerPage)
      const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
      dispatch(JobEventConfigDeleteSuccess(pageType, id, isRenderRequired))
    }).catch(err => {
      dispatch(setLoader(false))
      if (err.response?.data.message) addToast('error', 'Error', err.response.data.message)
      else addToast('error', 'Error', 'Something went wrong')
    })
  }
}
