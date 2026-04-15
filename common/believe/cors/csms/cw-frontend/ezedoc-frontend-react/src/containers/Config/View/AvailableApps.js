/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */
import React from "react";
import { connect } from "react-redux";
import ReactTooltip from "react-tooltip";

import { isMobile } from '../../utils';
import FilterDropdown from '../../../components/UI/FilterDropdown/FilterDropdown'
import Sortable from "../../../components/UI/Sortable/Sortable"
import { CONFIG_VIEW_PROCESS } from "../../../Data/constants";

const AvailableApps = ({
  apps,
  isLoading,
  selectedApp,
  name,
  processVars,
  processError,
  handleCheck,
  handleFormList,
  saveProcessVars,
  selectedFormFields,
  saveError,
  selectedForms,
  editPermission,
  activeRole,
  allRoles,
  handleRoleChange,
  selectedOptions,
  onDragEnd,
  saveDisabled,
  totalAllowedSelection,
  roleDropdownClassName,
  workflowDropdownClassName,
  allEntityWorkflows,
  selectedEntityWorkflows,
  handleActionChecked,
  configType,
  sectionTitle,
}) => {
  let checkedFields = null;

  if (selectedFormFields)
    checkedFields = selectedFormFields.map(item => {
      return Object.keys(item)[0]
    });
  return (
    <div>
      <div className="main_container">
        <div className="app_btn_container">
          <div>
            <div className="config_view_middle_container">
              <div>
                <p className="section-title">{sectionTitle}</p>
                <p className="note-text">
                  {`Duplicate keys will be auto-selected, but will be counted only once. You can select upto ${totalAllowedSelection} fields ( ${checkedFields ? checkedFields.length : '0'} out of ${totalAllowedSelection} fields are selected )`}
                </p>
              </div>
              <div className="config_view_workflow_dropdown_container">
                <FilterDropdown
                  list={apps}
                  selectedItem={name}
                  disableComponent={isLoading}
                  onItemClickHandler={selectedApp}
                  classes={workflowDropdownClassName}
                />
              </div>
              <div className="config_view_role_dropdown_container">
                <FilterDropdown
                  list={allRoles}
                  selectedItem={activeRole}
                  disableComponent={isLoading || (processVars && Object.keys(processVars).length === 0)}
                  classes={roleDropdownClassName}
                  onItemClickHandler={handleRoleChange}
                />
              </div>
            </div>
          </div>
          <div className="process_selection_container">
            {
              !isLoading
                ? (
                  processError ? (
                    <p style={{ color: "red" }}>
                      {`Failed to return form labels for this ${configType === CONFIG_VIEW_PROCESS ? 'organisation workflow' : 'entity model'}.`}
                    </p>
                  ) : processVars
                      ? Object.keys(processVars).length ? (
                        Object.keys(processVars).map((key, ind) => (
                          <div key={`${key}__${ind + ind}`} className="config-view-form-fields-checkbox-container">
                            <div
                              className="config-view-checkbox-form-name"
                              data-cy="form-name"
                            >
                              <input
                                id={ind}
                                className="checkbox"
                                onChange={handleFormList}
                                type="checkbox"
                                checked={selectedForms.some(item => {
                                  return item === key
                                })}
                                name={key}
                                style={{ marginTop: 1 }}
                              />
                              <div className="checkbox-text">
                                <p
                                  role='presentation'
                                  onClick={() => handleFormList({
                                    target: {
                                      name: key,
                                      checked: !selectedForms.some(item => {
                                        return item === key
                                      }),
                                    }
                                  })}
                                >
                                  {key}
                                </p>
                              </div>
                            </div>
                            <div className="checkbox-container">
                              {Object.keys(processVars[key]).map((val, index) => (
                                <div
                                  key={`${val}__${index + index}`}
                                  className="config-view-checkbox"
                                >
                                  <input
                                    id={val}
                                    className="checkbox"
                                    onChange={handleCheck}
                                    checked={checkedFields.some(field => {
                                      return field === val;
                                    })}
                                    type="checkbox"
                                    name={`${val}____${processVars[key][val]}`}
                                  />
                                  <div>
                                    <p
                                      data-tip
                                      data-for={`${key}__${val}__${index + index}`}
                                      className="process-vars-text"
                                      role='presentation'
                                      onClick={() => handleCheck({
                                        target: {
                                          name: `${val}____${processVars[key][val]}`,
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
                                        id={`${key}__${val}__${index + index}`}
                                        place="bottom"
                                        delayShow={500}
                                        aria-haspopup="true"
                                        className="app_btn_bg_color"
                                      >
                                        <span>{processVars[key][val]}</span>
                                      </ReactTooltip>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                          <p>No forms for this app</p>
                        ) : null
                ) : null
            }

            {!isLoading && processVars && !!selectedOptions.length && !!Object.keys(processVars).length && (
              <React.Fragment>
                <div className="app_showing_head">
                  <p>
                    Contents&nbsp;
                    <small className="order-helper-text">
                      (Move the content side-ways to change the order)
                    </small>
                  </p>
                </div>
                <Sortable selectedOptions={selectedOptions} cardColor='#7b7d85' onDragEnd={onDragEnd} />
              </React.Fragment>
            )}

            {
              !isLoading && !processError && !!Object.keys(processVars).length && allEntityWorkflows && (
                <div className="config-view-form-fields-checkbox-container">
                  <p>Entity Update Access</p>
                  <div className="checkbox-container">
                    {
                      allEntityWorkflows.length > 0 && allEntityWorkflows.map((item, index) => (
                        <div
                          key={`action_${item.id}_${index + index}`}
                          className="config-view-checkbox"
                        >
                          <input
                            id={item.id}
                            name={item.name}
                            type="checkbox"
                            className="checkbox"
                            onChange={handleActionChecked}
                            checked={selectedEntityWorkflows && selectedEntityWorkflows.length > 0 && selectedEntityWorkflows.some(data => data === item.id)}
                          />
                          <div>
                            <p
                              data-tip
                              data-for={`action__${item.id}_${index + index}`}
                              className="process-vars-text"
                            >
                              {item.name}
                            </p>
                            {!isMobile() ? (
                              <ReactTooltip
                                id={`action__${item.id}_${index + index}`}
                                place="bottom"
                                delayShow={500}
                                aria-haspopup="true"
                                className="app_btn_bg_color"
                              >
                                <span>{item.name}</span>
                              </ReactTooltip>
                            ) : null}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )
            }

            {
              !isLoading && !processError
                ? (
                  <div className={processError ? 'display-none' : 'save-button'}>
                    <p className={saveError ? 'save-error' : 'display-hidden'}>
                      {`You have selected more than ${totalAllowedSelection} fields, please select a maximum of ${totalAllowedSelection}.`}
                    </p>
                    {!!Object.keys(processVars).length && editPermission && (
                      <button
                        type="button"
                        disabled={saveError || saveDisabled}
                        onClick={saveProcessVars}
                        className="fancy_btn active"
                      >
                        Save View
                      </button>
                    )}
                  </div>
                )
                : null
            }
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  return {
    editPermission: state.auth.uiPermissions.organisationworkflow.change
  };
};

export default connect(mapStateToProps)(AvailableApps);
