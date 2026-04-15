import Axios from "axios";

import * as actionTypes from "../../actionTypes";

const APP_URL = process.env.REACT_APP_APP_URL;

export const chartStart = () => {
  return {
    type: actionTypes.CHART_START
  };
};

export const chartSuccess = (data) => {
  return {
    type: actionTypes.CHART_SUCCESS,
    data: data
  };
};
export const chartFilter = (data) => {
  return {
    type: actionTypes.CHART_FILTER,
    data: data
  }
}
export const chartError = (error) => {
  return {
    type: actionTypes.CHART_ERROR,
    error: error
  };
};

export const Chart = (orgId, startMonth, startYear, endMonth, endYear) => {
  return dispatch => {
    dispatch(chartStart());
    Axios.get(
      `${APP_URL}/${orgId}/apps/chart?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`
    )
      .then(response => {
        dispatch(chartSuccess(response.data));
      })
      .catch(error => {
        dispatch(chartError(error));
      })
  }
}

export const filterChart = (orgId, startMonth, startYear, endMonth, endYear, id) => {
  return dispatch => {
    dispatch(chartStart());
    Axios.get(
      // 'http://localhost:5000/mock_chart_dashboard'
      `${APP_URL}/${orgId}/apps/chart/${id}?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`
    )
      .then(response => {
        dispatch(chartFilter(response.data));
      })
      .catch(error => {
        dispatch(chartError(error));
      })
  }
}