/* eslint-disable react/no-did-update-set-state */
/* eslint-disable react/no-unused-state */
import React, { Component } from "react";
import { connect } from "react-redux";

import {
   isMobile, getUrlVars, clientLogger 
} from 'containers/utils';
import TaskNavigator from "./TaskNavigator";
import TasksList from "./TasksList";
import FilterDropdown from "../../components/UI/FilterDropdown/FilterDropdown";
import { HasAccess } from "../../platformDataStoreContext";
import UnauthorizedPage from "../UnauthorizedPage";

import {
  getAllTaskPersist,
  getMyApps,
  getAllTaskCount,
  searchTask,
  getUserTaskList,
  getFilterTask,
  getInvolvedUserGroup,
  getGroupBasedCount,
  unMountTaskData,
  toggleTaskHomeScreen,
} from "../../store/actions";
import {
  PAGE_SIZE_MAX_LIMIT, OWNER, SUPER_ADMINISTRATOR , UPDATE_TASKS, ENTITY_NAME, ENTITY_PHONE_NUMBER, CW_SERVICE_TASKS_VIEW
} from "../../Data/constants";
import {
  MY_TASKS,
  ASC_ORDER,
  DESC_ORDER,
  CREATE_TIME,
  GROUP_TASKS,
  CURRENT_TASK_FILTER_TYPE,
  DEFAULT_FILTERS_DATA ,
  CURRENT_TASK_PAGE,
  TASK_FILTER_BY_SORT,
  TASK_FILTER_BY_ORDER,
  FILTER_BY_VALUE,
  ALL_WORKFLOWS,
  WORKFLOW_id,
  MAX_PAGE_SIZE,
  CURRENT_TASK_SIZE,
  MIN_PAGE_SIZE,
  COMPLETED_TASKS,
  START_TIME,
  TASK_PAGE_SIZE,
  SELECTED_INVOLVED_GROUPS
} from "./TaskConstants";
import "./task.css";
import routes from "../../urls";
import SearchField from "../../components/Navigation/Toolbar/SearchField";
import TaskHome from "./TaskHome";
import BackArrow from 'assets/images/svg/back_arrow.svg'
import { saveFilteredData, taskStart } from "../../store/actions/Task/task";

class Tasks extends Component {
  constructor(props) {
    super(props);
    let appData = props?.apps?.find(app => (app.process_key === props.processKey));
    this.state = {
      page: 1,
      taskType: MY_TASKS,
      process_key:appData?.process_key || "",
      appValue: appData?.name || "",
      hoveredForms: {},
      hoverId: null,
      taskTitle: "",
      hoverPopupMenuClosed:false,
      filterByValue:"",
      sort:CREATE_TIME,
      order: DESC_ORDER,
      size: MIN_PAGE_SIZE,
      showReloader: false,
      canShowReloader: false,
      filters: {},
      filterData: {},
      search: '',
      filterKeys: [],
      selectedTasks: [],
      columnFilters: {},
      selectedInvolvedGroup: {
        id: "mine",
        name: "Completed by me"
      },
    };
  }

  updateFilterKeys = () => {
    const filter = []
    const defaultFilter = [
      { "key": "entity_location", "data": { "defaultLocation": "true" }, "type": "select", "label": "Location", "placeholderText": "Select location" },
      { "key": "job_role", "data": { "defaultRole": "true" }, "type": "select", "label": "Roles", "placeholderText": "Select role" },
      { "key": "createdBefore", "type": "date", "label": "Created to", "placeholderText": "Select Date" },
      { "key": "createdAfter", "type": "date", "label": "Created from", "placeholderText": "Select Date" }
    ]
    if(this.state.process_key){
      const appData = this.props?.apps.find(app => (app.process_key === this.state.process_key));
      Array.isArray(appData?.filters) && appData?.filters?.length && appData?.filters?.forEach(item => {
        if(item?.key === "createdBefore"){
          item.label = "Created to"
        }
        if(item?.key === "createdAfter"){
          item.label = "Created from"
        }
        filter.push(item)
      });
      this.setState({ filterKeys: filter?.length ? filter : defaultFilter });
    } else {
      this.props?.apps?.map(data => {
        Array.isArray(data?.filters) && data?.filters?.length && data?.filters?.forEach(item => {
          if(item?.key === "createdBefore"){
            item.label = "Created From"
          }
          if(item?.key === "createdAfter"){
            item.label = "Created To"
          }
          filter.push(item)
        });
      });
      this.setState({ filterKeys: filter?.length ? filter : defaultFilter });
    }
  }

