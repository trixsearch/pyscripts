import axios from "axios";
import * as actionTypes from "../actionTypes";
import { addToast } from '../../../components/Toast/actions';

export const ReportStart = () => {
  return {
    type: actionTypes.REPORT_START
  };
};

export const ReportSuccess = (data, name, id, formFeilds, config) => {
  return {
    type: actionTypes.REPORT_SUCCESS,
    data: data,
    name: name,
    id: id,
    formFeilds: formFeilds,
    config: config
  };
};
export const ReportAppSuccess = (data) => {
  return {
    type: actionTypes.REPORT_APP_SUCCESS,
    Appdata: data,
    lineChart: data
  };
};
export const ReportFilter = (data, name, id, formFields, config_view) => {
  return {
    type: actionTypes.REPORT_FILTER,
    data: data,
    name: name,
    id: id,
    formFeilds: formFields,
    config: config_view
  }
}
export const totalOnboarded = (data) => {
  return {
    type: actionTypes.REPORT_ONBOARDED,
    lineChart: data
  }
}
export const handlePieChartData = (data) => {
  return {
    type: actionTypes.REPORT_PIE_CHART,
    pieChart: data
  }
}

export const ReportError = (error) => {
  return {
    type: actionTypes.REPORT_ERROR,
    error: error
  };
};

export const ReportChart = (orgId, startMonth, startYear, endMonth, endYear) => {
  return dispatch => {
    let url = `${APP_URL}/${orgId}/apps/?is_global=true&page_count=100`;

    axios.get(url)
      .then(response => {
        if (response.data.data.length >= 1) {
          let name = response.data.data[0].name;
          let id = response.data.data[0].id;
          let data = response.data.data
          let formFeilds = response.data.data[0].selected_form_fields
          axios.get(
            `${APP_URL}/${orgId}/apps/chart/${response.data.data[0].id}?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`
          )
            .then(() => {
              axios.get(
                `${APP_URL}/${orgId}/apps/${id}/report_view`
              ).then((res) => {
                dispatch(ReportSuccess(data, name, id, formFeilds, res.data.data));
              }).catch(() => {
                dispatch(addToast('error', 'Error', 'Something went wrong!'))
              })
            })
            .catch(error => {
              dispatch(addToast('error', 'Error', 'Something went wrong!'))
              // eslint-disable-next-line no-console
              console.log(error);
              dispatch(ReportError(error));
            })
        }
      // eslint-disable-next-line no-console
      }).catch((err) => { console.log(err) })
  }
}

export const ReportfilterChart = (startMonth, startYear, endMonth, endYear, id, name, form) => {
  return dispatch => {
    axios.get(
      `/api/apps/chart/${id}?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`
    )
      .then(response => {
        axios.get(
          `/api/apps/${id}/report_view`
        ).then((res) => {
          dispatch(ReportFilter(response.data.data, name, id, form, res.data.data));
        }).catch(() => {
          dispatch(addToast('error', 'Error', 'Something went wrong!'))
        })
      })
      .catch(error => {
        dispatch(addToast('error', 'Error', 'Something went wrong!'))
        // eslint-disable-next-line no-console
        console.log(error);
        dispatch(ReportError(error));
      })
  }
}


export const TotalOnboarded = (startMonth, startYear, endMonth, endYear, id) => {
  return dispatch => {
    axios.get(
      `/api/apps/chart/${id}?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`
    )
      .then(response => {
        dispatch(totalOnboarded(response.data.data));
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.log(error);
        dispatch(ReportError(error));
      })
  }
}
export const handlePieChart = (startMonth, startYear, endMonth, endYear, id) => {
  return dispatch => {
    axios.get(
      `/api/apps/chart/${id}?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`
    )
      .then(response => {
        dispatch(handlePieChartData(response.data.data));
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.log(error);
        dispatch(ReportError(error));
      })
  }
}