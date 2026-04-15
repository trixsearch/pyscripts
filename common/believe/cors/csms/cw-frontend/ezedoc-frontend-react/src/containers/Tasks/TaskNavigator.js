import React, { Component } from "react";
import { connect } from "react-redux";
import Reloader from 'components/UI/Reloader/Reloader';
import {
  MY_TASKS,
  GROUP_TASKS,
  CREATE_TIME,
  DUE_DATE,
  COMPLETED_TASKS,
  START_TIME,
  END_TIME
} from "./TaskConstants";
import FilterDropdown from '../../components/UI/FilterDropdown/FilterDropdown';
import { showScrollArrows, arrowButtons } from "../utils";
import { Button } from 'components/UI/AppButton/AppButton'
import DrawerFilter from '../Tasks/DrawerFilter/DrawerFilter';
import { Tag } from 'antd';
import { getTaskAction, claimTask } from "../../store/actions";
import { addToast } from "../../components/Toast/actions";
import { HasAccess } from "../../platformDataStoreContext";
import { CW_SERVICE_TASKS_ACTION } from "../../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

const splitButtonData = (props) => (
  <span
    role="presentation"
    style={{ fontSize: '20px' }}
    className={`icon-${props.order}`}
  />
)

const selectedItemFormatting = (selectedOption, list) => {
  let selectedText = '';
  list?.map(element => {
    if (selectedOption === element.id) {
      selectedText = element.name;
    }
    return element
  });
  return selectedText;
}

const CountBadge = ({ count = "-", max = 999 }) => (
  <span className="badge badge-pill badge-secondary p-1" style={{ marginLeft: "5px" }}>
    {count > max ? `${max}+` : count}
  </span>
);

const getTagComponent = (values, onClear, filterKeys) => {
  let tags = Object.keys(values).map((key)=>{
    let value;
    if(values[key]?.type === "column_search"){
      return {
        label: values[key]?.label,
        value: values[key]?.value,
      }
    }
    if (values[key]?.[0] && values[key][0]?.type === 'csv') {
      let label = filterKeys?.find(item => item?.key === key)?.label;
      return {
        label,
        value: values[key]?.[0]?.value?.trim()
      }
    }
    if(key!=='vendor_added' && values[key]) {
      let label = filterKeys?.find(item => item?.key === key)?.label;
      value = values[key]
      if(Array.isArray(value)){
        if(value[0] && typeof value[0] === 'object'){
          value = value?.map(a=>a.label)?.join(',')
        }else{
          value = value?.join(',')
        }
      }
    return({ label, value })
    };
  })
  return (tags?.length && 
    <>
      <p style={{ marginRight: '10px', marginBottom: '0px', marginLeft: '5px' }}>Active Filters : </p>
      {tags?.map(tag=>tag?.label && <span className="active_filters_values"><Tag>{tag.label} : {tag.value}</Tag></span>)}
      <button type="button" className="appear-like-link" onClick={onClear}>Clear All</button>
    </>
  )
}

class TaskNavigator extends Component {
  constructor(props) {
    super(props);
    this.tabRef = React.createRef();
    this.setFilters = props.setFilters.bind(this);
    this.state = {
      showArrow: false,
      showSideFilter: false,
      ageFilterCleared: false,
    }
  }

  // show carousel arrows
  showArrows = (delay = null) => {
    setTimeout(() => {
      let showArrow = showScrollArrows(this.tabRef.current);
      this.setState({
        showArrow
      });
    }, delay || 50);
  };

  TaskFilterList = (props) => {
    return props === COMPLETED_TASKS ? [
      {
        id: START_TIME,
        name: 'Start Date'
      },
      {
        id: END_TIME,
        name: 'End Date'
      }
    ] : [
      {
        id: CREATE_TIME,
        name: 'Created Date'
      },
      {
        id: DUE_DATE,
        name: 'Due Date'
      }
    ]
  }

  onClickHandler = (type, arg1, arg2 = null, arg3 = null) => {
    if (type === "commonTasksGroupTasks") {
      this.props.handleTaskTab(arg1);
    } else if (type === "customGroupTask") {
      this.props.handleTaskTab(arg1, arg2, arg3);
    }
    this.showArrows();
  }

