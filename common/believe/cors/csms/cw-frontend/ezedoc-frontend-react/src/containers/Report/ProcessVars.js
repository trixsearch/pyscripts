/* eslint-disable no-nested-ternary */
import React from "react";
import ReactTooltip from "react-tooltip";

import "../Config/View/ConfigView.css";
import { isMobile } from '../utils';

const ProcessVars = (props) => {
  let {
    toggle,
    processVars,
    handleCheck,
    handleToggle,
    checkedFields,
    reportVariables,
    processVarsError,
  } = props;

  let reportvarData = false
  if (Object.keys(reportVariables).length === 0) {
    reportvarData = true
  } else {
    reportvarData = false
  }

  checkedFields = [...Object.keys(checkedFields)];

  return (
    <div>
      {!processVarsError ? (
        <div style={{ margin: 4 }}>
          <h4>Select Report variables from each section.</h4>
          {Object.keys(processVars).length ? (
            Object.keys(processVars).map((key, ind) => (
              <div key={`processVars_${ind + 1}`} style={{ marginBottom: 24 }}>
                <div style={{ marginLeft: 12, display: "flex" }}>
                  <p>{key}</p>
                  <button
                    type="button"
                    className="process-vars-toggle"
                    name={`toggle${key}`}
                    onClick={handleToggle}
                  >
                    {toggle[`toggle${key}`] ? "Collapse" : "Show"}
                  </button>
                </div>
                <div className={toggle[`toggle${key}`] && reportvarData ? "checkbox-container required_report_variables" : toggle[`toggle${key}`] && !reportvarData ? "checkbox-container collapse_report_variables" : "collapse_report_variables"}>
                  {Object.keys(processVars[key]).map((val, index) => {
                    return toggle[`toggle${key}`] ? (
                      <div
                        key={`processVars_${key}_${index + 1}`}
                        className="config-view-checkbox"
                        style={{ display: "flex", marginLeft: 10 }}
                      >
                        <input
                          id={val}
                          className="checkbox"
                          onChange={handleCheck}
                          checked={checkedFields.some(field => {
                            return field === val;
                          })}
                          type="checkbox"
                          name={`${val}-${processVars[key][val]}`}
                        />
                        <div>
                          <p
                            data-tip
                            data-for={val}
                            role='presentation'
                            className="process-vars-text field-name"
                            onClick={() => handleCheck({
                              target: {
                                name: `${val}-${processVars[key][val]}`,
                                checked: !checkedFields.some(field => {
                                  return field === val;
                                }),
                              }
                            })}
                          >
                            {processVars[key][val]}
                          </p>
                          {!isMobile() ? (
                            <ReactTooltip
                              id={val}
                              place="bottom"
                              delayShow={500}
                              aria-haspopup="true"
                              className="app_btn_bg_color"
                            >
                              <p>{processVars[key][val]}</p>
                            </ReactTooltip>
                          ) : null}
                        </div>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            ))
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default ProcessVars;
