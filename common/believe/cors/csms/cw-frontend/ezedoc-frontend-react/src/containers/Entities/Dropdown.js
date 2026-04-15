import React, { useRef, useEffect } from "react";
import '../Dashboard/WorkflowFloatingDropdown.css';

// Detect outside click
export function useOutsideClick(ref, handler) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, handler])
}

const WorkflowDropdown = props => {
  let data = props.data;

  const handler = () => {
    props.closeHandler();
  }

  const dropdownRef = useRef(null);
  useOutsideClick(dropdownRef, handler);

  const handleHover = (workflow) => {
  if(typeof props.handleHover === "function" || typeof props.handleHover === "object" )
    props.handleHover(workflow)
  }

  if (props.open) {
    return (
      <div ref={dropdownRef}>
        <div className="startNewProcessMenuTriangle" />
        <div className="startNewProcessMenu">
          {data.length === 0 && (
            <div className="no-workflow">No workflows</div>
          )}
          {data.map(workflow => {
            return (
              <ItemCard
                key={workflow.id}
                name={workflow.name}
                id={workflow.id}
                hoveredApps={props.hoveredApps}
                icon={workflow.icon_class}
                description={workflow.description}
                editForm={() => props.editForm(workflow)}
                handleHover={()=> handleHover(workflow)}
                status={() => props.status(workflow)}
                isIcon={props.isIcon}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

const ItemCard = props => {
  let loader = props.isIcon && (props.hoveredApps[props.id] === undefined ||  props.hoveredApps[props.id] === "pending")
  return (
    <div 
      onMouseOver={props.handleHover}
      onFocus={() => {}} 
      className={`start-new-process-item  ${props.hoveredApps && props.hoveredApps[props.id] === "yes" ? 'disabled_none' : ''}`}
    >
      <div
        onClick={props.editForm}
        role="presentation"
        className={`startNewProcessMenuItem ${loader ? 'disabled_none': ""}` }
      >
        <div className="menuItemImageContainer">
          <span className={`processImage ${props.icon}`} />
        </div>
        <div className="menuItemTextContainer">
          <p className="headerRow">{props.name}</p>
          <p className="descriptionRow">{props.description}</p>
        </div>
      </div>
      {props.isIcon && props.hoveredApps[props.id] === "pending" && (
        <div className="bulk-init-button-container-loader">
          <div className="bulk-init-loader-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      {props.isIcon && props.hoveredApps[props.id] === "yes" && (
      <div style={{ display: "flex", alignItems: "center",width:100}}>
          <span className="bulk-init-text" style={{ fontSize: 12 ,color:'black' }}>
            In progress
          </span>
      </div>
      )}
    </div> 
  );
};

export default WorkflowDropdown;
