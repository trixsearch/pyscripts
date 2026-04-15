
import _ from 'lodash';
import axios from 'axios';

const APP_URL = process.env.REACT_APP_APP_URL;

// eslint-disable-next-line import/prefer-default-export
export const getRoles = async (search="", orgId) => {
    try {
        let url = `/api/customer-mgmt/org/${orgId}/tags/search?category=functional&key=${search}`;
        let response = await axios.get(url);
        if (response.status === 200 || response.status === 201) {
            return response.data
        }
    } catch (error) {
        let errMsg = error;
        if (error.response.data && error.response.data.errorMessage) {
            errMsg = error.response.data.errorMessage;
        } else {
            errMsg = error.message;
        }
    }

};

export const getDefaultRoles = async ( orgId, search="") => {
    try {
        let url = `${APP_URL}/${orgId}/jobs/role/default`;
        if(search){
            url = url + `?default_role__name=${search}`;
        }
        let response = await axios.get(url);
        if (response.status === 200 || response.status === 201) {
            return response.data.data
        }
    } catch (error) {
        let errMsg = error;
        if (error.response.data && error.response.data.errorMessage) {
            errMsg = error.response.data.errorMessage;
        } else {
            errMsg = error.message;
        }
    }

};

export const getRolesDefault = async (orgId) => {
    try {
        let url = `/api/customer-mgmt/org/${orgId}/tag?category=functional`;
        let response = await axios.get(url);
        if (response.status === 200 || response.status === 201) {
            return response.data?.tagList;
        }
    } catch (error) {
        let errMsg = error;
        if (error.response.data && error.response.data.errorMessage) {
            errMsg = error.response.data.errorMessage;
        } else {
            errMsg = error.message;
        }
    }

};
