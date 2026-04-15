import React from 'react';
import Websocket from 'react-websocket';
import { withRouter } from "react-router-dom";

import {connect} from 'react-redux'

import * as actions from '../../store/actions';
import * as constants from '../../Data/constants';

// 6 hours inactivity
const WEBSOCKET_DEFAULT_INACTIVE_TIME = 1000*3600*6;

const notificationTypes = {
    user_message: 'user_message',
    new_group_task: 'new_group_task',
  }

class Updates extends React.Component {
    constructor(props) {
        super(props);
        this.socketRef = React.createRef();
        this.state = {
            websocketOpen: true,
            userActive: true,
            doRefreshQuickAction: false,
        }
        document.onvisibilitychange = this.handleVisibilityChange;
        if (!("Notification" in window)) {
            // eslint-disable-next-line no-console
            console.log("This browser does not support desktop notification");
        }else if(Notification.permission !== 'denied' || Notification.permission === "default") {
            Notification.requestPermission()
          }
    }

    componentDidUpdate(prevProps) {
        if (this.props.page !== prevProps.page) {
          this.sendMessage(JSON.stringify({'page': this.props.page}));
          this.props.doChangeWebsocketLoader(true);
        }
      }
      
    showNotification = (title, options) => {
        Notification.requestPermission(result=> {
            if (result === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
            });
            }
        });
    }
    
    // handle browser or system notification
    browserNotificationHandler = data => {
        if(data && data.notifications && data.notifications.length>0) {
            const { notifications } = data;
            const title = notifications[0].data.task_name;
            const body = notifications[0].message;
            let url = null;
            if(notifications[0].data.group_id) {
                url = `${window.location.protocol}//${window.location.hostname}/org/tasks?taskType=group_tasks`
              }else{
                url = notifications[0].data.url;
              }
            const notiData = {
                url,
                id: notifications[0].id,
            };
            const options = {
                body: body,
                data: notiData,
            }
            this.showNotification(title, options);
        }
    }

    // handle bell-icon notification in org app
    handleInAppNotification = data => {
        const orgId = this.props.match?.params?.uuid;

        const {notifications, unReadCount} = this.props;
        const { doRefreshQuickAction } = this.state;
        let newNotiList = notifications;
        let count = unReadCount;
        // flag to reload task. dashboard task count
        let loadOtherItems = true;
        if(data.type === notificationTypes.user_message) {
            count = data.unread_count;
            // removing same existing notification to match notification with tiles.( multiple login situation )
            const taskIds = data.notifications.map(item=>item.task_id)
            newNotiList = newNotiList.filter(item=> !taskIds.includes(item.task_id))

            if (data.page) {
                newNotiList = newNotiList.concat(data.notifications);
            }else{
                newNotiList = data.notifications.concat(newNotiList);
            }
            if (data.page && data.page !== 1) {
                loadOtherItems = false;
            }
            if(Array.isArray(data.notifications) && data.notifications.length===10) {
                this.props.doChangeWebsocketLoader(true);
            }else{
                this.props.doChangeWebsocketLoader(false);

            }
        }else if(data.type === notificationTypes.new_group_task) {
            count+=1;
            newNotiList = data.notifications.concat(newNotiList)
        }
        this.props.doNotificationUpdate(newNotiList, count);
        if(loadOtherItems) {
            if(this.props.location.pathname === '/dashboard' && doRefreshQuickAction) {
                this.props.globalQuickActionRefresh(orgId);
            }
            this.handleUpdates({type: constants.UPDATE_TASKS});
            if(document.hidden && !data.page) {
                this.browserNotificationHandler(data);
            }
            if(!doRefreshQuickAction) { this.setState({doRefreshQuickAction: true}) }           
        }
    }

    // handle all types of updates sent through websocket and save it in redux in updatesData variable
    handleUpdates = data => {
        if(data.type) {
            this.props.doPublishUpdate(data.type, data.data)
        }
    }

    onMessage = message => {
        const data = JSON.parse(message);
        switch(data.message_type) {
            case constants.NOTIFICATIONS:
                this.handleInAppNotification(data); break;
            case constants.UPDATES:
                this.handleUpdates(data); break;
            default:
                break;
        }
    }

    // for sending message to ws
    sendMessage = (message) => {
        const socket = this.socketRef.current;
        socket.state.ws.send(message);
      };


    //   called when connection is made
    onOpen = () => {
        this.props.doNotificationUpdate([]);
    }

    onClose = () => {}

    handleTimeOut = () => {
        if(!this.state.userActive) {
            this.setState({
                websocketOpen: false
            })
        }
    }

    handleVisibilityChange = () => {
        if(document.hidden) {
            this.setState({
                userActive: false
            })
        }else{
            this.setState({
                userActive: true,
                websocketOpen: true,
            })
        }
        setTimeout(()=>{
            this.handleTimeOut()
        },WEBSOCKET_DEFAULT_INACTIVE_TIME)
    }


    render() {
        const protocol = window.location.protocol === "http:" ? "ws://" : "wss://";
        const socketUrl = `${protocol}${window.location.host}/ws/?token=${localStorage.token}`;
        return (
            <div>
            {this.state.websocketOpen
            ?(
            <Websocket
                url={socketUrl}
                ref={this.socketRef}
                onMessage={this.onMessage}
                onOpen={this.onOpen}
                onClose={this.onClose}
            />
            )
            : null}
            </div>
        )
    
    }
}


const mapDispatchToProps = dispatch => ({
    doPublishUpdate: (updateType, data) => dispatch(actions.doPublishUpdate(updateType, data)),
    doChangeWebsocketLoader: status => dispatch(actions.doChangeWebsocketLoader(status)),
    doNotificationUpdate: (notifications, unReadCount) => dispatch(actions.doNotificationUpdate(notifications, unReadCount)),
    doChangeBellVibrate: value => dispatch(actions.doChangeBellVibrate(value)),
    globalQuickActionRefresh: (orgId) => dispatch(actions.dashboardQuickActions(orgId)),
})

const mapStateToProps = state => ({
    notifications: state.websocket.notifications,
    page: state.websocket.page,
    unReadCount: state.websocket.unreadCount,
  })
  
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Updates));