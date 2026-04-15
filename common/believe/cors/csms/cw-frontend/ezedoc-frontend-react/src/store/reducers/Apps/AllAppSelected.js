import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    error: null,
    message: null,
    loader: false,
    data: [],
    appData: []
};
const appListStart = (state, action) => {
    return updateObject(state, {
        loader: true,
    });
};

const appListSuccess = (state, action) => {
    return updateObject(state, {
        error: null,
        loader: false,
        data: action.data

    });
};

const appListFail = (state, action) => {
    return updateObject(state, {
        error: action.error,
        loader: false

    });
};


const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.APP_LIST_START: return appListStart(state, action);
        case actionTypes.APP_LIST_COUNT: return appListSuccess(state, action);
        case actionTypes.APP_LIST_ERROR: return appListFail(state, action);

        default:
            return state;
    }
};

export default reducer;