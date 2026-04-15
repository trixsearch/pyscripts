

import React from "react";

import "./SliderCheckbox.css";

const SliderCheckbox = props => {
  return (
    <div className="checkbox checkbox-slider--b-flat">
      <label>
        <input
            type="checkbox"
            checked={props.checked}
            name={props.name}
            onChange={props.onChange}
        />
        <span style={{position: 'relative',top: -11}}/>
      </label>
    </div>
  );
};

export default SliderCheckbox;