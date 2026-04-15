import React from "react";
import ReactTooltip from "react-tooltip";
import { Button } from "../../../components/UI/AppButton/AppButton";

export const MainContainer = React.memo(({ children }) => (
  <div
    className="edit_app_detils_form_cont"
    style={{ marginBottom: 0, paddingBottom: 0 }}
  >
    <div className="checkbox_container">{children}</div>
  </div>
));

export const CheckBox = ({name, clicked, checked, disabled }) => {
  return (
    <div className="col_box edit_checkbox_body">
      <div className="squaredThree">
        <input
          type="checkbox"
          name={name}
          disabled={disabled}
          checked={checked}
          onChange={clicked}
        />
      </div>
    </div>
  );
};

export const HeaderComponent = React.memo(({ children }) => (
  <div className="row_box">{children}</div>
));

export const HeaderItem = React.memo(({ name }) => (
  <div className="col_box edit_checkbox_heding">{name}</div>
));

export const BodyComponent = React.memo(({ children }) => (
  <div
    className="scrollable_list"
    style={{ maxHeight: window.innerHeight - 380 }}
  >
    {children}
  </div>
));

export const BodyHeader = React.memo(({ name, id }) => (
  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <span data-tip data-for={`${id}`} style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}} >
      {name}
    </span>
    <ReactTooltip
      id={id}
      place="bottom"
      delayShow={1000}
      aria-haspopup="true"
      className="app_btn_bg_color"
    >
      <span>{name}</span>
    </ReactTooltip>
  </div>
));

export const CheckBoxContainer = React.memo(({ id, children }) => (
  <div key={id} className="row_box_body configure_role">
    <div className="row_box" style={{ display: "flex", alignItems: "center" }}>
      {children}
    </div>
  </div>
));

export const ContainerBox = React.memo(({ entity, children }) => (
  <CheckBoxContainer id={entity.id || entity.appId}>
    <div className="col_box edit_checkbox_body" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
      <BodyHeader name={entity.name} id={entity.id || entity.appId} />
    </div>
    {children}
  </CheckBoxContainer>
));

export const Save = React.memo(({ updatePermission,editDisabled}) => (
  <div
  className="role_permission_save_button_container"
  style={{ padding: 10 }}
  >
  <Button
    disabled={editDisabled}
    variant="primary"
    onClick={updatePermission}
  >
    Save
  </Button>
  </div>
));


export const TabList = props => {
  return (
    <li className={props.className}>
      <button
        onClick={props.onClick}
        type="button"
        className="nav-button"
        style={{ cursor: "pointer" }}
        name={props.name}
        data-toggle="tab"
        data-tab={props.name}
        role="tab"
      >
        {props.name}
      </button>
    </li>
  );
};
