import axios from 'axios';

import * as actionsTypes from '../../actionTypes';
import { addToast } from '../../../../components/Toast/actions';
import { SES_SETTINGS } from '../../../../Data/TimeConstants';

const APP_URL = process.env.REACT_APP_APP_URL;

let timerInterval;

export const intervalReset = () => (dispatch) => {
    
    clearInterval(timerInterval)

     return dispatch({
         type: actionsTypes.ACTIVATION_TIMEOUT,
         showProgress: false
     })
}

const emailVerifier = async (verifier, email, timer, dispatch) => {
    let response = await verifier(email);

    if (response) {
        clearInterval(timer)
        return dispatch({
            type: actionsTypes.ACTIVATION_SUCCESSFULL,
            showProgress: false
        })
    }
    return dispatch({
        type: actionsTypes.ACTIVATION_FAILURE,
        showProgress: true
    })

}

const verifyEmailBySes = async (orgId, email) => {

    try {
        
        const response = await axios.post(`${APP_URL}/${orgId}/config/ses/verify_email`, { email })
        return response
    } catch (error) {
        return false
    }

};

const verifyEvery15Secs = (orgId, email, dispatch) => {

    timerInterval = setInterval(() => {
        emailVerifier(verifyEmailBySes(orgId), email, timerInterval, dispatch)
    }, SES_SETTINGS.ses_interval_ms);

}

const smtpError = (error, dispatch) => {
    try {
        if(error.response) {
            dispatch(addToast('error', 'Error', error.response.data.message))
            return {
                type: actionsTypes.ERROR_SMTP,
                message: error.response.data.message
            }
        }
        dispatch(addToast('error', 'Error', error.message || "Something went wrong, please try after sometime."))
        return {
            type: actionsTypes.ERROR_SMTP,
            message: error.message || "Something went wrong, please try after sometime.",
        };
    } catch (err) {
        dispatch(addToast('error', 'Error', err.message))
        return {
            type: actionsTypes.ERROR_SMTP,
            message: err.message || "Something went wrong, please try after sometime.",
        };
    }
}


export const getSMTP = (orgId) => (dispatch) => new Promise((resolve, reject) => {
    dispatch({
        type: actionsTypes.SMTP_LOADER
    });

    axios.get(`${APP_URL}/${orgId}/config/smtp`).then(response => {
        dispatch({
            type: actionsTypes.GET_SMTP,
            data: response.data.data
        })
        resolve(response.data.data)
    }).catch(error => {
        dispatch(addToast('error', 'Error', error.response.data.message))
        dispatch({
            type: actionsTypes.ERROR_SMTP,
            data: null,
            error: error.response.data.message
        })
        reject(error)
    })
})

export const createSMTP = (orgId, data) => (dispatch) => new Promise((resolve, reject) => {
    dispatch({
        type: actionsTypes.SMTP_LOADER
    });

    let postData = {
        ...data,
        email: data.email.toLowerCase(),
        is_service_active: true
    }

    axios.post(`${APP_URL}/${orgId}/config/smtp`, postData)
        .then(response => {
            dispatch({
                type: actionsTypes.CREATE_SMTP,
                data: response.data.data
            })
            dispatch(addToast('success', 'Success', response.data.message))
            resolve(response.data)
        })
        .catch(error => {
            dispatch(addToast('error', 'Error', error.response.data.message))
            dispatch({
                type: actionsTypes.ERROR_SMTP,
                data: null,
                error: error.response.data.message
            })
            reject(error)
        })
})

export const patchSMTP = (orgId, data) => (dispatch) => new Promise((resolve, reject) => {
    dispatch({
        type: actionsTypes.SMTP_LOADER
    });

    let postData = {
        ...data,
        email: data.email.toLowerCase()
    }

    axios.put(`${APP_URL}/${orgId}/config/smtp/${data.id}`, postData).then(response => {
        dispatch(addToast('success', 'Success', response.data.message))
        dispatch({
            type: actionsTypes.PATCH_SMTP,
            data: response.data.data
        })
        resolve(response.data.data)
    }).catch(error => {
        dispatch(addToast('error', 'Error', error.response.data.message))
        dispatch({
            type: actionsTypes.ERROR_SMTP,
            data: null,
            error: error.response.data.message
        })
        reject(error)
    })
})

export const testSMTP = (orgId, data) => (dispatch) => new Promise((resolve) => {
    dispatch({
        type: actionsTypes.SMTP_LOADER
    })

    let postData = {
        ...data,
        email: data.email.toLowerCase()
    }

    axios.post(`${APP_URL}/${orgId}/config/smtp/test_smtp`, postData).then(response => {
        dispatch(addToast('success', 'Success', response.data.message))
        dispatch({
            type: actionsTypes.TEST_SMTP,
            message: response.data.message,
            formData: { ...postData }
        })
        resolve(response.data.data)
    }).catch(err => {
        dispatch(smtpError(err, dispatch))
    })
});

export const sendActivationLink = (orgId, email) => async (dispatch) => {
    try {

        dispatch({
            type: actionsTypes.SMTP_LOADER
        })


        await axios.post(`${APP_URL}/${orgId}/config/ses/register_email`, { email });

        verifyEvery15Secs(orgId, email, dispatch);

        dispatch(addToast('success', 'Success', 'Activation Link is sent to your Email id successfully.'))

        return dispatch({
            type: actionsTypes.ACTIVATION_LINK_SENT,
            showProgress: true
        })

    } catch (err) {
        return dispatch(smtpError(err, dispatch))
    }

}


export const verify_SES_Activation = (orgId, email) => async (dispatch) => {

    try {
        dispatch({
            type: actionsTypes.SMTP_LOADER
        })

        await axios.post(`${APP_URL}/${orgId}/config/ses/verify_email`, { email })

        return dispatch({
            type: actionsTypes.ACTIVATION_SUCCESSFULL,
            showProgress: false
        })

    } catch (error) {
        if (error.response && error.response.status === 404) {
            dispatch({
                type: actionsTypes.ACTIVATION_FAILURE,
                showProgress: true
            })
            dispatch(sendActivationLink(email))
            return Promise.reject();
        }
        return dispatch(smtpError(error, dispatch))
    }
}

export const saveSesSettings = (orgId, email, display_name) => async (dispatch) => {

    try {
        const response = await axios.post(`${APP_URL}/${orgId}/config/ses`, { email, display_name, is_service_active: true });

        clearInterval(timerInterval);

        dispatch(addToast('success', 'Success', response.data.message))

        return dispatch({
            type: actionsTypes.SAVE_SES_SUCCESS,
            formData: { email, display_name}
        })

    } catch (error) {
        return dispatch(smtpError(error, dispatch))
    }
}

export const getEmailSettings = (orgId) => async (dispatch) => {
    try {

        dispatch({
            type: actionsTypes.SMTP_LOADER
        })

        const response = await axios.get(`${APP_URL}/${orgId}/config/email_settings`)
        return dispatch({
            type: actionsTypes.GET_EMAIL_SETTINGS,
            email_settings: response.data.data
        })
    } catch(error) {
        return dispatch(smtpError(error, dispatch))
    }
}

export const clearSmtpState = () => (dispatch) => {

    clearInterval(timerInterval);

    return dispatch({
        type: actionsTypes.CLEAR_SMTP_STATE
    })
}