  applyDefaultValues = () => {
    const { filterKeys, filterData } = this.state;
    const defaultFilters = {};
    let hasDefaults = false;

    filterKeys?.forEach(filter => {
      if (filter?.defaultValue && !filterData[filter.key]) {
        hasDefaults = true;
        if (filter.type === 'select') {
          // Set the filter data in the same format as user selection (primitive value)
          // This ensures consistent field naming in the API calls
          defaultFilters[filter.key] = filter.defaultValue;
        } else if (filter.type === 'date') {
          defaultFilters[filter.key] = [{ 
            value: filter.defaultValue, 
            label: filter.defaultValue, 
            type: filter.type 
          }];
        } else if (filter.type === 'text' || filter.type === 'number' || filter.type === 'csv') {
          defaultFilters[filter.key] = [filter.defaultValue];
        }
      }
    });

            if (hasDefaults) {
          // Create separate formats for filters (UI) and filterData (API)
          const uiFilters = {};
          const apiFilters = {};
          
          Object.keys(defaultFilters).forEach(key => {
            const filter = filterKeys.find(f => f.key === key);
            if (filter?.type === 'select') {
              // UI filters need array format for drawer compatibility
              uiFilters[key] = [{ 
                value: defaultFilters[key], 
                label: defaultFilters[key], 
                type: filter.type 
              }];
              // API filters need primitive format for consistent field naming
              apiFilters[key] = defaultFilters[key];
            } else {
              // For other types, use the same format
              uiFilters[key] = defaultFilters[key];
              apiFilters[key] = defaultFilters[key];
            }
          });
          
          this.setState({ 
            filterData: { ...filterData, ...apiFilters },
            filters: { ...this.state.filters, ...uiFilters }
          }, () => {
            // Apply the default filters by calling fetchFilterTasks
            if (Object.keys(defaultFilters).length > 0) {
              this.fetchFilterTasks();
            }
          });
        }
  }

  updateInvolvedGroupSelection = (data, dontCall) => {
    if(data === "mine"){
      localStorage.setItem(SELECTED_INVOLVED_GROUPS, JSON.stringify({
        id: "mine",
        name: "Completed by me"
      }));
      this.setState({
        selectedInvolvedGroup: {
          id: "mine",
          name: "Completed by me"
        }
      }, () => {
        if(!dontCall)
        this.fetchTasks();
      })
      return;
    }
    const in_group_obj = this.props.involved_groups?.find(g => g.id === data);
    localStorage.setItem(SELECTED_INVOLVED_GROUPS, JSON.stringify(in_group_obj || {}));
    this.setState({
      selectedInvolvedGroup: in_group_obj || {}
    }, () => {
      if(!dontCall)
      this.fetchTasks();
    })
  }

  componentDidMount() {
    const orgId = this.props.match?.params?.uuid;
    // get all Apps
    this.props.getMyApps(orgId);
    this.componentLoaded();

    if(Object.keys(this.state.filterData).length>0 && !this.props.showHome) {
      this.fetchFilterTasks();
    }
    this.updateFilterKeys();
    // Apply default values after filterKeys are set
    setTimeout(() => this.applyDefaultValues(), 100);
  }

  shouldComponentUpdate(nextProps) {
    const orgId = this.props.match?.params?.uuid;

    const CURRENT_TASK_DATA= JSON.parse(localStorage
      .getItem(CURRENT_TASK_FILTER_TYPE)) || DEFAULT_FILTERS_DATA;
    const CURRENT_FILTER_VALUE= JSON.parse(localStorage.getItem(FILTER_BY_VALUE)) || "";
    const CURRENT_PAGE= JSON.parse(localStorage.getItem(CURRENT_TASK_PAGE)) || 1;
    const CURRENT_SIZE = JSON.parse(localStorage.getItem(CURRENT_TASK_SIZE)) || 10;
    let selectedInvolvedGroup = JSON.parse(localStorage.getItem(SELECTED_INVOLVED_GROUPS));
    let taskType = CURRENT_TASK_DATA.taskType;
    if(taskType !== COMPLETED_TASKS){
      selectedInvolvedGroup = null;
    }
    // issue #89 https://gitlab.com/ezedox-engineering/onboard-frontend/-/issues/89
    // This below condition will redirect the user to the MY task tab if the user has been removed from the active group tab.
    if ((taskType !== MY_TASKS && taskType !== GROUP_TASKS && taskType !== COMPLETED_TASKS) 
    && (!nextProps.involved_groups.some(index => index.id === taskType) 
    || nextProps.involved_groups.length === 0)) {
      this.handleTaskTab(MY_TASKS, null)
      clientLogger.log({
        message: {
          error: "User is trying to get information of group to which he does not belong to.",
          groupID: taskType,
          url: window.location.href,
          current_task_owner: this.props.current_task_owner.userId
        }
      });
    }
    // condition end
    let filterByValue = CURRENT_FILTER_VALUE;
    let taskCount =0;
    let page = CURRENT_PAGE;
    let pageSize = CURRENT_SIZE;
    if(nextProps.filterBasedCount[taskType] && nextProps.filterBasedCount[taskType].length > 0 ) {
      const [taskCountData] = nextProps.filterBasedCount[taskType]
      .filter(filterValue => (filterValue.name === filterByValue));
 
       if(taskCountData) {
         taskCount = taskCountData.value
       }
     } else {
       taskCount = nextProps.count[taskType]
     }
        if(taskCount) {
          let temp_size = taskCount/pageSize
          let page_size = Math.ceil(temp_size)
            if(page !== 1 && page > page_size) {
            page = page_size;
            this.props.history.push({
              pathname: routes.TASKS.to(this.props.match?.params?.uuid),
              search : `?taskType=${taskType}&page=${page}&size=${pageSize}`
          })
            localStorage.setItem(CURRENT_TASK_PAGE, JSON.stringify(page));
            const CURRENT_SORT= JSON.parse(localStorage.getItem(TASK_FILTER_BY_SORT)) || CURRENT_TASK_DATA.taskType === COMPLETED_TASKS ? START_TIME : CREATE_TIME;
            const CURRENT_ORDER= JSON.parse(localStorage.getItem(TASK_FILTER_BY_ORDER)) || ASC_ORDER;
            this.props.getAllTaskPersist(orgId, taskType, CURRENT_ORDER, CURRENT_SORT, page, pageSize, filterByValue, this.state.search, selectedInvolvedGroup);
            if (taskType !== MY_TASKS && taskType !== GROUP_TASKS && taskType !== COMPLETED_TASKS)
            this.groupFilterCount()
            return true
            }
        }
        
  return true
}

componentDidUpdate = (prevProps, prevState) => {
  //  soft reload this component on new notification
  if(this.props.updateType.time !== prevProps.updateType.time && this.props.updateType.type === UPDATE_TASKS) {
    if(!this.state.canShowReloader) {
      this.setState({canShowReloader: true});
    }else{
      this.setState({showReloader: true});
    }
  }

  if (prevProps?.apps?.length !== this?.props?.apps?.length ) {
    this.updateFilterKeys();
  }

  // Apply default values when filterKeys change
  if (prevState?.filterKeys !== this.state.filterKeys) {
    setTimeout(() => this.applyDefaultValues(), 100);
  }
}

