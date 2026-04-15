import React, { Component } from "react";
import { connect } from 'react-redux'
import axios from "axios";
import { addToast } from 'components/Toast/actions'
import Reassign from '../../../components/UI/Reassign';

// TODO : Restrict the number of API call while submitting
const APP_URL = process.env.REACT_APP_APP_URL;
class UserReassign extends Component {
    state = {
        show: false,
    }

    handleShow = () => {
        this.props.stepProgress();
        this.setState({
            show: true,
        });
    }

    handleClose = () => {
        this.setState({ show: false });
    }

    handleAPI = (taskId, user, processInstanceId) => {
        this.props.setLoader(true)
        axios.put(`${APP_URL}/${this.props.orgId}/proxy-bpm/tasks/${taskId}`, { assignee: user, processInstanceId: processInstanceId })
            .then(() => {
                this.props.addToast('success', 'Success', 'Task reassigned successfully')
                this.setState({
                    show: false
                });
                this.props.stepProgress();
            })
            .catch(() => {
                this.setState({
                    show: false
                });
                this.props.setLoader(false)
            })
    }

    handleSave = (taskReassigned) => {
        Object.entries(taskReassigned).forEach(([taskId, user]) => {
            if (user.newAssignee !== user.currentAssignee && user.newAssignee) {
                this.handleAPI(taskId, user.newAssigneeId, this.props.processInstanceId);
            }
        })
    }

    render() {
        return (
            <div className="reassign">
                <button
                    type="button"
                    className="action-task"
                    onClick={this.handleShow}
                >
                    <div className="menuItemImageContainer">
                        <span className="processImage icon-transfer-2" />
                    </div>
                    <div className="menuItemTextContainer">
                        <div className="headerRow">Reassign</div>
                    </div>
                </button>
                {(this.state.show && !this.props.loader) && (
                    <Reassign
                        show={this.state.show}
                        handleClose={this.handleClose}
                        title="Reassign Task"
                        handleSave={this.handleSave}
                        currentTask={this.props.currentTask}
                    />
)}
            </div>
        );
    }
}

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(null, mapDispatchToProps)(UserReassign)