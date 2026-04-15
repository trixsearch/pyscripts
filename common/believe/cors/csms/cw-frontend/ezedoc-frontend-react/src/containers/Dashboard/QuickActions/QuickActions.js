import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { connect } from "react-redux";

import MainContainer from "components/UI/MainContainer";

import * as actions from "../../../store/actions/index";
import * as constants from "../../../Data/constants"
import { isMobile } from "../../utils";
import {
    DashboardTaskCountContentLoader
} from "../../../components/UI/ContentLoaders/ContentLoaders";
import {
    CURRENT_TASK_FILTER_TYPE, MY_TASKS, GROUP_TASKS, FILTER_BY_VALUE
} from "../../Tasks/TaskConstants"

class QuickActions extends Component {
    interval

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const orgId = this.props.orgId;
        
        if (this.props.involvedGroups && this.props.involvedGroups.length > 0) {
            this.props.taskFilter(orgId, this.props.involvedGroups[0].id)
        }
        if(!this.props.quickActionsLoader){
            this.props.quickActions(orgId);
        }
    }

    componentWillUnmount() {
        if (!isMobile()) {
            clearInterval(this.interval)
        }
    }

    onClickViewAllTasks = () => {
        let taskData = {
            taskType: MY_TASKS
        }
        localStorage.setItem(CURRENT_TASK_FILTER_TYPE, JSON.stringify(taskData));
        localStorage.removeItem(constants.CURRENT_TASK_FILTER_NAME);
    }

    onClickViewGroupTasks = (groupTaskId) => {
        let taskData = {
            taskType: groupTaskId
        }
        localStorage.setItem(CURRENT_TASK_FILTER_TYPE, JSON.stringify(taskData));
        localStorage.removeItem(constants.CURRENT_TASK_FILTER_NAME);
        if (groupTaskId !== GROUP_TASKS && this.props.taskFilterData) {
            localStorage.setItem(FILTER_BY_VALUE, JSON.stringify(this.props.taskFilterData));
        }
    }

    render() {
        const {
            total, quickActionsLoader, groupTaskTotal, navlink
        } = this.props;

        let groupTaskId = GROUP_TASKS
        let myTaskTab = (
            <>
                {navlink
                    ? (
                        <NavLink className="pending-task-hover" to={`/custom-workflow/org/${this.props?.orgId}/tasks?taskType=tasks`} onClick={this.onClickViewAllTasks}>
                            <p className="pending-task-count">{total}</p>
                        </NavLink>
                    )
                    : <p className="pending-task-count">{total}</p>
                }
            </>
        )

        let groupTaskTab = (
            <>
                {navlink
                    ? (
                        <NavLink className="pending-task-hover" to={`/custom-workflow/org/${this.props?.orgId}/tasks?taskType=group_tasks`} onClick={() => this.onClickViewGroupTasks(groupTaskId)}>
                            <p className="pending-task-count">{groupTaskTotal}</p>
                        </NavLink>
                    )
                    : <p className="pending-task-count">{groupTaskTotal}</p>
                }
            </>
        )

        let taskContentLoader = (
            <div className="task-cont-loader">
                <DashboardTaskCountContentLoader />
            </div>
        )


        return (
            <div className="pending-task-cont graph_cont_body">

                {this.props.type === "myTask"
                    ?(
                      <>
                          <p className="my-pending-Tasks">My Tasks</p>
                          {
                              !quickActionsLoader
                                  ? (
                                      <MainContainer serverError={this.props.error} fallback="&#x26a0;&#xFE0F;">
                                          {this.props.total
                                              ? myTaskTab
                                              : <p className="pending-task-count">0</p>}
                                      </MainContainer>
                                  )
                                  : taskContentLoader
                          }

                      </>
                  )
                    : (
                        <>
                            <p className="my-pending-Tasks">My Group Tasks</p>
                            {
                                !quickActionsLoader
                                    ? (
                                        <MainContainer serverError={this.props.error} fallback="&#x26a0;&#xFE0F;">
                                            {(groupTaskId && this.props.groupTaskTotal)
                                                ? groupTaskTab
                                                : <p className="pending-task-count">0</p>}
                                        </MainContainer>
                                    )
                                    : taskContentLoader
                            }
                        </>
                    )
                }
            </div>
        )
    }
}

const mapStateToProps = state => ({
    total: state.dashboard.total,
    tasks: state.dashboard.tasks,
    apps: state.dashboard.apps,
    error: state.dashboard.error,
    quickActionsLoader: state.dashboard.quickActionsLoader,
    involvedGroups: state.auth.involved_groups,
    groupTaskTotal: state.dashboard.groupTaskTotal,
    taskFilterData: state.dashboard.taskFilterData
})

const mapDispatchToProps = (dispatch) => ({
    taskFilter: (orgId, groupId) => dispatch(actions.taskFilter(orgId, groupId)),
    quickActions: (orgId) => dispatch(actions.dashboardQuickActions(orgId))
})

export default connect(mapStateToProps, mapDispatchToProps)(QuickActions);