  componentWillUnmount() {
    this.props.unMountTaskData();
    this.props.toggleTaskHomeScreen(true);
  }

  componentLoaded = () => {
    let pageSize = JSON.parse(localStorage.getItem(CURRENT_TASK_SIZE)) || TASK_PAGE_SIZE
    if(this.props.location.search) {
      let data = getUrlVars()
      let page = data.page ? parseInt(data.page, 10) : 1
      if((PAGE_SIZE_MAX_LIMIT > page) && ( page > 0)) {
        localStorage.setItem(CURRENT_TASK_PAGE,(page));
      }else{
        localStorage.setItem(CURRENT_TASK_PAGE, JSON.stringify(1));
      }
      if(data.taskType) {
        let taskData = {
          taskType:data.taskType
      }
        localStorage.setItem(CURRENT_TASK_FILTER_TYPE, JSON.stringify(taskData));
      }
      if(data.size) {
        pageSize = data.size ? parseInt(data.size, 10) : TASK_PAGE_SIZE
        if (pageSize > MAX_PAGE_SIZE) {
          pageSize = MAX_PAGE_SIZE
      }if(pageSize < MIN_PAGE_SIZE) {
          pageSize = MIN_PAGE_SIZE
      }
    }
    localStorage.setItem(CURRENT_TASK_SIZE, JSON.stringify(pageSize));
      const CURRENT_PAGE= JSON.parse(localStorage.getItem(CURRENT_TASK_PAGE)) || 1;
      const CURRENT_TASK_DATA= JSON.parse(localStorage
        .getItem(CURRENT_TASK_FILTER_TYPE)) || DEFAULT_FILTERS_DATA;
          this.props.history.push({
            pathname: routes.TASKS.to(this.props.match?.params?.uuid),
            search : `?taskType=${CURRENT_TASK_DATA.taskType}&page=${CURRENT_PAGE}&size=${pageSize}`
        })
  }
    
    const CURRENT_TASK_DATA= JSON.parse(localStorage
    .getItem(CURRENT_TASK_FILTER_TYPE)) || DEFAULT_FILTERS_DATA;
    const CURRENT_PAGE= JSON.parse(localStorage.getItem(CURRENT_TASK_PAGE)) || 1;
    const CURRENT_SORT= JSON.parse(localStorage.getItem(TASK_FILTER_BY_SORT)) || CREATE_TIME;
    const CURRENT_ORDER = JSON.parse(localStorage.getItem(TASK_FILTER_BY_ORDER)) || DESC_ORDER;
    const CURRENT_FILTER_VALUE= JSON.parse(localStorage.getItem(FILTER_BY_VALUE)) || "";
    const CURRENT_SIZE= JSON.parse(localStorage.getItem(CURRENT_TASK_SIZE)) || MIN_PAGE_SIZE;
    let selectedInvolvedGroup = JSON.parse(localStorage.getItem(SELECTED_INVOLVED_GROUPS));
    const { savedFilteredData } = this.props;
    const { process_key } = this.state;
    this.setState(
      {
        taskType: CURRENT_TASK_DATA.taskType,
        filterByValue: CURRENT_FILTER_VALUE,
        page: CURRENT_PAGE,
        sort: CURRENT_SORT,
        order: CURRENT_ORDER,
        size : CURRENT_SIZE,
        selectedInvolvedGroup: CURRENT_TASK_DATA.type === COMPLETED_TASKS ? selectedInvolvedGroup || {
          id: "mine",
          name: "Completed by me"
        } : {},
        ...(this.props.showHome ? 
          {}:
          {
            filterData: savedFilteredData?.[process_key || "All_Workflows"] || {},
            filters: savedFilteredData?.[process_key || "All_Workflows"] || {},
            taskTitle: savedFilteredData?.["task_title"+(process_key || "all_workflows")] || ''
          }
        )
      },
      () => {
        if(!this.props.showHome){
          this.fetchTasks();  
          this.totalCount();    
        }
      }
    );
  }

  // fetch tasks by reading the variables from Component's current state.
  totalCount = () =>{
    const orgId = this.props.match?.params?.uuid;
    let taskTypes = [MY_TASKS, GROUP_TASKS, ...this.props.involved_groups];
    if (this.props?.showCompletedTasks) taskTypes = [...taskTypes, COMPLETED_TASKS];
    if(this.props.involved_groups.length) {
      this.props.getAllTaskCount(orgId, taskTypes,this.state.taskType, this.getAppliedFilters(true)?.appliedFilters, this.getAppliedFilters(true)?.dateFilters, this.state.process_key, this.state.taskTitle);
    } else {
      this.involvedUserTotalCount()
    }
    
  }

