import axios from "axios";

import * as actions from "../actionTypes";
import { getKeyValuePair, parseQueryString } from "../../../containers/utils";
import {REPORT_CHOICES} from "../../../Data/constants";
import { addToast } from '../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

const ReportStart = (loader) => ({
  type: actions.REPORT_START,
  loader
});

const ReportAppSuccess = data => ({
  type: actions.REPORT_APP_SUCCESS,
  data
});

const RetrieveReportsPage = (data,offset,size, filters, sorter, activeFilters, activeSorter,) => ({
  type: actions.RETRIEVE_REPORT_PAGINATION,
  data : data.data,
  active : offset,
  total: data.pagination_data.total_count,
  size,
  filters,
  sorter,
  activeFilters,
  activeSorter,
});
const DeleteReport = (id, renderPage) => ({
  type: actions.DELETE_REPORT,
  renderPage,
  id
});

const ReportError = (error, dispatch) => {
  if (error.response) {
    dispatch(addToast('error', 'Error', error.response.data.message))
    return {
      type: actions.REPORT_ERROR,
      error: error.response.data.message
    };
  }
  dispatch(addToast('error', 'Error', error.message || "Something went wrong, please try after sometime."))
  return {
    type: actions.REPORT_ERROR,
    error: error.message || "Something went wrong, please try after sometime."
  };
};
export const ReportAppDetails = (orgId) => {
  return dispatch => {
    dispatch(ReportStart(true));
    axios
      .get(`${APP_URL}/${orgId}/apps/`)
      .then(response => {
        dispatch(ReportAppSuccess(response.data.data));
      })
      .catch(error => {
        dispatch(ReportError(error, dispatch));
      });
  };
};

export const RetrieveReportsPagination = (orgId, page = 1, size = 10, filters, sorter, activeFilters, activeSorter, history) => {
  return dispatch => {
    dispatch(ReportStart(true));
    
    let url = `${APP_URL}/${orgId}/config/report/template?page=${page}&page_count=${size}`
    // let url = `http://localhost:5000/mock_report_list`//
    Object.keys(filters).map(item => {
      
          url += `&${item}__icontains=${filters[item]}`
      
      return null
  })

  if (sorter) url += `&ordering=${sorter}`
  axios.get(url).then(response => {
      if (response.data.data && response.data.pagination_data) dispatch(RetrieveReportsPage(response.data, page, size, filters, sorter, activeFilters, activeSorter));
      if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
          const total = response.data.total
          let nextPage
          if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
          else nextPage = Math.floor(total / 10)
          history.push({ pathname: '', search: `?page=${nextPage}` })
      }
  }).catch(error=>{
      dispatch(ReportError(error, dispatch))
  })

  };
};


export const saveReports = (orgId, reportVariables, state, history) => {
  return async dispatch => {
    dispatch(ReportStart(true));

    let { 
      name, description, currentWorkflow, query, process_fields, report_type, roles, userFilter, 
      isInvolved, processType, sendViaEmail, report_on, entity_master_model, entity_fields
    } = state;
    let orderedData = getKeyValuePair(reportVariables);
    process_fields = getKeyValuePair(process_fields);
    entity_fields = getKeyValuePair(entity_fields)
    
    let qData = query.filter(data=> !((data.attribute === '' || data.attribute === 'Select Attribute')&&(data.prompt === false)))
    query = qData.map(entry => ({ 
      ...entry, 
      value: entry.prompt ? "" : entry.value 
    }));
    let rolesData = roles.map(role=>{
      return role.value
    }) 
    let postData = {
      name,
      description,
      roles:rolesData,
      apps: currentWorkflow,
      query: { query },
      selected_fields: { selected_fields: orderedData, process_fields, entity_fields },
      report_type : REPORT_CHOICES.indexOf(report_type),
      user_filter : userFilter,
      is_involved: isInvolved, 
      process_type: processType,
      send_via_email: sendViaEmail,
      report_on:report_on,
      entity_master_model:entity_master_model
    };
    try {
      await axios
        .post(`${APP_URL}/${orgId}/config/report/template`, postData);
      dispatch(addToast('success', 'Success', 'Organisation Report template created successfully'));
      const { next = 1} = parseQueryString(history.location.search);
      history.push(`/custom-workflow/org/${orgId}/reports?page=${next}`);
    } catch (err) {
      dispatch(ReportError(err, dispatch));
    }
  };
};

