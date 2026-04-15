import _ from 'lodash';
import axios from 'axios';

// eslint-disable-next-line import/prefer-default-export
export const getLocations = async (search="", orgId) => {
    try {
        let url = `/api/customer-mgmt/org/${orgId}/tags/search?category=geographical&key=${search}`;
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

export const getDefaultLocations = async (orgId) => {
    try {
        let url = `/api/customer-mgmt/org/${orgId}/tag?category=geographical`;
        let response = await axios.get(url);
        if (response.status === 200 || response.status === 201) {
            return response.data?.tagList
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
