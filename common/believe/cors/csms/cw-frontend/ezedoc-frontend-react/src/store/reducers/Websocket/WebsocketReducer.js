import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';


const initialState = {
    updateType: {
        time: null,
        type: null
    },
    notifications: [],
    unreadCount: 0,
    bellVibrate: false,
    updatesData: {},
    page: 1,
    loading: false,
}

const publishUpdate = (state, action) => {
    return updateObject(state, {
        updateType: {
            type: action.updateType,
            time: new Date().getTime(),
        },
        updatesData: action.data,
    })
}

const publishNotifications = (state, action) => {
    let unreadCount = action.unReadCount;
    if (unreadCount < 0) { unreadCount = 0 }
    return updateObject(state, {
        notifications: action.notifications,
        unreadCount,
    })
}

const changeBellVibrate = (state, action) => {
    return updateObject(state, {
        bellVibrate: action.value,
    })
}

const changeAllNotiStatus = (state, action) => {
    return updateObject(state, {
        loading: action.value,
    })
}

const changeWebsocketPage = (state, action) => {
    return updateObject(state, {
        page: action.page,
    })
}

const reducer = (state=initialState, action) => {
    switch (action.type) {
        case actionTypes.WEBSOCKET_UPDATES: return publishUpdate(state, action)
        case actionTypes.WEBSOCKET_NOTIFICATION: return publishNotifications(state, action)
        case actionTypes.CHANGE_BELL_VIBRATE: return changeBellVibrate(state, action)
        case actionTypes.NOTIFICATION_LOADER: return changeAllNotiStatus(state, action)
        case actionTypes.NOTIFICATION_PAGE: return changeWebsocketPage(state, action)
        default:
            return state;
    }
}

export default reducer;