  onClearFilter = () => {
    if (this.props.setFilterData && typeof this.props.setFilterData === 'function') {
      this.props.setFilterData({});
    }
    if (this.props.setFilters && typeof this.props.setFilters === 'function') {
      this.props.setFilters({});
    }
    localStorage.removeItem('filterData');

    // Also clear the ageFilter select element by resetting its state
    // This ensures the hardcoded ageFilter also gets cleared visually
    this.setState({ ageFilterCleared: true });
  }

  checkDisable = () => {
    let disable = false;
    if (this.props?.selectedTasks?.length < 2) disable = true
    else {
      this.props?.selectedTasks?.forEach(item => {
        if (item?.name !== this.props?.selectedTasks[0]?.name) disable = true
      })
    }
    return disable
  }

  handleBulkAction = () => {
    let selectedtasks = this.props?.selectedTasks?.map(item => item?.id)
    axios
      .get(`${APP_URL}/${this.props.orgId}/forms/formversionwrapper?form_key_version=${this.props?.selectedTasks[0]?.formKey?.split("::")[0]}_bulk&processInstanceId=${this.props?.selectedTasks[0]?.processInstanceId}&get_keytype=true`)
      .then(res => {
        if (res?.data?.data?.is_bulk_supported) {
          this.props.getTaskAction(this.props.orgId, selectedtasks[0], this.props.history, this.props?.selectedTasks[0]?.assignee, this.props.current_task_owner.userId, true, selectedtasks)
        } else {
          this.props.addToast('error', 'Error', "Bulk action is not supported for this task");
        }
      }).catch(() => {
        this.props.addToast('error', 'Error', "No forms or attachments are available to show at this moment");
      })
  }

  componentDidMount() {
    // Honor defaultValue for agefilter when component mounts
    // Only call if required props are available
    if (this.props.setFilterData && this.props.setFilters && this.props.filterKeys) {
      this.honorAgeFilterDefault();
    }
  }

  componentDidUpdate(prevProps) {
    // Honor defaultValue when filterKeys change
    if (prevProps.filterKeys !== this.props.filterKeys) {
      // Only call if required props are available
      if (this.props.setFilterData && this.props.setFilters && this.props.filterKeys) {
        this.honorAgeFilterDefault();
      }
    }
  }

  honorAgeFilterDefault = () => {
    const ageCfg = (this.props.filterKeys || []).find(f => f.key === 'agefilter');
    if (ageCfg?.defaultValue && !this.props.filters?.agefilter?.length && !this.props.filterData?.agefilter) {
      const defaultAgeFilter = [{ 
        label: ageCfg.defaultValue, 
        value: ageCfg.defaultValue, 
        type: 'select' 
      }];
      
      // Reset the cleared state when applying defaults
      this.setState({ ageFilterCleared: false });

      // Set UI state for DrawerFilter
      if (this.props.setFilters && typeof this.props.setFilters === 'function') {
        this.props.setFilters({
          ...this.props.filters,
          agefilter: defaultAgeFilter
        });
      }
      
      // Set API state for backend filtering
      if (this.props.setFilterData && typeof this.props.setFilterData === 'function') {
        this.props.setFilterData({
          agefilter: ageCfg.defaultValue
        });
      }
    }
  }

