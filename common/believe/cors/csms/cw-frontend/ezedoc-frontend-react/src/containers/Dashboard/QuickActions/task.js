import React from "react";
import { NavLink } from "react-router-dom";

const Task = (props) => {
    return (
        <div className="startNewProcessMenuItem task-card">
            <NavLink className="menuItemTextContainer" style={{textDecoration : 'none'}} to={`/tasks/${props.id}`}>
                <p data-cy="task-name" className="headerRow" style={props.entityName.length ? {paddingLeft : "22px", marginTop: "-7px"} : {paddingLeft:"22px"}}>
                    {props.task.name ? props.task.name : "Unnamed Task"}
                </p>
                <p data-cy="task-entity-name" className="headerRow" style={{marginTop:"-22px", paddingLeft : "22px", fontSize : "10px"}}>
                    {props.entityName.length ? props.entityName[0].value : ""}
                </p>
            </NavLink>
        </div>
    )
}
export default Task;
