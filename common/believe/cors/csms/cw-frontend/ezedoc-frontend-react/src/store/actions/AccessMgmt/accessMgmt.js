import * as actionTypes from "../actionTypes";

export const getClientVendorRelation = (clientVendorRelation) => dispatch => {
    dispatch({
        type: actionTypes.GET_CLIENT_VENDOR_RELATION,
        payload: clientVendorRelation
    })
}

export const getClientVendorRelationLoading = () => dispatch => {
    dispatch({
        type: actionTypes?.GET_CLIENT_VENDOR_RELATION_LOADING,
    })
}