  fetchSearchTasks = () => {
    const orgId = this.props.match?.params?.uuid;
    // const{ searchData } = this.props
    const {
       taskType, process_key, order, sort, filterByValue, taskTitle, selectedInvolvedGroup
      } = this.state;
    const CURRENT_PAGE= JSON.parse(localStorage.getItem(CURRENT_TASK_PAGE)) || 1;
    const CURRENT_SIZE = JSON.parse(localStorage.getItem(CURRENT_TASK_SIZE)) || 10;
    this.props.searchTask(orgId, process_key, taskType, this.getAppliedFilters()?.appliedFilters, this.getAppliedFilters()?.dateFilters, CURRENT_SIZE, order, sort, CURRENT_PAGE,
    filterByValue, selectedInvolvedGroup, taskTitle)
  }

  getAppliedFilters = (forCount = false) => {
    let dateFilters = [];
    this.props.saveFilteredData(this.state.filterData, this.state.process_key || "All_Workflows");
    let appliedFilters = Object.keys(this.state.filterData)?.map((key) => {
      if (key === 'vendor_added') {
        let name;
        let value;
        if (this.state.filterData.vendor_added?.name === 'WalkIn' || this.state.filterData.vendor_added?.name === 'Referral') {
          name = 'hire_candidate_source';
          value = this.state.filterData[key]?.name;
        } else {
          name = 'sourcing_partner';
          value = this.state.filterData[key]?.id;
        }
        return ({
          name,
          operation: 'equals',
          value,
          variableOperation: "EQUALS"
        })
      } else if (this.state.filterData[key]?.[0]?.type === 'date') {
        let value = new Date(this.state.filterData[key]?.[0]?.value)
        if (key === 'createdAfter' || key === 'dueAfter') {
          value = new Date(value?.setHours(23, 59, 59, 999))
          value.setDate(value.getDate() - 1);
        }
        if (key === 'createdBefore' || key === 'dueBefore') {
          value = new Date(value?.setHours(23, 59, 59, 999))
        }
        dateFilters.push({ [key]: decodeURIComponent(value?.toISOString()) })
        return {}
      } else if(this.state.filterData[key]?.type === "column_search"){
        return ({
          name: this.state.filterData[key]?.name,
          operation:'likeIgnoreCase',
          value: `%${this.state.filterData[key]?.value}%`,
          variableOperation: "LIKE_IGNORE_CASE"
        })
      } else if(this.state.filterData[key]?.[0]?.type === "csv"){
        const filterData = this.state.filterData[key]?.[0];
        const orQuery = [];
        filterData?.value?.split(',')?.forEach((word) => {
          orQuery.push({
            name: key,
            operation: 'equals',
            value: word.trim(),
            variableOperation: 'EQUALS'
          })
        })
        return ({
          or_query: orQuery
        })
      } else return ({
        name: this.state.filterData[key][0]?.type ? this.state.filterData[key][0]?.type : this.state.filterKeys?.filter(item => item?.key === key)[0]?.key,
        operation: 'equals',
        // eslint-disable-next-line no-nested-ternary
        value: Array.isArray(this.state.filterData[key])
          ? this.state.filterData[key][0] && typeof this.state.filterData[key][0] === 'object'
            ? this.state.filterData[key]?.map(a => a.value)?.join()
            : this.state.filterData[key]?.join() : this.state.filterData[key],
        variableOperation: "EQUALS"
      })
    });
    return {
      appliedFilters: appliedFilters?.filter(obj => {
        if(Object.keys(obj).length !== 0){
          if(obj?.name){
            return true;
          }
          if(obj?.or_query){
            return obj?.or_query?.filter(obj1 => Object.keys(obj1).length !== 0 && obj1?.name)?.length;
          }
        } 
        return false;
      }),
      dateFilters
    }
  }

