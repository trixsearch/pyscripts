import axios from 'axios';
import * as actionTypes from '../actionTypes';
import * as constants from '../../../Data/constants';

// action-builders

export const updateReceived = (updateType, data) => ({
    type: actionTypes.WEBSOCKET_UPDATES,
    updateType,
    data,
})

export const notificationReceived = (notifications, unReadCount) => ({
    type: actionTypes.WEBSOCKET_NOTIFICATION,
    notifications,
    unReadCount,
})

export const changeBellVibrate = value => ({
  type: actionTypes.CHANGE_BELL_VIBRATE,
  value
})

export const changeLoading = value => ({
  type: actionTypes.NOTIFICATION_LOADER,
  value
})

export const changeNotificationPage = page => ({
  type: actionTypes.NOTIFICATION_PAGE,
  page
})

//  actions

export const doChangeBellVibrate = value => {
  return dispatch => {
    dispatch(changeBellVibrate(value))
  }
}

export const doPublishUpdate = (updateType, data) => {
    return dispatch => {
        dispatch(updateReceived(updateType, data))
    }
}

export const doNotificationUpdate = (notifications, unReadCount = 0) => {
    return dispatch => {
        dispatch(notificationReceived(notifications, unReadCount));
        dispatch(changeBellVibrate(true));
        setTimeout(()=>{
          dispatch(changeBellVibrate(false));
        },3000)
    }
}

export const doChangeWebsocketLoader = value => {
  return dispatch => {
    dispatch(changeLoading(value));
  }
}

export const doChangeNotificationPage = page => {
  return dispatch => {
    dispatch(changeNotificationPage(page));
  }
}

export const doNotificationClicked = (id, groupId, url, notifications, history, taskId, unReadCount ) => {
  return dispatch => {
    axios.patch(`/api/notifications/${id}`, {is_read: true, is_seen: true }).then(() => {
      let newNotifications = notifications.filter(notfn => notfn.id !== id);
      dispatch(doNotificationUpdate(newNotifications, unReadCount-1));
      let pathName = "";
      if(taskId) {
        pathName = `/tasks${url.split("tasks")[1]}`;
        // if(groupId && [constants.OWNER, constants.SUPER_ADMINISTRATOR].includes(groupName)) {
        //   pathName = `/tasks?taskType=group_tasks`
        // }
      }else{
        let pathNameArr = url.split('/org');
        if(pathNameArr.length > 1) {
          pathName = `${pathNameArr[1]}`;
        }
      }
      if(!document.hidden) {
        history.push(pathName);
      }else{
        const newTabUrl = `${window.location.protocol}//${window.location.hostname}/org${pathName}`
        window.open(newTabUrl, '_blank');
      }
      });
  }
}

export const doNotificationClear = () => {
  return dispatch => {
    axios.post('/api/notifications/clear_notification').then(()=>{
      dispatch(doNotificationUpdate([]))
    })
  }
}
