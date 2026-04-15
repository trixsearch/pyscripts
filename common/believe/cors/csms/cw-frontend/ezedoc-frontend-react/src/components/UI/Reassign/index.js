import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import AsyncSelect from 'react-select/async';
import { useParams } from 'react-router-dom';
import Modal from '../../Modal';
import { customStyles } from "../../../containers/Config/Utils/ReactSelectStyles";
import { handleTaskUsersSearch, DropdownIndicator } from "../../../containers/Config/Utils/ConfigUtils";
import { email_test } from "../../../containers/Process/ProcessComponents"
import { CANDIDATE_USER } from "../../../Data/constants"

const Reassign = ({
    show, handleClose, handleSave, currentTask, title,
}) => {
    const [taskReassigned, setTaskReassigned] = useState({});
    const { uuid: orgId } = useParams();

    useEffect(() => {
        let currentTasks = {};
        currentTask.forEach(task => {
            Object.assign(currentTasks, {
                [task.id]: {
                    "currentAssignee": task.assignee,
                    "newAssignee": null
                }
            })
        });
        setTaskReassigned(currentTasks)
    }, [currentTask])

    const selectUser = (taskId) => {
        const onChange = (data) => {
            let tasks = taskReassigned;
            tasks[taskId].newAssignee = data.label
            tasks[taskId].newAssigneeId = data.value
            setTaskReassigned(tasks)
        }
        return onChange;
    }
    return (
        <>
            <Modal
                show={show}
                onClose={() => handleClose()}
                title={title}
                primaryBtn={{ text: "Save", className: "fancy_btn active", onClick: () => handleSave(taskReassigned) }}
                secondaryBtn={{ text: "Cancel", className: "fancy_btn", onClick: () => handleClose() }}
            >
                {currentTask.length ? (
                    <div className="form-group" style={{ height: "185px", overflowY: "auto" }}>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: "200px" }}>
                                        <span>Task Name</span>
                                    </th>
                                    <th style={{ width: "300px" }}>
                                        <span>Task Assignee</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentTask.map((task) => (
                                    <tr style={{ height: "60px" }} key={task.id}>
                                        <td>
                                            {task.name ? task.name : "Unnamed Task"}
                                        </td>
                                        <td>
                                            <AsyncSelect
                                                noOptionsMessage={() => null}
                                                components={{ DropdownIndicator }}
                                                placeholder='Search for users by email id'
                                                styles={customStyles}
                                                loadOptions={(text) => handleTaskUsersSearch(orgId, text)}
                                                onChange={selectUser(task.id)}
                                                defaultValue={{ value: "task assignee", label: email_test(task.assignee) ? CANDIDATE_USER : task.assignee }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <h3 style={{ textAlign: "center" }}>You have no task to Reassign</h3>
                )
                }
            </Modal>
        </>
    )
}


export default connect(null, null)(Reassign);