  fetchFilterTasks = () => {
    if(this.state.showHome){
      return;
    }
    const orgId = this.props.match?.params?.uuid;
    let dateFilters = []
    this.props.saveFilteredData(this.state.filterData, this.state.process_key || "All_Workflows");
    let appliedFilters = Object.keys(this.state.filterData)?.map((key)=>{
      if(key==='vendor_added') {
        let name; 
        let value;
        if(this.state.filterData.vendor_added?.name==='WalkIn'|| this.state.filterData.vendor_added?.name==='Referral') {
          name='hire_candidate_source';
          value=this.state.filterData[key]?.name;
        } else {
          name='sourcing_partner';
          value=this.state.filterData[key]?.id;
        } 
        return ({
          name,
          operation:'equals',
          value,
          variableOperation: "EQUALS"
        })
      } else if (this.state.filterData[key]?.[0]?.type === 'date') {
        let value = new Date(this.state.filterData[key]?.[0]?.value)
        if (key === 'createdAfter' || key === 'dueAfter') {
          value = new Date(value?.setHours(23, 59, 59, 999))
          value.setDate(value.getDate() - 1);
        }
        if (key === 'createdBefore' || key === 'dueBefore') {
          value = new Date(value?.setHours(23, 59, 59, 999))
        }
        dateFilters.push({ [key]: decodeURIComponent(value?.toISOString()) })
        return {}
      } else if(this.state.filterData[key]?.type === "column_search"){
        return ({
          name: this.state.filterData[key]?.name,
          operation:'likeIgnoreCase',
          value: `%${this.state.filterData[key]?.value}%`,
          variableOperation: "LIKE_IGNORE_CASE"
        })
      } else if(this.state.filterData[key]?.[0]?.type === "csv"){
        const filterData = this.state.filterData[key]?.[0];
        const orQuery = [];
        filterData?.value?.split(',')?.forEach((word) => {
          if (word && word.trim() !== '') {
            orQuery.push({
              name: key,
              operation: 'equals',
              value: word.trim(),
              variableOperation: 'EQUALS'
            })
          }
        })
        return ({
          or_query: orQuery
        })
      } else return ({
        name: this.state.filterData[key][0]?.type ? this.state.filterData[key][0]?.type : this.state.filterKeys?.filter(item => item?.key === key)[0]?.key,
        operation: 'equals',
        // eslint-disable-next-line no-nested-ternary
        value: Array.isArray(this.state.filterData[key])
          ? this.state.filterData[key][0] && typeof this.state.filterData[key][0] === 'object'
            ? this.state.filterData[key]?.map(a => a.value)?.join()
            : this.state.filterData[key]?.join() : this.state.filterData[key],
        variableOperation: "EQUALS"
      })
    });
    appliedFilters = appliedFilters?.filter(obj => {
      if(Object.keys(obj).length !== 0){
        if(obj?.name){
          return true;
        }
        if(obj?.or_query){
          return obj?.or_query?.filter(obj1 => Object.keys(obj1).length !== 0 && obj1?.name)?.length;
        }
      } 
      return false;
    })
    localStorage.setItem(CURRENT_TASK_PAGE, JSON.stringify(1));
    const {involved_groups, pageSize}= this.props;
    const {
       taskType, process_key,taskTitle, appValue, order, sort, filterByValue, selectedInvolvedGroup
      } = this.state;
    this.props.getFilterTask(orgId, process_key, appValue, taskType, pageSize, order, sort, taskTitle,
      involved_groups, filterByValue, appliedFilters, dateFilters, selectedInvolvedGroup).then(() => {
      this.totalCount(), selectedInvolvedGroup
    });
  };
  
  fetchTasks = () => {
    const orgId = this.props.match?.params?.uuid;

    const CURRENT_PAGE= JSON.parse(localStorage.getItem(CURRENT_TASK_PAGE)) || 1;
    const CURRENT_SIZE = JSON.parse(localStorage.getItem(CURRENT_TASK_SIZE)) || 10;
    const {
      taskType, order, sort, filterByValue, process_key, taskTitle, selectedInvolvedGroup
    } = this.state;
    this.props.getAllTaskPersist(orgId, taskType, order, sort, CURRENT_PAGE, CURRENT_SIZE, filterByValue, this.getAppliedFilters()?.appliedFilters, this.getAppliedFilters()?.dateFilters, process_key, taskTitle, selectedInvolvedGroup);
  };

  involvedUserTotalCount =() => {
    const orgId = this.props.match?.params?.uuid;
    let taskTypes = [MY_TASKS, GROUP_TASKS, ...this.props.involved_groups];
    if (this.props?.showCompletedTasks) taskTypes = [...taskTypes, COMPLETED_TASKS];

    this.props.getInvolvedUserGroup(orgId , this.props.usergroupId).then(() =>{
      this.props.getAllTaskCount(orgId, taskTypes, this.state.taskType, this.getAppliedFilters(true)?.appliedFilters, this.getAppliedFilters(true)?.dateFilters, this.state.process_key, this.state.taskTitle)
    });
  }

  groupFilterCount =()=>{
    const orgId = this.props.match?.params?.uuid;
    if (this.state.taskType !== GROUP_TASKS && this.state.taskType !== MY_TASKS && this.state.taskType !== COMPLETED_TASKS) {
      this.props.getGroupBasedCount(orgId, this.state.taskType, this.state.search, this.props.processKey)
    }
  }


  // handler for tab switching, myTasks, groupTasks etc.
  handleTaskTab = (taskType, filterByValue) => {
    this.props.taskStart();
    this.props.history.push({
      pathname: routes.TASKS.to(this.props.match?.params?.uuid),
      search : `?taskType=${taskType}&page=${1}&size=${this.props.pageSize}`
  })
    let taskData = {
      taskType
  }
    localStorage.setItem(TASK_FILTER_BY_SORT, taskType === COMPLETED_TASKS ? JSON.stringify(START_TIME) : JSON.stringify(CREATE_TIME));
    localStorage.setItem(CURRENT_TASK_FILTER_TYPE, JSON.stringify(taskData));
    localStorage.setItem(CURRENT_TASK_PAGE, JSON.stringify(1));
    if(filterByValue) {
      localStorage.setItem(FILTER_BY_VALUE, JSON.stringify(filterByValue));
    }else{
      localStorage.setItem(FILTER_BY_VALUE, JSON.stringify(""));
    }
    if(taskType !== COMPLETED_TASKS){
      this.updateInvolvedGroupSelection("", true)
    } else {
      this.updateInvolvedGroupSelection("mine", true)
    }
    
    this.setState(
      {
        taskType,
        page:1,
        filterByValue,
        sort: taskType === COMPLETED_TASKS ? START_TIME : CREATE_TIME,
        selectedTasks: [],
      },
      () => {
        if(Object.keys(this.state.filterData).length>0) {
          this.fetchSearchTasks();
        } else {
          this.fetchTasks();
        }
        this.totalCount();
      }
    );
  };

