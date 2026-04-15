import React from "react";
import { withRouter } from "react-router-dom";
import {connect} from 'react-redux'

// eslint-disable-next-line no-unused-vars
import * as moment from "moment";

import {NotificationContentLoader} from 'components/UI/ContentLoaders/ContentLoaders'
import notificationImage from "../../assets/images/svg/notification.svg";
import * as actions from "../../store/actions/index";
import { ZeroNotifications, NotfnCard } from './NotificationItems'
import "./Style.css";

// export default () => (<span/>);

class Notification extends React.Component {
  constructor(props) {
    super(props);
    this.socketRef = React.createRef();
    this.state = {
      showNotification: false,
      getNotificationAllowed: true,
    };
    this.loader = React.createRef();
    
  }

  componentDidUpdate(prevProps) {
    if (this.props.notifications !== prevProps.notifications) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({getNotificationAllowed: true})
    }
  }

  showNotification = () => {
    this.setState(
      prevState => ({
        showNotification: !prevState.showNotification
      }),
      () => {
        document.addEventListener("click", this.closeMenu);
      }
    );
  };

  closeMenu = () => {
    this.setState({ showNotification: false }, () => {
      document.removeEventListener('click', this.closeMenu);
    });
  }

  navigate = async (id, url, groupId, taskId) => {
    const { 
      notifications, history, unreadCount 
    } = this.props;
    this.props.doNotificationClicked(
      id, groupId, url, notifications, history, taskId, unreadCount
    )
  };  

  scrolHandler= () => {
    const node = this.loader.current;
    if(node && this.props.loading && this.state.getNotificationAllowed) {
      let value = node.getBoundingClientRect().top;
      // to see if user has scrolled to end of the list
      if(value-230 < 20) {
        this.props.doChangeNotificationPage(this.props.page+1);
        this.setState({getNotificationAllowed: false})
      }
    }
  }

  render() {
    let clearAll = null;
    if(this.props.notifications.length) {
    clearAll = (
      <div className="notfn-clear">
        <span
          className='notfn-clear-text'
          role="presentation"
          onClick={this.props.doNotificationClear}
        >
          Clear All
        </span>
      </div>
      )

    }
    return (
      <div className="notification_navbar">
        <div
          role="presentation"
          className="nav-item notification_icon_li"
          onClick={this.showNotification}
        >
          <div
            role="presentation"
            className="nav-link notification_icon"
            href="#"
            onClick={this.onClick}
          >
            <img src={notificationImage} alt="" />
            <div
              className={
                this.props.bellVibrate
                  ? "badge-num notification_num"
                  : "notification_num"
              }
            >
              {this.props.unreadCount}
            </div>
          </div>
          {this.state.showNotification ? (
            <div className="notification-wrapper">
              <div className="arrow_up" />
              <div className="notfn-main-container" onScroll={this.scrolHandler} >
                <ul className="notfn-ul" >
                    {this.props.notifications.length ? ( 
                      <React.Fragment>
                        {clearAll}
                        { this.props.notifications.map(notfn => (
                          <NotfnCard
                            key={notfn.id}
                            message={notfn.message}
                            time={moment.unix(notfn.created).fromNow()}
                            workflowName={notfn.data.workflow}
                            groupId={notfn.data.group_id}
                            taskName={notfn.data.task_name}
                            notificationText={notfn.data.notification_text}
                            handleSeen={this.handleSeen}
                            id={notfn.id}
                            taskId={notfn.task_id}
                            is_read={notfn.is_read}
                            is_seen={notfn.is_seen}
                            navigate={this.navigate}
                            url={notfn.data.url}
                          />
                        ))
                      }
                      </React.Fragment>
                  ) : (
                      <ZeroNotifications />
                    )}
                    {
                      this.props.loading?(
                        <li ref={this.loader} >
                          <NotificationContentLoader />
                        </li>
                      ):null
                    }
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  doNotificationClear: () => dispatch(actions.doNotificationClear()),
  doChangeNotificationPage: (page) => dispatch(actions.doChangeNotificationPage(page)),
  doNotificationClicked: (
    id, groupId, url, notifications, history, taskId, unReadCount
  ) => dispatch(actions.doNotificationClicked(
    id, groupId, url, notifications, history, taskId, unReadCount
  )),
})

const mapStateToProps = state => ({
  notifications: state.websocket.notifications,
  unreadCount: state.websocket.unreadCount,
  page: state.websocket.page,
  loading: state.websocket.loading,
  bellVibrate: state.websocket.bellVibrate,
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Notification));