export const editReports = (orgId, id, orderedData, state, history) => {
  return async dispatch => {
    dispatch(ReportStart(true));
    let { 
      name, description, currentWorkflow, query, process_fields, report_type, roles, userFilter, 
      isInvolved, processType, sendViaEmail, report_on, entity_master_model, entity_fields
    } = state;

    let qData = query.filter(data=> !((data.attribute === '' || data.attribute === 'Select Attribute')&&(data.prompt === false)))
    query = qData.map(entry => ({ 
      ...entry, 
      value: entry.prompt ? "" : entry.value
    }));

    let reportVariables = getKeyValuePair(orderedData);
    process_fields = getKeyValuePair(process_fields);
    entity_fields = getKeyValuePair(entity_fields)
    let rolesData = roles?.map(role => {
      return role.value
    }) 
    let postData = {
      name, 
      description, 
      roles:rolesData,
      apps: currentWorkflow, 
      query: { query },
      selected_fields: { selected_fields: reportVariables, process_fields, entity_fields },
      report_type: REPORT_CHOICES.indexOf(report_type),
      user_filter : userFilter,
      is_involved: isInvolved, 
      process_type: processType,
      send_via_email: sendViaEmail,
      report_on:report_on,
      entity_master_model:entity_master_model
    }

    try {
      await axios.put(`${APP_URL}/${orgId}/config/report/template/${id}`, postData);
      dispatch(addToast('success', 'Success', 'Organisation Report template updated successfully'))
      const { next = 1} = parseQueryString(history.location.search);
      history.push(`/custom-workflow/org/${orgId}/reports?page=${next}`);
    } catch (error) {
      dispatch(ReportError(error, dispatch));
    }
  }
};

export const downloadReports = (orgId, id, postData, send_via_email, report_on, showReportDownload, hideReportDownload, callBack = undefined) => {
  return async dispatch => {
  try {
    dispatch(ReportStart(true));
    let url = ''
    if (report_on === 'PROCESS') {
      url = `${APP_URL}/${orgId}/config/report/${id}/report_download`
    } else if(report_on === 'INVENTORY') {
      url = `${APP_URL}/${orgId}/config/report/${id}/inventory`
    } else if(report_on === 'BGV') {
      url = `${APP_URL}/${orgId}/config/report/${id}/bgv`
    } else{
      url = `${APP_URL}/${orgId}/config/report/${id}/entity_report_download`
    }
    let reqData = {
      url: url,
      method: "POST",
      data: postData
    }
    const response = await axios(reqData);
    if(send_via_email) {
      dispatch(addToast('success', 'Success', response.data.message))
    }else {
      dispatch(ReportStart(true));
      showReportDownload(id);
      dispatch(addToast('success', 'Success', response.data.message))
    }
    dispatch(ReportStart(false));
    return response.data
  }catch (e) {
    dispatch(ReportStart(false));
    hideReportDownload();
    dispatch(addToast('error', 'Error', e.response.data.message))
    return e.response.data
  }finally {
    if (callBack)
      callBack()
  }
}
};

export const deleteReport = (orgId, id, total, itemsPerPage, page, renderPage)=>{
  return dispatch =>{
      dispatch(ReportStart(true))
    axios.delete(`${APP_URL}/${orgId}/config/report/template/${id}`).then(() => {
          // Appending asterisk to the renderPage string data results in change in value of renderPage variable
          // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
          const expectedPage = Math.ceil((total - 1) / itemsPerPage)
          const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
          dispatch(DeleteReport(id, isRenderRequired))
          dispatch(addToast('success', 'Success', 'Organisation Report template deleted successfully'))
      }).catch(err=>{
          dispatch(ReportError(err, dispatch))
      })
  }
}

export const RetrieveReportVariables = (loader=false) => {
  return async dispatch => {
    dispatch(ReportStart(loader));
  }
}
