import * as actionTypes from '../../../actions/actionTypes';
import {
    updateObject
} from '../../utility';

const initialState = {
    error: null,
    message: null,
    loader: false,
    data: null,
    is_activated: false,
    timeout: false,
    showProgress: false,
    isTested: false,
    smtp_values: {
        email: "",
        encryption: 1,
        host: "",
        is_service_active: false,
        password: "",
        port: "",
        username: "",
    },
    ses_values: {
        display_name: "",
        email: "",
        is_service_active: false
    },
    is_saved: false
};

export default (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.GET_SMTP:
            return updateObject(state, {
                data: action.data,
                error: false,
                message: action.message,
                loader: false
            })
        case actionTypes.CREATE_SMTP:
            return updateObject(state, {
                data: action.data,
                error: false,
                message: action.message,
                loader: false
            })
        case actionTypes.PATCH_SMTP:
            return updateObject(state, {
                data: action.data,
                error: false,
                message: action.message,
                loader: false
            })
        case actionTypes.TEST_SMTP:
            return updateObject(state, {
                data: action.data,
                error: false,
                message: action.message,
                loader: false,
                isTested: true,
                smtp_values: {
                    ...action.formData
                }
            })
        case actionTypes.ERROR_SMTP:
            return updateObject(state, {
                data: false,
                error: action.error,
                message: action.message,
                loader: false
            })
        case actionTypes.SMTP_LOADER:
            return updateObject(state, {
                loader: true
            })
        case actionTypes.ACTIVATION_LINK_SENT:
            return updateObject(state, {
                loader: false,
                showProgress: action.showProgress,
                is_saved: false
            })
        case actionTypes.ACTIVATION_FAILURE:
            return updateObject(state, {
                is_activated: false,
                showProgress: action.showProgress,
                timeout: false,
                loader: false,
                is_saved: false
            })
        case actionTypes.ACTIVATION_SUCCESSFULL:
            return updateObject(state, {
                is_activated: true,
                showProgress: action.showProgress,
                loader: false,
                is_saved: false
            })
        case actionTypes.GET_EMAIL_SETTINGS:
            return updateObject(state, {
                loader: false,
                smtp_values: action.email_settings.smtp,
                ses_values: action.email_settings.ses,
                is_saved: false
            })
        case actionTypes.ACTIVATION_TIMEOUT:
            return updateObject(state, {
                is_activated: false,
                timeout: true,
                showProgress: action.showProgress
            })
        case actionTypes.SAVE_SES_SUCCESS:
            return updateObject(state, {
                showProgress: false,
                loader: false,
                ses_values: { ...action.formData },
                is_saved: true
            })
        case actionTypes.CLEAR_SMTP_STATE:
            return {
                ...initialState,
                smtp_values: {
                    ...state.smtp_values
                }
            };
        default:
            return state;
    }
};