  // handler for task sorting based on either of createTime or dueDate.
  handleTaskSort = (id) => {
    this.setState({
        sort: id
      },
      () => {
        localStorage.setItem(TASK_FILTER_BY_SORT, JSON.stringify(this.state.sort));
        if(Object.keys(this.state.filterData).length>0) {
          this.fetchSearchTasks();
        } else {
          this.fetchTasks();
        }
        this.groupFilterCount();
      });
  };

  // handler for task order based on either of ascending or descending.
  handleTaskOrder = () => {
    this.setState(
      prevState => ({
        order: prevState.order === ASC_ORDER ? DESC_ORDER : ASC_ORDER
      }),
      () => {
        localStorage.setItem(TASK_FILTER_BY_ORDER, JSON.stringify(this.state.order));
        if(Object.keys(this.state.filterData).length>0) {
          this.fetchSearchTasks();
        } else {
          this.fetchTasks();
        }
        this.groupFilterCount();
      }
      
    );
  };

  // handler for page changes via pagination controller.
  handlePageChange = (page, pageSize = 10) => {
    this.props.history.push({
      pathname: routes.TASKS.to(this.props.match?.params?.uuid),
      search : `?taskType=${this.state.taskType}&page=${page}&size=${pageSize}`
  })
    localStorage.setItem(CURRENT_TASK_PAGE, JSON.stringify(page));
    localStorage.setItem(CURRENT_TASK_SIZE, JSON.stringify(pageSize));
    this.setState({ page }, () => {
      if(Object.keys(this.state.filterData).length>0) {
        this.fetchSearchTasks();
      } else {
        this.fetchTasks();
      }
      this.groupFilterCount();
    });
  };

  getFilteredTask = (process_key, name, icon_class) => {
    const { savedFilteredData } = this.props;
    this.setState({
      process_key:process_key,
      appValue : name,
      appIcon :icon_class,
      taskTitle : "",
      filterData: savedFilteredData?.[process_key] || {},
      filters: savedFilteredData?.[process_key] || {},
      columnFilters: {},
      selectedInvolvedGroup: {
        id: "mine",
        name: "Completed by me"
      },
      taskTitle: savedFilteredData?.["task_title"+(process_key || "all_workflows")] || ''
    }, () => {
      this.props.toggleTaskHomeScreen(false, process_key);
      this.updateFilterKeys();
      this.props.history.push({
        pathname: routes.TASKS.to(this.props.match?.params?.uuid),
        search : `?taskType=${this.state.taskType}&page=${1}&size=${this.props.pageSize}`
      })
      localStorage.setItem(CURRENT_TASK_PAGE, JSON.stringify(1));
      this.fetchFilterTasks();
    }
    )
  }

  getAlltask = () =>{
    const { savedFilteredData } = this.props;
    this.setState({
      process_key:"",
      appValue : "",
      appIcon :"",
      taskTitle: "",
      filterData: savedFilteredData?.["All_Workflows"] || {},
      filters: savedFilteredData?.["All_Workflows"] || {},
      columnFilters: {}
    },
    () => {
      this.updateFilterKeys();
      this.props.history.push({
        pathname: routes.TASKS.to(this.props.match?.params?.uuid),
        search : `?taskType=${this.state.taskType}&page=${1}&size=${this.props.pageSize}`
      })
      localStorage.setItem(CURRENT_TASK_PAGE, JSON.stringify(1));
      this.fetchFilterTasks();
    })
  }

  listModification = (list) => {
    let allWorkflowData = {
        id: WORKFLOW_id,
        name: ALL_WORKFLOWS
    }
    return list.length > 0 ? [allWorkflowData, ...list] : [];
  }

  getUserTask=(appId) => {
    const orgId = this.props.match?.params?.uuid;

    if (!Object.keys(this.state.hoveredForms).includes(appId)) {
      this.setState(prevState => ({
          hoveredForms: {
              ...prevState.hoveredForms,
              [appId]: "true"
          }
      }))
      this.props.UserTaskList(orgId, appId)
      }

    this.setState({
      hoverPopupMenuClosed:false,
      hoverId : appId
  })
  }

  CloseUserTask=() => {
      this.setState({
          hoverPopupMenuClosed:true
      })
  }

  taskSelectedFilter =(event,process_key, name, icon_class, taskTitle)=>{
    event.stopPropagation();
    const { savedFilteredData } = this.props;
    this.props.saveFilteredData(taskTitle, "task_title"+(process_key || "all_workflows"));
    this.setState({
      appValue: name,
      process_key: process_key,
      appIcon: icon_class,
      taskTitle: taskTitle,
      filterData: savedFilteredData?.[process_key] || {},
      filters: savedFilteredData?.[process_key] || {},
      columnFilters: {}
    },
    () => {
        this.props.toggleTaskHomeScreen(false, process_key);
        this.updateFilterKeys();
        this.props.history.push({
            pathname: routes.TASKS.to(this.props.match?.params?.uuid),
            search : `?taskType=${this.state.taskType}&page=${1}&size=${this.props.pageSize}`
        })
        this.fetchFilterTasks();
      })
    } 

  clearTaskSelectedFilter =()=>{
    this.props.saveFilteredData("", "task_title"+(this.state.process_key || "all_workflows"))
    this.setState({
      taskTitle: ''
    },
    () => {
        this.fetchFilterTasks();
        this.totalCount();
      })
    } 

