/* eslint-disable no-param-reassign */
import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import AsyncSelect from 'react-select/async';
import { NavLink } from "react-router-dom";

import {DropdownIndicator,handleRoleSearch} from '../Config/Utils/ConfigUtils'
import Sortable from "../../components/UI/Sortable/Sortable";
import * as actions from "../../store/actions/index";
import Charts from "./Chart/Chart";
import AdvancedFilterComponent from "./Chart/AdvancedFilter";
import Spinner from '../../components/UI/Spinner/Spinner';
import ProcessVars from './ProcessVars';
import { Button } from "../../components/UI/AppButton/AppButton";
import {
 getObjectFromArray, validator, getRegexErrorMessage, parseQueryString 
} from "../utils";
import {REPORT_CHOICES, GROUP_FILTER_FIELDS} from "../../Data/constants"
import { reactSelectStyles} from '../Config/Utils/ReactSelectStyles';
import SilderCheckbox from "../../components/UI/Checkbox/SliderCheckbox";
import { addToast } from '../../components/Toast/actions';
import "./Report.css";

const APP_URL = process.env.REACT_APP_APP_URL;

class ReportCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      show: true,
      loader: false,
      roles: [],
      error:false,
      name: "",
      description: "",
      currentWorkflow: "",
      query: [
        {
          type: "processSpecific",
          comparision: "EQUALS",
          attribute: "",
          value: "",
          prompt: false,
          field_type:''
        }],
      processVars: {},
      processVarsError: true,
      processVarsLoader: false,
      config: [],
      data: [],
      count: 1,
      toggle: {},
      reportVariables: {},
      selectedOptions: [],
      validate: false,
      decisionQuery: true,
      process_fields: {
        startTime: false,
        deleteReason: false,
        durationInMillis: false,
        endTime: false
      },
      report_type : "custom",
      userFilterChoices : [],
      userFilter : [],
      processType: "",
      isInvolved : false,
      sendViaEmail : true,
      report_on:'PROCESS',
      entity_master_model:'',
      reportOnChoice:[],
      MaterModelChoices:[],
      typeDecision:false,
      reportOnDecision:false,
      reportOnEntity:false,
      entity_fields:[]
    };
  }

  componentDidMount() {
    const orgId = this.props.match?.params?.uuid;
    const keyChoice = GROUP_FILTER_FIELDS;
    axios.get(`${APP_URL}/${orgId}/config/custom_attribute/get_attribute?type=users`)
    .then( response => {
      const listComponents = response.data.data.components
      if (listComponents.length) {
        const keyData = listComponents.map(attrib => {
            return { "key": attrib.key, "label": attrib.label }
        })
        this.setState({
            userFilterChoices: [...keyChoice, ...keyData]
        })
      }else {
          this.setState({
              userFilterChoices: keyChoice
          })
      }
    })
    .catch(error => {
      this.setState(error)
    })
    axios.get(`${APP_URL}/${orgId}/entity/master?model_type=entities`)
        .then( response => {
          const MaterModelData = response.data.data
          if (MaterModelData.length) {
            const MaterModelChoices = MaterModelData.map(attrib => {
                return { "key": attrib.id, "label": attrib.name }
            })
            this.setState({
              MaterModelChoices: MaterModelChoices,
              reportOnChoice:[{ "key": 'PROCESS', "label": 'Process'},{ "key": 'ENTITY', "label": 'Entity'}],
              reportOnDecision: true,
            })
          }else {
              this.setState({
                MaterModelChoices: [],
                reportOnChoice:[{ "key": 'PROCESS', "label": 'Process'}],
                reportOnDecision: false,
              })
          }
        })
        .catch(error => {
          this.setState(error)
        }) 
    const {match} = this.props;
    if(match && match.params && match.params.id) {
      this.setState({ loader: true });
      axios.get(`${APP_URL}/${orgId}/config/report/template/${match.params.id}`)
      .then(response => {
         const {
          id, name, description, selected_fields, apps , report_type,roles, is_involved,
          process_type, user_filter, send_via_email,report_on,entity_master_model
        } = response.data.data;
        let query = response.data.data.query.query
        if(report_on === 'ENTITY') {
          let entity = []
          if(selected_fields.entity_fields) {
            entity = getObjectFromArray(selected_fields.entity_fields)
          }
          this.setState({typeDecision:true, reportOnEntity:true, entity_fields: entity})
        }
        if(roles) {
          axios.get(`${APP_URL}/${orgId}/permissions/org_roles`)
            .then(res => {
              let options = res.data.data.map(role => ({
                value: role.id,
                label: role.name
              }));
              let rolesName = options.filter(option=>roles.includes(option.value));
              this.setState({
                roles:rolesName
              })
            })
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.log(error);
            });
        }
        if(report_on !== 'ENTITY' && query.length === 0) {
          query = [
            {
              type: "processSpecific",
              comparision: "EQUALS",
              attribute: "",
              value: "",
              prompt: false,
              field_type:''
            }
          ]
        }
        this.setState({
          edit: true,
          reportID: id,
          name, 
          description,
          roles,
          show: false, 
          query,
          reportVariables: getObjectFromArray(selected_fields.selected_fields),
          process_fields: getObjectFromArray(selected_fields.process_fields), 
          selectedOptions: Object.values(getObjectFromArray(selected_fields.selected_fields)),
          currentWorkflow: apps,
          report_type: REPORT_CHOICES[report_type], 
          isInvolved: is_involved,
          processType:process_type,
          userFilter: user_filter || [],
          sendViaEmail: send_via_email,
          report_on:report_on,
          entity_master_model:entity_master_model
        }, () => {
          if(this.state.entity_master_model !== null || '') {
            this.handleWorkflowChange({target: {value: entity_master_model, 'type':'ENTITY'}}, true)
          }else{
          this.handleWorkflowChange({target: {value: apps}}, true)
          }
        })
      })
      .catch(() => {
        this.setState({ error: true });
      }).finally(() => {
        this.setState({ loader: false });
      })
    }
    this.props.onAppLoad(orgId);
  }

  handleCheck = ({ target }) => {
    let checked_form_fields = {...this.state.reportVariables };
    let [key, value] = target.name.split("-");
    if(target.checked) {
      checked_form_fields[key] = value;
    } else { 
      delete checked_form_fields[key];
    }
    this.setState(() => ({ 
      reportVariables: checked_form_fields, 
      selectedOptions: Object.values(checked_form_fields) 
    }));
  };

  reorder = (list, startIndex, endIndex) => {
    const reorderedArray = Array.from(list);
    const [removed] = reorderedArray.splice(startIndex, 1);
    reorderedArray.splice(endIndex, 0, removed);
    return reorderedArray;
  };

  reorderVariables = (object, sortedValues) => {
    let reorderObject = {}
    sortedValues.forEach(value => {
      Object.keys(object).map(key => {
        if(object[key] === value) {
          reorderObject[key] = value;
        } 
        return key;
      })
    })
    return reorderObject;
  }

  onDragEnd = sortedItem => {
    if(!sortedItem.destination) {
      return;
    }
                        
    const selectedOptions = this.reorder(
      this.state.selectedOptions,
      sortedItem.source.index,
      sortedItem.destination.index
    );
    
    const reportVariables = this.reorderVariables(
      this.state.reportVariables,
      selectedOptions
    );
    
    this.setState(() => ({
      reportVariables,
      selectedOptions
    }));
  };

  delete = (data) => {
    let query = this.state.query.filter((e, key) => key !== data);
    this.setState(() => ({
      query
    }));
  };

  count = () => {
    let len = this.state.query.length;
    let query = this.state.query;
    query[len] = {
      type: "processSpecific",
      comparision: "EQUALS",
      attribute: "",
      value: "",
      prompt: false,
      field_type:''
    };
    this.setState(() => ({
      query
    }));
  };

  handleAttribute = (data, i, formFields=[]) => {
    let value = data.target.value;
    let checkboxValue = data.target.checked;
    let inputType = data.target.type;
    if(inputType === 'checkbox') {
      value = checkboxValue;
    }
    if (data.target.type === "number") {
      value = Number(data.target.value);
    }

    let name = data.target.name;
    let newQuery = this.state.query;
    if (name === "type") {
      newQuery[i].attribute = ""
      newQuery[i].comparision = "EQUALS"
      newQuery[i].value = ""
    }
    let queryTemp = newQuery;
    if (name === 'attribute' && formFields.length > 0) {
      let fieldTypeData = formFields.filter(field => field.key === value);
      let field_type = ''
      if(fieldTypeData.length !== 0) {
        field_type = fieldTypeData[0].type
      }
      queryTemp[i] = {
        ...queryTemp[i],
        [name]: value,
        'field_type': field_type
      };
    }else{
      queryTemp[i] = {
      ...queryTemp[i],
      [name]: value,
    };
  }
    this.setState(() => ({
      query: queryTemp,
      decisionQuery: false
    }));
  };

  handleToggle = ({ target }) => {
    this.setState(prevState => ({
      toggle: {
        ...prevState.toggle,
        [target.name]: !prevState.toggle[target.name]
      }
    }));
  };

  handleWorkflowChange = ({ target: { value, type='' } }, edit = false) => {
    const orgId = this.props.match?.params?.uuid;
    let toggle = {};
    this.setState({ processVarsLoader: true });
    let url = ''
    if(type === 'ENTITY') {
      url = `${APP_URL}/${orgId}/apps/${value}/report_view?type=entity`
    } else{
      url = `${APP_URL}/${orgId}/apps/${value}/report_view`
    }
    this.props.getProcessVariables(orgId, value, type)
    .then(data => {
      let [firstForm] = Object.keys(data);
      Object.keys(data).map(key => {
        let form_name = `toggle${key}`;
        return {
          ...key,
          [form_name]: false
        }
      })
      toggle = {
        ...toggle,
        [`toggle${firstForm}`]: true
      }

      return this.setState(prevState => ({
        toggle,
        processVars: data,
        processVarsError: null,
        selectedOptions: edit ? prevState.selectedOptions : [],
        reportVariables: edit ? prevState.reportVariables : {},
        query: edit ? prevState.query: [{
            type: "processSpecific",
            comparision: "EQUALS",
            attribute: "",
            value: "",
            prompt: false,
            field_type:''
          }
        ],
        count:edit ? prevState.count : 1
      }))
    }).catch(err => {
      this.setState(prevState => ({
        toggle,
        processVars: {},
        processVarsError: (err && err.message) 
        || "Failed to get Process variables for this organisation workflow.",
        selectedOptions: edit ? prevState.selectedOptions : [],
        reportVariables: edit ? prevState.reportVariables : {},
        query: edit ? prevState.query: [{
          type: "processSpecific",
          comparision: "EQUALS",
          attribute: "",
          value: "",
          prompt: false,
          field_type:''
        }
      ],
      count:edit ? prevState.count : 1
      }))
    });
    axios.get(url)
    .then(response => {
      this.setState({ config: response.data.data })
    }).catch(() => {
      this.setState({ config: [] })
    }).finally(() => {
      this.setState({processVarsLoader: false})
    })
    if(type !== 'ENTITY') {
      this.setState({ currentWorkflow: value })
    }
  };

  handleChange = ({ target: { name }, target: { value } }) => {
    this.setState({ [name]: value, validate: false })
  }

  handleSubmit = (event) => {
    const orgId = this.props.match?.params?.uuid;

    event.preventDefault();
    this.setState({validate: true, decisionQuery: true})
    const { 
      edit, name, reportVariables, reportID, process_fields
    } = this.state
    let submit = Object.keys(reportVariables).length > 0;
    
    let elements = Array.from(document.getElementsByClassName("query-decision"));
    Object.keys(process_fields).forEach((processField) => {
      if(process_fields[processField] === false) delete process_fields[processField]
    })
    elements.map(element => {
      let newElement = element
      if ((!element.value||element.value==="Select Attribute") && element.required) {
        newElement.style.border = "2px solid #dc3545";
        submit = false;
      } else newElement.style.border = "1px solid #ccc";
      return newElement
    })
    if (Object.keys(this.state.reportVariables).length === 0) {
      if(this.state.toggle && Object.keys(this.state.toggle).every((i) => !this.state.toggle[i])) {
        let [toggleData] = Object.keys(this.state.toggle)
        let toggle = {
          [toggleData]: true
        }
        this.setState(prevState=>{
          const prevToggle = prevState.toggle
          return {
          toggle: {
            ...prevToggle,
            ...toggle
          }
        }
      })
      }
      let reqProcessVar = Array.from(document.getElementsByClassName("required_report_variables"));
      reqProcessVar.map(processVar=>{
        let newVar = processVar
        newVar.style.border = "2px solid #dc3545";
        return newVar;
      })

    }
      if(submit && name) {
        if(edit) {
          this.props.editReports(orgId, reportID, reportVariables, this.state, this.props.history);
        }else this.props.saveReports(orgId, reportVariables, this.state, this.props.history)
      } else {
        this.props.addToast('error', 'Error', 'Please fill all the details before saving.')
      }
    }

  checkType = ({target: { value }, target: {name}}) => {
    this.setState(({
        [name] :  value,
        prompt_variable : false,
        query: [
          {
            type: "processSpecific",
            comparision: "EQUALS",
            attribute: "",
            value: ""
          }]
    }))
  } 

  processFieldCheck = ({target: { checked }, target: {name}}) => {
    let [fieldValue, fieldName] = name.split('____')
    this.setState(prevState => ({ 
        process_fields: { 
          ...prevState.process_fields,
        [fieldValue]: checked
      }
    }))
    let process_fields = { ...this.state.process_fields}
    if(checked) {
      process_fields[fieldValue] = fieldName;
    } else {
      delete process_fields[fieldValue];
    }
    this.setState(() =>({ process_fields }));
  }

  setRoles = (option) => {
    if(option === null) {
      option = []
    }
    this.setState({
      roles:option
    })
    return option
  }

  handleProcessType = ({target: {value}}) => {
    this.setState({
      processType: value
    })
  }

  handleUserFilter = ({target: {value}}) => {
    this.setState({
      userFilter: value ? [value] : []
    })
  }

  handleIsInvolved = ({target : {checked}}) => {
    this.setState({
      isInvolved: checked
    })
  }

  handleSendViaEmail = ({target : {checked}}) => {
    this.setState({
      sendViaEmail: checked
    })
    if(!checked)
      this.props.addToast('warning', 'Warning', `Choosing the option of Downloading Reports might not yield consistent results when the number of records is large. It is preferable to use the Send via Email option.`)
  }

  handleReportOnChange = ({ target: { value } }) => {
    if(value === 'ENTITY') {
      this.setState({
        report_on: value, 
        typeDecision: true,
        currentWorkflow:'',
        reportVariables: {},
        selectedOptions: [],
        query: [],
        count: 1,
        toggle: {},
        isInvolved : false,
        processVars: {},
        processVarsError: true,
        config:[],
        reportOnEntity:true
      })
    }else{
      this.setState({
        report_on: value, 
        typeDecision: false, 
        entity_master_model:'',
        reportVariables: {},
        selectedOptions: [],
        query: [
          {
            type: "processSpecific",
            comparision: "EQUALS",
            attribute: "",
            value: "",
            prompt: false,
            field_type:''
          }],
        count: 1,
        toggle: {},
        processVars: {},
        processVarsError: true,
        config:[],
        reportOnEntity:false
      })
    }
  };

  handleMasterModelChange = ({ target: { value } }) => {
    this.setState({ entity_master_model: value })
    this.handleWorkflowChange({target: {value: value, 'type':'ENTITY'}}, true)
  };

  entityFieldCheck = ({target: { checked }, target: {name}}) => {
    let [fieldValue, fieldName] = name.split('____')
    this.setState(prevState => ({ 
        entity_fields: { 
          ...prevState.entity_fields,
        [fieldValue]: checked
      }
    }))
    let entity_fields = { ...this.state.entity_fields}
    if(checked) {
      entity_fields[fieldValue] = fieldName;
    } else {
      delete entity_fields[fieldValue];
    }
    this.setState(() =>({ entity_fields }));
  }

  render() {
    const { loader, match } = this.props;
    const { 
      name, description, processVars, processVarsError, selectedOptions, process_fields,roles,
      currentWorkflow, reportVariables, toggle, validate, decisionQuery, edit, userFilterChoices,report_on,entity_master_model,reportOnChoice,MaterModelChoices, entity_fields
    } = this.state;

    let title = this.props.match.path === '/reports/create' ? 'Create New Report' : 'Edit Report';
    
    if (!decisionQuery) {
      let elements = Array.from(document.getElementsByClassName("query-decision"));
      elements.map(element => {
        let newElement = element
        newElement.style.border = "1px solid #ccc";
        return newElement
      })
    }

    const { next = 1 } = parseQueryString(this.props.history.location.search);
    
    const nameValidator = validator(name)
    const orgId = match?.params?.uuid;

    return (
      <>
        <div className="main_changable_container" >
          <div className="app_btn_container reports_container">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p className="create-report-text">{title}</p>
              <div style={{ display: "flex" }}>
                <p style={{ marginTop: 10, marginRight: 5 }}><strong>Report Delivery : </strong></p>
                {/* <p style={{ marginTop: 10, marginRight: 5 }}>Download</p> */}
                {/* <SilderCheckbox name='send' onChange={this.handleSendViaEmail} checked={this.state.sendViaEmail} /> */}
                <p style={{ marginTop: 10, marginLeft: 5 }}>Send via Email</p>
              </div>
            </div>
            <section className="create-report-form">
              <div>
                <form className="form_up_box" >
                  {(loader || this.state.loader || this.state.processVarsLoader) && <Spinner />}
                  <div className="col-md-12" style={{ display: 'grid', gridTemplateColumns: '50% 50%', padding: 0 }}>
                    <div className="floating-label col-md-12" style={{ display: 'block' }}>
                    <input
                      className={validate && !name ? "floating-input is-invalid" : 'floating-input'}
                      name="name"
                      placeholder=" "
                      value={name}
                      onChange={this.handleChange}
                      autoComplete="false"
                      style={nameValidator ? {borderColor: '#d0021b', color: '#d0021b'} : {}}
                    />
                    <label>Report Name</label>
                    <span className="empty-submit">
                      {(validate && !name) && "Report Name can't be empty"}
                      {
                        nameValidator
                        ? getRegexErrorMessage('report name')
                        : null
                      }
                    </span>
                  </div>
                    <div className="floating-label col-md-12">
                    <textarea
                      className="floating-input"
                      name="description"
                      placeholder=" "
                      maxLength="120"
                      value={description}
                      onChange={this.handleChange}
                    />
                    <label>Report Description</label>
                  </div>
                  </div>
                  <div className="col-md-12" style={{ display: 'grid', gridTemplateColumns: '50% 50%', padding: 0 }}>
                    <div className="floating-label" style={{ padding: '0px 15px' }}>
                      <select
                        name="reportOn"
                        value={report_on}
                        onChange={this.handleReportOnChange}
                        className='floating-select'
                        disabled={edit}
                      >
                        {reportOnChoice && <option disabled value=''>Select Report Type</option>}
                        {(reportOnChoice && reportOnChoice.length)
                          ? (reportOnChoice.map(reportOn => (
                            <option key={reportOn.key} value={reportOn.key}>
                              {reportOn.label}
                            </option>
                          )))
                          : (<option disabled>No Report Type </option>)
                        }
                      </select>
                      <label style={edit ? { top: -16 } : {}}>Report Type</label>
                    </div>
                    {this.state.reportOnDecision && this.state.typeDecision ? (
                      <div className="floating-label" style={{ padding: '0px 15px' }}>
                        <select
                          name="masterModel"
                          value={entity_master_model}
                          onChange={this.handleMasterModelChange}
                          className='floating-select'
                          disabled={edit}
                        >
                          {MaterModelChoices && <option disabled value=''>Select Entity</option>}
                          {MaterModelChoices.length
                            ? (MaterModelChoices.map(item => (
                              <option key={item.key} value={item.key}>
                                {item.label}
                              </option>
                            )))
                            : (<option disabled>No Entity </option>)
                          }
                        </select>
                        <label style={edit ? { top: -16 } : {}}>Entity</label>
                      </div>
                    ) : (
                        <div className="floating-label" style={{ padding: '0px 15px' }}>
                          <select
                            name="currentWorkflow"
                            value={currentWorkflow}
                            onChange={this.handleWorkflowChange}
                            className='floating-select'
                            disabled={edit}
                          >
                            {this.props.apps.length && <option disabled value=''>Select Workflow</option>}
                            {this.props.apps.length ? (
                              this.props.apps.map(workflow => (
                                <option key={workflow.id} value={workflow.id}>
                                  {workflow.name}
                                </option>
                              ))
                            ) : (<option disabled>No Workflows</option>)}
                          </select>
                          <label style={edit ? { top: -16 } : {}}>Workflow</label>
                        </div>
                      )}
                  </div>
                  {/* Commenting Rolese field for now  */}
                  {/* <div className="col-md-12" style={{ display: 'grid', gridTemplateColumns: '50% 50%', padding: 0 }}>
                    <div className="floating-label" style={{ display: 'block', padding: '0px 15px' }}>
                      <AsyncSelect
                        noOptionsMessage={() => null}
                        components={{DropdownIndicator}}
                        value={roles}
                        isMulti
                        name="roles"
                        placeholder='Search for roles'
                        styles={reactSelectStyles}
                        loadOptions={(text) => handleRoleSearch(orgId, text)}
                        onInputChange={this.handleInputChange}
                        backspaceRemovesValue={false}
                        onChange={(option) => this.setRoles(option)}
                      />
                      <label className="react-select-label">Roles</label>
                    </div>
                  </div> */}
                  <Charts
                    hideFilter={!this.state.typeDecision}
                    show={this.state.show}
                    report_type={this.state.report_type}
                    clicked={this.state.currentWorkflow}
                    query={this.state.query}
                    handleAttribute={this.handleAttribute}
                    count={this.count}
                    config={this.state.config}
                    delete={this.delete}
                    runReport={false}
                    showShadowCard={false}
                    handlePrompt={this.handlePrompt}
                    checkType={this.checkType}
                    typeDecision={this.state.typeDecision}
                    reportOnEntity={this.state.reportOnEntity}
                  />
                  <h4>Advanced Filter</h4>
                  <AdvancedFilterComponent
                    report_type={this.state.report_type}
                    userFilterChoices={userFilterChoices}
                    handleIsInvolved={this.handleIsInvolved}
                    handleProcessType={this.handleProcessType}
                    handleUserFilter={this.handleUserFilter}
                    userFilter={this.state.userFilter}
                    processType={this.state.processType}
                    isInvolved={this.state.isInvolved}
                    typeDecision={this.state.typeDecision}
                  />
                  {!this.state.typeDecision ? (
                    <>
                      <h4>Select Process Fields</h4>
                      <div className="" style={{ margin: 4 }}>
                        <ProcessFieldCheckBox
                          checked={process_fields.startTime}
                          processFieldCheck={this.processFieldCheck}
                          name="startTime____Started At"
                          displayName="Started At"
                        />
                        <ProcessFieldCheckBox
                          checked={process_fields.endTime}
                          processFieldCheck={this.processFieldCheck}
                          name="endTime____Completed At"
                          displayName="Completed At"
                        />
                        <ProcessFieldCheckBox
                          checked={process_fields.durationInMillis}
                          processFieldCheck={this.processFieldCheck}
                          name="durationInMillis____Process Duration"
                          displayName="Process Duration"
                        />
                        <ProcessFieldCheckBox
                          checked={process_fields.deleteReason}
                          processFieldCheck={this.processFieldCheck}
                          name="deleteReason____Withdraw Reason"
                          displayName="Withdraw Reason"
                        />
                        {/* Todo: hiding this section because it is calling extra api to get the data which is causing extra time while downloading
                        reports. so from now no new reports will have this fields.
                        <ProcessFieldCheckBox
                          checked={process_fields.currentOwner}
                          processFieldCheck={this.processFieldCheck}
                          name="currentOwner____Current Owner"
                          displayName="Current Owner(s)"
                        /> */}
                      </div>
                    </>
                  ) : (
                  <>
                  <h4>Select Entity Fields</h4>
                  <div className="checkbox-container" style={{ margin: 4 }}>
                    <ProcessFieldCheckBox
                      checked={entity_fields.created_at}
                      processFieldCheck={this.entityFieldCheck}
                      name="created_at____Created At"
                      displayName="Created At"
                    />
                    <ProcessFieldCheckBox
                      checked={entity_fields.deleted_at}
                      processFieldCheck={this.entityFieldCheck}
                      name="deleted_at____Deleted At"
                      displayName="Deleted At"
                    />
                    <ProcessFieldCheckBox
                      checked={entity_fields.updated_at}
                      processFieldCheck={this.entityFieldCheck}
                      name="updated_at____Updated At"
                      displayName="Updated At"
                    />
                  </div>
                  </>
                  )}
                  <ProcessVars
                    currentWorkflow={currentWorkflow}
                    processVars={processVars}
                    processVarsError={processVarsError}
                    checkedFields={reportVariables}
                    handleCheck={this.handleCheck}
                    toggle={toggle}
                    handleToggle={this.handleToggle}
                    reportVariables={reportVariables}
                  />
                  {!!Object.keys(reportVariables).length && (
                    <div className="app_showing_head">
                      <p>
                        Contents
                        <small className="order-helper-text">
                          (Move the content side-ways to change the order.
                          Note: Process fields will not appear here and will be automatically
                          appended at the end and their order can not be changed.)
                        </small>
                      </p>
                    </div>
                  )}
                  <Sortable selectedOptions={selectedOptions} cardColor='#7b7d85' onDragEnd={this.onDragEnd} />
                  <div className="report-form-button-cont">
                    <NavLink to={`/custom-workflow/org/${orgId}/reports/?page=${next}`}>
                      <Button
                        variant="secondary"
                        customStyle={{marginRight: 10}}
                      >
                        Cancel
                      </Button>
                    </NavLink>
                    <button
                      disabled={processVarsError || nameValidator}
                      type="submit"
                      onClick={this.handleSubmit}
                      className="fancy_btn active"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  loader: state.report.loader,
  apps: state.report.appsData,
  formFields: state.report.formFields,
  config: state.report.config
});

