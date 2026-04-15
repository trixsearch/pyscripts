import React, { useState, useEffect } from "react";
import ReactTooltip from "react-tooltip";
import { connect } from "react-redux";
import Axios from "axios";
import moment from 'moment';
import { useParams } from "react-router-dom";

import { ENTITY_NAME, PROCESS_DATETIME_FORMAT } from "../../Data/constants";

import { isMobile } from "../utils";
import { Button } from "../../components/UI/AppButton/AppButton";
import {
  TaskListItemContentLoader,
  TaskListItemActionButtonContentLoader
} from "../../components/UI/ContentLoaders/ContentLoaders";
import { COMPLETED_TASKS, MY_TASKS } from "./TaskConstants";
import { getTaskAction, claimTask} from "../../store/actions";

const APP_URL = process.env.REACT_APP_APP_URL;

const TaskItem = props => {
  const {contentLoader} = props;
  const { uuid: orgId } = useParams();
  const taskAction = () =>{
    props.getTaskAction(orgId, props.task.id, props.history, props.task.assignee, props.current_task_owner.userId)
  }


  const taskClaim = () => {
      props.claimTask(orgId, props.task.id, props.history, props.task.assignee, props.current_task_owner, props.claimFailTaskRefreshHandler);
    };

  const [variables, setVariables] = useState({});
  // Task tile is loaded in 2 stages
  // #1 Index page loads the task with process variables
  // #2 This component loads the entity_name only. 
  // Since the task tile is ready, we should not block the application. Hence no loader needs to be shown.

  let processInstanceId = "";
  let formKey = "";

  if(props.task && !contentLoader) {
    processInstanceId = props.task.processInstanceId;
    formKey = props.task.formKey
  }

  useEffect(() => {
    
    async function fetchData() {
      try {
        if(processInstanceId) {
          const response = await Axios.get(`${APP_URL}/${orgId}/proxy-bpm/process-instances/variables/${processInstanceId}?formKey=${formKey}`);
          setVariables(response.data.data);
          return response.data.data;
        }
      } catch (error) {
          return error;
      } 
      
      return null;
    }
    
    if(!contentLoader) {
      fetchData();
    }

  }, [processInstanceId, formKey, contentLoader]);


  return (
    <div className="start_sending_invite_card_box">
      <div className="completed_process_details_cont task_card">
        <div className="process_details_text user_img" />
        <div className="process_details_text">
          <p>For</p>

          {
            contentLoader
            ? <TaskListItemContentLoader />
            : (
              <>
                <h6
                  className="task_entity_name-overflow"
                  data-tip
                  data-for={props.task.id}
                >
                  {variables[ENTITY_NAME] || "-"}
                </h6>
                {!isMobile() && (
                  <ReactTooltip
                    id={props.task.id}
                    place="bottom"
                    delayShow={100}
                    aria-haspopup="true"
                    className="app_btn_bg_color tooltip-text"
                  >
                    <h6>{variables[ENTITY_NAME] || "-"}</h6>
                  </ReactTooltip>
                )}
              </>
            )

          }
          
        </div>
        <div className="process_details_text">
          <p>Task Title</p>
          {
            contentLoader 
            ? <TaskListItemContentLoader />
            : (
              <h6>{props.task.name || "Unnamed Task"}</h6>
            )
          }
        </div>

        <div className="process_details_text">
          <p>{props.taskType === COMPLETED_TASKS ? 'Start ' : 'Created '}Date &amp; Time</p>
          <h6>
            {
              // eslint-disable-next-line no-nested-ternary
              contentLoader 
              ? (
                <TaskListItemContentLoader />
                ) : props.taskType === COMPLETED_TASKS ? moment(props.task?.startDate).format(PROCESS_DATETIME_FORMAT) : props.task.createTime ? (
                moment(props.task.createTime).format(PROCESS_DATETIME_FORMAT)
              ) : (
                "-"
              )
            }
          </h6>
        </div>
        <div className="process_details_text">
          <p>{props.taskType === COMPLETED_TASKS ? 'End Date ' : 'Due Date '}</p>
          <h6>
            {
              // eslint-disable-next-line no-nested-ternary
              contentLoader
              ? (
                <TaskListItemContentLoader />
                ) : props.taskType === COMPLETED_TASKS ? moment(props.task?.endDate).format(PROCESS_DATETIME_FORMAT) : props.task.dueDate ? (
                moment(props.task.dueDate).format(PROCESS_DATETIME_FORMAT)
              ) : (
                "-"
              )
            }
          </h6>
        </div>
        <div className="user_button">
        {
          // eslint-disable-next-line no-nested-ternary
          contentLoader
            ? <TaskListItemActionButtonContentLoader />
              : props.taskType === COMPLETED_TASKS ? null : props.taskType === MY_TASKS 
              ? (
                <Button variant="primary" onClick={taskAction}>
                  <span className="ezedox_text_task">Action</span>
                </Button>
              ): (
                <Button variant="primary" onClick={taskClaim}>
                  <span className="ezedox_text_task">Claim</span>
                </Button>
              )
        }
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  return {
      current_task_owner : state.auth.current_task_owner
  }
}

const mapDispatchToProps = dispatch => ({
  claimTask: (orgId, id, history, assignee, current_task_owner, handler) => dispatch(claimTask(orgId, id, history, assignee, current_task_owner, handler)),
  getTaskAction: (orgId, id, history, assignee, current_task_owner) => dispatch(getTaskAction(orgId, id, history, assignee, current_task_owner)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskItem);
