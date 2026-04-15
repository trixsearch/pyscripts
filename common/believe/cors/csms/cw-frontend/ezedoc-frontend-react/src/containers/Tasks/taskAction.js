import React, { Component } from "react";
import axios from "axios";
import { connect } from "react-redux";
import TaskForm from "./TaskForm"
import no_records from "../../assets/images/no_records.png";
import Spinner from '../../components/UI/Spinner/Spinner';
import * as actions from '../../store/actions';
import { HasAccess } from "../../platformDataStoreContext";
import UnauthorizedPage from "../UnauthorizedPage";
import { CW_SERVICE_TASKS_ACTION } from "../../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

class TaskAction extends Component {
    state = {
        data :[],
        loader: false,
    };


    componentDidMount() {
        this.getTaskAndRemoveNotification();
    }

    getTaskAndRemoveNotification = () => {
        const orgId = this.props.match?.params?.uuid;

        this.setState({loader: true});
        const taskId = this.props.match.params.id;
        let { notifications, doNotificationUpdate, unReadCount } = this.props;
        let newNotifications = []
        let clickedNotification = null

        notifications.forEach(item => {
            if (item.task_id === taskId) {
                clickedNotification = item.id
            }else{
                newNotifications.push(item)
            }
        })
        let axiosCalls = [];
        if (clickedNotification) {
            doNotificationUpdate(newNotifications, --unReadCount);
            axiosCalls.push(axios.put(`${APP_URL}/${orgId}/notifications/${clickedNotification}`, { is_read: true, is_seen: true }));
        }
        axiosCalls.push(axios.get(`${APP_URL}/${orgId}/proxy-bpm/task/instance/${taskId}`));
        axios.all(axiosCalls).then(res => {
            if (axiosCalls.length !== 1) {
                this.setState({
                    data: res[1].data.data,
                    loader: false
                })
            }else{
                this.setState({
                    data: res[0].data.data,
                    loader: false
                })
            }
        }).catch(()=>{
            this.setState({
                loader: false
            });
        })
    }

    componentDidUpdate = prevProps => {
        if(this.props.match.params.id !== prevProps.match.params.id) {
            this.getTaskAndRemoveNotification();
        }
    }


    render() {
        return (
            <HasAccess
                permissions={[CW_SERVICE_TASKS_ACTION]}
                yes={() => (
                    !this.state.loader 
                        ? this.state.data.formKey 
                            ? (
                                <TaskForm 
                                    current_task_owner={this.props.current_task_owner}
                                    data={this.state.data} 
                                    history={this.props.history} 
                                    formId={this.state.data.formKey} 
                                    processInstanceId={this.state.data.processInstanceId}
                                    handleSidebarOpenClose={this.props.handleSidebarOpenClose}
                                />
                            ) 
                            : (
                                <div className="tab-pane active">
                                <div className="no_records_cont">
                                    <div className="no_records_img_text" style={{width: "100%"}}>
                                    <img src={no_records} alt="" />
                                    <p>The requested task cannot be found. It might be already completed or not present.</p>
                                    </div>
                                </div>
                                </div>
                            )
                    : (<Spinner />)
                )}
                no={() => (
                    <UnauthorizedPage />
                )}
            />
        )
    }
}


const mapStateToProps = state => {
    return {
        current_task_owner : state.auth.current_task_owner,
        notifications: state.websocket.notifications,
        unReadCount: state.websocket.unreadCount,
    }
}

const mapDispatchToProps = dispatch => ({
    doNotificationUpdate: (notifications, unReadCount) => dispatch(actions.doNotificationUpdate(notifications, unReadCount)),
  })
  
export default connect(mapStateToProps, mapDispatchToProps)(TaskAction);
