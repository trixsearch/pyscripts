/* eslint-disable no-console */
import axios from "axios";
import { addToast } from "components/Toast/actions";

import * as actionTypes from "../actionTypes";
import '../../authConfig';

export const orglogoStart = () => {
  return {
    type: actionTypes.ORGLOGO_START,
  };
};

export const orglogoSuccess = (data) => {
  return {
    type: actionTypes.ORGLOGO_SUCCESS,
    logo: data.logo,
    name: data.name,
    showOrgName: data.show_org_name,
    createdAt: data.created_at,
    id: data.id,
    assets_opacity: data.assets_opacity,
    first_primary_color: data.first_primary_color,
    second_primary_color: data.second_primary_color,
    icon_color: data.icon_color,
    first_button_color: data.first_button_color,
    second_button_color: data.second_button_color,
    button_text_color: data.button_text_color,
    description: data.description,
    org_address: data.org_address,
    cin: data.cin,
    gstn: data.gstn,
    pan: data.pan
  };
};

export const orglogoError = () => {
  return {
    type: actionTypes.ORGLOGO_ERROR,
  };
};

export const orgLogoGet = () => {
  return (dispatch) => {
    let domainURl = new URL(window.location).hostname;
    axios
      .get(`/api/organisations?domain_url=${domainURl}`)
      .then((res) => {
        dispatch(orglogoSuccess(res.data.data));
      })
      .catch((err) => {
        dispatch(orglogoError(err));
      });
  };
};

export const orgThemeSuccess = (data) => {
  return {
    type: actionTypes.ORGTHEME_SUCCESS,
    props: data,
  };
};

export const orgThemeGet = () => {
  return (dispatch) => {
    let domainURl = new URL(window.location).hostname;
    axios
      .get(`/api/organisations?domain_url=${domainURl}`)
      .then((response) => {
        dispatch(orgThemeSuccess(response.data.data));
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

export const orgLogoUpdateSuccess = (data) => {
  return {
    type: actionTypes.ORGLOGO_UPDATE_SUCCESS,
    props: data,
  };
};

export const orgLogoUpdate = (data, CB) => {
  return (dispatch) => {
    let url = `/api/organisations/${data.id}`;
    const formData = new FormData();
    const config = {
      "Content-Type": "multipart/form-data",
    };
    formData.append("name", data.name);
    formData.append("show_org_name", data.show_org_name);
    formData.append("logo", data.logo);
    axios
      .patch(url, formData, config)
      .then((response) => {
        dispatch(orgLogoUpdateSuccess(response.data.data));
        CB(response);
      })
      .catch((err) => {
        CB(err.response.data);
      });
  };
};

export const orgThemeUpdateSuccess = (data) => {
  return {
    type: actionTypes.ORGTHEME_UPDATE_SUCCESS,
    props: data,
  };
};

export const orgThemeUpdate = (data, CB) => {
  return (dispatch) => {
    let url = `/api/organisations/${data.id}`;
    axios
      .patch(url, data)
      .then((response) => {
        dispatch(orgThemeUpdateSuccess(response.data.data));
        CB(response.data.message);
      })
      .catch((err) => {
        CB(err.response.data);
      });
  };
};

export const updateOrgAddress = (data, updatedData, CB = null) => {
  return (dispatch) => {
    axios.patch(
      `/api/organisations/${data.id}`, 
      updatedData
    ).then((response) => {
        dispatch(addToast('success', 'Success', "Organisation Address update successfully."));
        dispatch({
          type: actionTypes.ORGADDRESS_UPDATE_SUCCESS,
          description: response.data.data.description,
          org_address: response.data.data.org_address,
          cin: response.data.data.cin,
          gstn: response.data.data.gstn,
          pan: response.data.data.pan,
        });
        if (CB) CB()
      })
      .catch(() => {
        dispatch(addToast('error', 'Error', "Failed To Update Org Address."));
      });
  };
};