  render() {
    const props = this.props;
    const { showArrow } = this.state;
    let selected_group = [];

    if (props.filterBasedCount[props.taskType]) {
      selected_group = props.filterBasedCount[props.taskType].map(item => ({
        id: item.name,
        name: `${item.name} (${item.value})`
      }))
    }

    const involvedGroupsOptions = [
      {
        id: "mine",
        name: "Completed by me"
      },
      // ...this.props?.involved_groups
    ]

    return (
      <div className="task-navbar">
        <ul
          ref={this.tabRef}
          className="nav nav-tabs process_tab_ongoing_comp_ul task-navItem"
          role="tablist"
        >
          <li
            className={
              props.taskType === MY_TASKS ? "nav-item active" : "nav-item"
            }
          >
            <button
              onClick={() => {
                this.onClickHandler('commonTasksGroupTasks', MY_TASKS)
              }}
              type="button"
              className="nav-button"
              style={{ cursor: "pointer" }}
              id="mytask-tab"
            >
              My tasks
              <CountBadge count={props.count[MY_TASKS]} />
            </button>
          </li>
          {
            props.showGroupTasks
            && (
              <li
                className={
                  props.taskType === GROUP_TASKS ? "nav-item active" : "nav-item"
                }
              >
                <button
                  onClick={() => {
                    this.onClickHandler('commonTasksGroupTasks', GROUP_TASKS)
                  }}
                  type="button"
                  className="nav-button"
                  style={{ cursor: "pointer" }}
                  id="mytask-tab"
                >
                  My Group tasks
                  <CountBadge count={typeof (props.count[GROUP_TASKS]) === "number" ? props.count[GROUP_TASKS] : 0} />
                </button>
              </li>
            )
          }

          {
            !props.showGroupTasks && props.involved_groups && props.involved_groups.length
              ? props.involved_groups.map(group => {
                let taskField = ""
                if (props.filterBasedCount[group.id] && props.filterBasedCount[group.id].length && "name" in props.filterBasedCount[group.id][0]) {
                  taskField = props.filterBasedCount[group.id][0].name
                }
                return (
                  <li
                    key={group.id}
                    className={
                      props.taskType === group.id ? "nav-item active" : "nav-item"
                    }
                  >
                    <button
                      key={group.name}
                      onClick={() => {
                        this.onClickHandler('customGroupTask', group.id, taskField)
                      }}
                      type="button"
                      className="nav-button"
                      style={{ cursor: "pointer" }}
                      id="mytask-tab"
                    >
                      {group.name}
                      <CountBadge count={props.count[group.id]} />
                    </button>
                  </li>
                );
              }) : null
          }
          {props?.showCompletedTasks && <li
            className={
              props.taskType === COMPLETED_TASKS ? "nav-item active" : "nav-item"
            }
          >
            <button
              onClick={() => {
                this.onClickHandler('commonTasksGroupTasks', COMPLETED_TASKS)
              }}
              type="button"
              className="nav-button"
              style={{ cursor: "pointer" }}
              id="mytask-tab"
            >
              Completed tasks
              <CountBadge count={props.count[COMPLETED_TASKS]} />
            </button>
          </li>}
        </ul>
        <div className="carousel-button-slider">
          {showArrow ? arrowButtons(this.tabRef.current) : null}
        </div>

        {(() => {
          const ageCfg = (props.filterKeys || []).find(f => f.key === 'agefilter');
          if (!ageCfg) return null; // hide if backend doesn't send agefilter config

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0 5px' }}>
              <label style={{ fontWeight: 500 }}>
                {ageCfg.label || 'Age'}
                : 
              </label>
              <select
                className="form-control"
                style={{ width: 250 }}
                value={
                  this.state.ageFilterCleared ? "" : (
                    (Array.isArray(props.filters?.agefilter) && props.filters.agefilter[0]?.value)
                    || (props.filterData?.agefilter && typeof props.filterData.agefilter === 'object' && !Array.isArray(props.filterData.agefilter)
                      ? props.filterData.agefilter.value
                      : (ageCfg?.defaultValue || ""))
                  )
                }
                onChange={(e) => {
                  const v = e.target.value;

                  // Reset the cleared state when user selects a new value
                  if (v) {
                    this.setState({ ageFilterCleared: false });
                  }

                  // 1) Keep DrawerFilter happy (UI state as array-of-objects)
                  const uiFilters = {
                    ...(props.filters || {}),
                    agefilter: v ? [{ label: v, value: v, type: 'select' }] : []
                  };
                  console.log('[Age/UI] uiFilters →', uiFilters);
                  props.setFilters(uiFilters);

                  // 2) Send primitive for API-bound column search
                  const valuesForColumnSearch = v ? { agefilter: v } : {};
                  console.log('[Age/API] valuesForColumnSearch →', valuesForColumnSearch);
                  props.setFilterData(valuesForColumnSearch);
                }}
              >
                <option value="">{ageCfg.placeholderText || 'Select Value'}</option>
                {(ageCfg.options || []).map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.text || opt.label || opt.value}
                  </option>
                ))}
              </select>
            </div>
          );
        })()}

        <div className="task_filters_container">
          {
            this.props.showReloader
              ? (
                <Reloader
                  showReloadBtn
                  clicked={this.props.reloaderClicked}
                  message='You have new tasks assigned and can view them on reload.'
                />
              ) : null
          }
          {
            !props.showGroupTasks && selected_group.length
              ? (
                <FilterDropdown
                  list={selected_group}
                  onItemClickHandler={props.handleFilterValue}
                  classes='filter_by_value_dropdown mobile_half_filter_dropdown1'
                  selectedItem={selectedItemFormatting(props.filterByValue, selected_group)}
                />
              )
              : null
          }
          <div className={'tagsContainer'} style={{ width: '20px', width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            {Object.keys(props.filterData)?.length>0 && getTagComponent(props.filterData, this.onClearFilter, props?.filterKeys)}
            {!!props.taskTitle && 
              <>
                {Object.keys(props.filterData)?.length>0 && <span style={{ marginRight: "8px" }}>|</span> }
                <Tag 
                  style={{ display: "flex", justifyContent: "center", alignItems: "center"}} 
                  closable 
                  onClose={props.clearTaskSelectedFilter} 
                >
                  Task Title : {props.taskTitle}
                </Tag>
              </>
            }
          </div>
          {props.taskType !== COMPLETED_TASKS && 
            <HasAccess
              permissions={[CW_SERVICE_TASKS_ACTION]}
              yes={() => (
                <Button
                  customStyle={{ marginRight: '10px' }}
                  variant='fancy_btn '
                  onClick={() => this.handleBulkAction()
                  }
                  disabled={this.checkDisable()}
                >
                  Bulk Action
                </Button>
              )}
            />
          }
          {props.taskType === COMPLETED_TASKS &&
            <FilterDropdown
              list={involvedGroupsOptions}
              onItemClickHandler={props.updateInvolvedGroupSelection}
              classes='filter_by_value_dropdown mobile_half_filter_dropdown2'
              selectedItem={this.props?.selectedInvolvedGroup?.name}
              disableComponent
            />
          }
          <Button
            variant='fancy_btn active'
            customStyle={{marginRight:'10px'}}
            onClick={() => this.setState({ showSideFilter: true })}
            disabled={props.filterKeys?.length ? false : props?.processKey?.length ? true : false}
          >
            Filter
          </Button>
          <FilterDropdown
            list={this.TaskFilterList(props.taskType)}
            dropDownIconName='icon-arrows_updown'
            splitButtonData={splitButtonData(props)}
            onItemClickHandler={props.handleTaskSort}
            splitIconClickHandler={props.handleTaskOrder}
            classes='sort_by_dropdown mobile_half_filter_dropdown2'
            selectedItem={selectedItemFormatting(props.sort, this.TaskFilterList(props.taskType))}
          />
        </div>
        <DrawerFilter showFilter={this.state.showSideFilter}
          filters={props.filters}
          mappedFields={props.filterKeys}
          type={'hiring-task'}
          setFilters={props.setFilters}
          applyFilter={props.setFilterData}
          onCloseHandler={() => this.setState({ showSideFilter: false })}
        />
      </div>
    )
  }
}

const mapStateToProps = ({ task, auth }) => ({
  count: task.count,
  processKey: task.processKey,
  tasks: task.tasks,
  current_task_owner: auth.current_task_owner,
  involved_groups: auth.involved_groups,
  showCompletedTasks: auth?.show_completed_tasks
});

const mapDispatchToProps = dispatch => ({
  claimTask: (orgId, id, history, assignee, current_task_owner, handler, isBulkAction, taskIds) => dispatch(claimTask(orgId, id, history, assignee, current_task_owner, handler, isBulkAction, taskIds)),
  getTaskAction: (orgId, id, history, assignee, current_task_owner, isBulkAction, taskIds) => dispatch(getTaskAction(orgId, id, history, assignee, current_task_owner, isBulkAction, taskIds)),
  addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskNavigator);
