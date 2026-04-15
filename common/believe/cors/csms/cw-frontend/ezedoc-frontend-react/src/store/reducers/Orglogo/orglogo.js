/* eslint-disable no-unused-vars */
import * as actionTypes from "../../actions/actionTypes";
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message: null,
    loader: false,
    logo: null,
    name: null,
    showOrgName: false,
    orgExists: true,
    createdAt: null,
    id: null,
    theme: {
        "id": null,
        "first_primary_color": null,
        "second_primary_color": null,
        "first_button_color": null,
        "second_button_color": null,
        "icon_color": null,
        "assets_color": null,
        "button_text_color": null,
    },
    description: '',
    org_address: "",
    cin: "",
    gstn: "",
    pan: ""
};
const orglogoStart = (state, action) => {
    return updateObject(state, {
        loader: true,
    });
};

const orglogoSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        logo: action.logo,
        name: action.name,
        showOrgName: action.showOrgName,
        orgExists: true,
        createdAt: action.createdAt,
        id : action.id,
        theme: {
            "id": action.id,
            "first_primary_color": action.first_primary_color,
            "second_primary_color": action.second_primary_color,
            "first_button_color": action.first_button_color,
            "second_button_color": action.second_button_color,
            "icon_color": action.icon_color,
            "assets_color": action.assets_opacity,
            "button_text_color": action.button_text_color
        },
        description: action.description,
        org_address: action.org_address,
        gstn: action.gstn,
        pan: action.pan,
        cin: action.cin,
    });
};

const orglogoError = (state, action) => {
    return updateObject(state, {
        loader: true,
        orgExists: false
    });
};


const orgThemeSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        logo: action.props.logo,
        name: action.props.name,
        orgExists: true,
        showOrgName: action.props.show_org_name,
        createdAt : action.props.created_at,
        id : action.props.id,
        theme: {
            "id": action.props.id,
            "first_primary_color": action.props.first_primary_color,
            "second_primary_color": action.props.second_primary_color,
            "first_button_color": action.props.first_button_color,
            "second_button_color": action.props.second_button_color,
            "icon_color": action.props.icon_color,
            "assets_color": action.props.assets_opacity,
            "button_text_color": action.props.button_text_color
        },
        description: action.props.description,
        org_address: action.props.org_address,
        gstn: action.gstn,
        pan: action.pan,
        cin: action.cin,
    });
};

const orgLogoUpdateSuccess = (state, action) => {
    const randomQueryParam =`?random=${Math.random().toString(36).substring(7)}`
    return updateObject(state, {
        loader: false,
        logo: action.props.logo + randomQueryParam,
        name: action.props.name,
        orgExists: true,
        showOrgName: action.props.show_org_name,
        createdAt : action.props.created_at,
        id : action.props.id,
        theme: {
            "id": action.props.id,
            "first_primary_color": action.props.first_primary_color,
            "second_primary_color": action.props.second_primary_color,
            "first_button_color": action.props.first_button_color,
            "second_button_color": action.props.second_button_color,
            "icon_color": action.props.icon_color,
            "assets_color": action.props.assets_opacity,
            "button_text_color": action.props.button_text_color
        },
        description: action.props.description,
        org_address: action.props.org_address,
        cin: action.props.cin,
        gstn: action.props.gstn,
        pan: action.props.pan,
    });
};

const orgAddressUpdateSucces = (state, action) => {
    return updateObject(state, {
        description: action.description,
        org_address: action.org_address,
        pan: action.pan,
        gstn: action.gstn,
        cin: action.cin
    })
} 

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.ORGLOGO_START: return orglogoStart(state, action);
        case actionTypes.ORGLOGO_SUCCESS: return orglogoSuccess(state, action);
        case actionTypes.ORGLOGO_ERROR: return orglogoError(state, action);
        case actionTypes.ORGTHEME_SUCCESS: return orgThemeSuccess(state, action);
        case actionTypes.ORGLOGO_UPDATE_SUCCESS: return orgLogoUpdateSuccess(state, action);
        case actionTypes.ORGTHEME_UPDATE_SUCCESS: return orgThemeSuccess(state, action);
        case actionTypes.ORGADDRESS_UPDATE_SUCCESS : return orgAddressUpdateSucces(state, action)

        default:
            return state;
    }
};

export default reducer;