  handleFilterValue=(filter_value)=>{
    this.props.history.push({
      pathname: routes.TASKS.to(this.props.match?.params?.uuid),
      search : `?taskType=${this.state.taskType}&page=${1}&size=${this.props.pageSize}`
  })
    this.setState({
    filterByValue: filter_value,
    page:1
      },
      ()=>{
        localStorage.setItem(FILTER_BY_VALUE, JSON.stringify(this.state.filterByValue));
        localStorage.setItem(CURRENT_TASK_PAGE, JSON.stringify(1));
        if(this.state.search) {
            this.fetchSearchTasks();
          }else{
            this.fetchTasks();
          }
          this.groupFilterCount();
      })     
    } 

    handleReload = () => {
      this.componentLoaded();
      this.setState({showReloader: false});
    }

  setSelectedTasks = (tasks) => {
    this.setState({ selectedTasks: tasks })
  }

  render() {
    
    const {
      taskType, sort, order, hoverPopupMenuClosed, hoverId, filterByValue, showReloader, process_key, appValue,
    } = this.state;
    const {
      apps, involved_groups, count, filterBasedCount, tasks, showHome
    } = this.props;

    const showGroupTasks = true;
    let taskCount = 0;

    if(filterBasedCount[taskType] && filterBasedCount[taskType].length > 0 ) {
     const [taskCountData] = filterBasedCount[taskType]
     .filter(filterValue => (filterValue.name === filterByValue));

      if(taskCountData) {
        taskCount = taskCountData.value
      }
    } else {
      taskCount = count[taskType]
    }
    let taskTitle = ""
    if(this.state.search) {
       taskTitle = ""
    } else {
        taskTitle = this.state.taskTitle;
    }
    let [appData] = apps.filter(app => (app.process_key === process_key))

    const urlData = getUrlVars()
    const urlPageNumber = urlData.page ? parseInt(urlData.page, 10) : 1

    const getColumnLabel = (key) => {
      if((Array.isArray(appData?.task_view_column) && appData?.task_view_column?.length)){
        return appData?.task_view_column?.find(item => item.key === key)?.title || key;
      } 

      return key;
    }
    
    const tasksContent = (
      <div>
        <div className="taskPage_workflow_dropdown row">
          <div className={`col-md-${showHome ? "6" : "8"} p-0 d-flex taskPage_headers`}>
            {!showHome && 
            <div className="d-flex p-0">
                {!!this.props?.apps?.length &&
                  <div 
                  style={{ marginRight: "15px", cursor: "pointer" }} 
                  className="d-flex flex-row align-items-center " 
                  onClick={() => { this.props.toggleTaskHomeScreen(true); this.setState({ search: "", filterData: {}, columnFilters: {} });}} 
                >
                  <img className="headBackArrow" src={BackArrow} alt='back-arrow' />
                </div>
                }
              <FilterDropdown
                hoverId={hoverId}
                isWorkflowDropdown
                dropDownIconName="icon-filter"
                classes="workflow_dropdown_taskPage"
                onItemClickHandler={this.getAlltask}
                onItemClickHandler2={this.getFilteredTask}
                onItemClickHandler3={this.taskSelectedFilter}
                onMouseEnter={this.getUserTask}
                onMouseLeave={this.CloseUserTask}
                list={this.listModification(apps)}
                tasksTitle={this.props.taskList}
                hoverPopupMenuClosed={hoverPopupMenuClosed}
                selectedItemIconName={this.state.appIcon}
                selectedItem={appValue === "" ? "All Workflows" : appValue}
                disableComponent={!this.props?.apps?.length}
                showSearch
              />
            </div>
              }
              {showHome &&
                <SearchField
                  onSearchChange={search => {
                    this.setState({ search });
                  }}
                  onClearSearchData={() => {
                    this.setState({
                      search: ""
                    })
                  }}
                  placeholderText="Search by workflow"
                  isLocalSearch={showHome}
                  showSearchBar
                />
              }
          </div>

        </div>
       {!showHome && <div className="main_changable_container" style={isMobile() ? {paddingTop: 0} : {}}>
          <div className="app_btn_container task_page">
            <TaskNavigator
              taskType={taskType}
              handleTaskTab={this.handleTaskTab}
              inputChange={this.inputChange}
              involved_groups={involved_groups}
              showGroupTasks={showGroupTasks}
              order={order}
              sort={sort}
              filterByValue={filterByValue}
              handleTaskOrder={this.handleTaskOrder}
              handleTaskSort={this.handleTaskSort}
              handleFilterValue={this.handleFilterValue}
              filterBasedCount={filterBasedCount}
              showReloader={showReloader}
              reloaderClicked={this.handleReload}
              filters={this.state.filters}
              filterData={this.state.filterData}
              updateInvolvedGroupSelection={this.updateInvolvedGroupSelection}
              selectedInvolvedGroup={this.state.selectedInvolvedGroup}
              setFilters={(values) => {
                this.setState({ filters: values })
              }}
              setFilterData={(values) => {
                if(Object.keys(values).length === 0){
                  this.setState({ filterData: values, columnFilters: {} },() => this.fetchFilterTasks())
                } else {
                  this.setState({ filterData: values },() => this.fetchFilterTasks())
                }
              }}
              filterKeys={this.state.filterKeys}
              history={this.props.history}
              selectedTasks={this.state.selectedTasks}
              setSelectedTasks={this.setSelectedTasks}
              orgId={this.props.match?.params?.uuid}
              claimFailTaskRefreshHandler={() => this.handlePageChange(urlPageNumber)}
              taskTitle={this.state.taskTitle}
              clearTaskSelectedFilter={this.clearTaskSelectedFilter}
            />
          </div>
        </div>}
       {showHome ?
       <TaskHome 
        search={this?.state?.search}
        onWorkflowSelect={(item) => {
          localStorage.setItem(SELECTED_INVOLVED_GROUPS, JSON.stringify({
            id: "mine",
            name: "Completed by me"
          }));
          this.getFilteredTask(item.process_key, item.name, item.icon_class);
        }}
        handleFallback={() => {
          this.getFilteredTask("", "", "");
        }}
       />
       :<TasksList 
          history={this.props.history} 
          loader={false} 
          taskType={taskType} 
          totalTaskCount={taskCount}
          claimFailTaskRefreshHandler={() => this.handlePageChange(urlPageNumber)}
          data={tasks}
          handlePageChange={this.handlePageChange}
          fetchFilterTasks={this.fetchFilterTasks}
          selectedTasks={this.state.selectedTasks}
          setSelectedTasks={this.setSelectedTasks}
          task_view_columns={appData?.task_view_column}
          filterKeys={this.state.filterKeys}
          filterData={this.state.columnFilters || {}}
          setFilterData={(values) => {
            const currentFilterData = { ...this.state.filterData };
            const currentFilters = { ...this.state.filters };
            
            if(JSON.stringify(this.state.columnFilters) === JSON.stringify(values)){
              return;
            }
            
            // Update filterData (API format) with column search entries
            Object.keys(values)?.map(key => {
              currentFilterData[key] = {
                type: "column_search",
                name: key,
                label: getColumnLabel(key),
                value: values[key]
              }
            })
            
            // Update filters (UI format) - preserve existing format, only add column search entries
            // Column search entries in filters should match filterData format (object with type, name, label, value)
            Object.keys(values)?.map(key => {
              currentFilters[key] = {
                type: "column_search",
                name: key,
                label: getColumnLabel(key),
                value: values[key]
              }
            })
            
            this.setState({ columnFilters: values, filterData: currentFilterData, filters: currentFilters }, () => this.fetchFilterTasks())
          }}
        />}
      </div>
    )
    
    return (
      <HasAccess
        permissions={[CW_SERVICE_TASKS_VIEW]}
        yes={() => (
          <div>
            {tasksContent}
          </div>
        )}
        no={() => (
          <UnauthorizedPage />
        )}
      />
    );
  }
}