const mapDispatchToProps = (dispatch) => ({
  onAppLoad: (orgId) => dispatch(actions.ReportAppDetails(orgId)),
  getProcessVariables: (orgId, id, type) => dispatch(actions.getProcessVariables(orgId, id, type)),
  saveReports: (orgId, reportVariables, state, history,rolesData) => (
    dispatch(actions.saveReports(orgId, reportVariables, state, history, rolesData))),
  editReports: (orgId, id, orderedData, state, history,rolesData) => (
    dispatch(actions.editReports(orgId, id, orderedData, state, history, rolesData))),
  addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(mapStateToProps, mapDispatchToProps)(ReportCreate);

export const ProcessFieldCheckBox = ({
  checked, processFieldCheck, name, displayName
}) => {
  return (
    <div
      className="config-view-checkbox"
      style={{ display: "flex", marginLeft: 10 }}
    >
      <input
        className="checkbox"
        onChange={processFieldCheck}
        checked={checked || false}
        type="checkbox"
        name={name}
        style={{marginTop: -5}}
      />
      <p 
        role='presentation'
        className='process-vars-text field-name'
        onClick={() => processFieldCheck({
          target: {
            name,
            checked: !checked,
          }
        })}
      >
        {displayName}
      </p>
    </div>
  )
}
