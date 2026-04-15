import React, { memo } from "react";

const AppButton = props => {
  return (
    <div>
      <button type="button" className="app_btn">
        <span className="app_btn_icon">
          <span className="icon-message" />
        </span>
        <span>{props.elementName}</span>
      </button>
    </div>
  );
};

export const Button = memo(({ 
  variant, children, disabled, onClick, icon, customStyle = {} 
}) => {
  let className = "";
  switch (variant) {
    case "primary":
      className = "fancy_btn active";
      break;
    case "secondary":
      className = "fancy_btn";
      break;
    case "link":
      className = "appear-like-link";
      break;
    case "table-row-edit":
      className = "table_btn edit";
      break;
    case "table-row-delete":
      className = "table_btn delete";
      break;
    case "table-row-secondary":
      className = "table_btn secondary";
      break;
    default:
      className = variant;
      break;
  }
  return (
    <button
      type="button"
      className={className}
      disabled={!!disabled}
      onClick={onClick}
      style={customStyle}
    >
      {!!icon && <span className={icon} />}
      {children}
    </button>
  );
});

export default AppButton;
