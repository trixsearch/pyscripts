import React from "react";
import ReactTooltip from "react-tooltip";

import { isMobile } from "../utils";

const TabComponent = props => {
  const {
    id, name, TabClassName, TabStyle
  } = props;

  return (
    <li
      role="presentation"
      key={id}
      onClick={props.onClick}
      className={TabClassName}
    >
      <a
        data-tip
        role="tab"
        data-toggle="tab"
        className="nav-link"
        aria-selected="true"
        id={`${name}-tab`}
        href={`#${name}`}
        aria-controls={name}
        style={TabStyle}
        data-for={`detail_${name}`}
      >
        {name}
      </a>
      {!isMobile() ? (
        <ReactTooltip
          id={`detail_${name}`}
          place="bottom"
          aria-haspopup="true"
          className="app_btn_bg_color"
        >
          <span className="tab_tooltip">{name}</span>
        </ReactTooltip>
      ) : null}
    </li>
  );
};

export default TabComponent;
