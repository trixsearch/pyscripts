import React from "react";

import "./Checkbox.css";

const Checkbox = props => {
  return (
      <div 
        role="presentation" 
        className="round"
      >
        <input
          onChange={props.click} 
          type="checkbox" 
          checked={props.checked}
          id={props.id}
        />
        <label htmlFor={props.id}>
          {props.children}  
        </label>
      </div>
  );
};

export default Checkbox;