const mapStateToProps = ({
   task, auth, websocket 
  }) => ({
  loader: task.loader,
  apps: task.apps,
  involved_groups_new: task.involved_groups,
  count:task.count,
  searchData: task.searchedData,
  taskList: task.taskList,
  taskTitle : task.taskTitle,
  processKey: task.processKey,
  usergroupId:auth.id,
  filterBasedCount :task.filterBasedCount,
  pageSize:task.size,
  tasks: task.tasks,
  involved_groups:auth.involved_groups,
  updateType: websocket.updateType,
  current_task_owner : auth.current_task_owner,
  showHome: task.showHome,
  savedFilteredData: task.savedFilteredData,
  showCompletedTasks: auth?.show_completed_tasks
});

const mapDispatchToProps = dispatch => ({
  getMyApps: (orgId) => dispatch(getMyApps(orgId)),
  saveFilteredData: (data, key) => dispatch(saveFilteredData(data, key)),
  toggleTaskHomeScreen: (val, process_key) => dispatch(toggleTaskHomeScreen(val, process_key)),
  unMountTaskData: () => dispatch(unMountTaskData()),
  getAllTaskCount: (orgId, types, taskType, searchData, dateFilters, process_key, taskTitle) => dispatch(getAllTaskCount(orgId, types, taskType, searchData, dateFilters, process_key, taskTitle)),
  getAllTaskPersist: (orgId, task_type, order, sort, page, size, filterByValue, searchData, dateFilters, process_key, taskTitle, selectedInvolvedGroup) => dispatch(getAllTaskPersist(orgId, task_type, order, sort, page, size, filterByValue, searchData, dateFilters, process_key, taskTitle, selectedInvolvedGroup)),
  getFilterTask: (orgId, process_key, appName, taskType, pageSize, order, sort, taskTitle, involved_groups, filterByValue, filterData, dateFilters, selectedInvolvedGroup) => dispatch(getFilterTask(orgId, process_key, appName, taskType, pageSize, order, sort, taskTitle, involved_groups, filterByValue, filterData, dateFilters, selectedInvolvedGroup)),
  searchTask: (orgId, processDefinitionKey, taskType, searchData, dateFilters, pageSize, order, sort, page, filter_field, filter_name, selectedInvolvedGroup, taskTitle) => dispatch(searchTask(orgId, processDefinitionKey, taskType, searchData, dateFilters, pageSize, order, sort, page, filter_field, filter_name, selectedInvolvedGroup, taskTitle)),
  UserTaskList :(orgId, appId) => dispatch(getUserTaskList(orgId, appId)),
  getInvolvedUserGroup:(orgId, groupId) => dispatch(getInvolvedUserGroup(orgId, groupId)),
  getGroupBasedCount:(orgId, taskType, searchData, processKey) => dispatch(getGroupBasedCount(orgId, taskType, searchData, processKey)),
  taskStart: () => dispatch(taskStart())
});

export default connect(mapStateToProps, mapDispatchToProps)(Tasks);
