import React from "react";
import Select from "react-select";
import { portalPageStyles } from "../Config/Utils/ReactSelectStyles";

const DecisionWorkContent = (props) => {
  if (props.props.workflows === true) {
    return (
      <Select
        isClearable={false}
        isMulti
        noOptionsMessage={() => null}
        styles={portalPageStyles}
        placeholder="Associate one or more workflow"
        onChange={props.handleApps}
        options={props.categoryOption}
      />
    );
  }
  return (
    <Select
      isClearable={false}
      isMulti
      styles={portalPageStyles}
      noOptionsMessage={() => null}
      placeholder="Associate one or more content"
      onChange={props.handleContent}
      options={props.contentOption}
    />
  );
}

export default DecisionWorkContent;