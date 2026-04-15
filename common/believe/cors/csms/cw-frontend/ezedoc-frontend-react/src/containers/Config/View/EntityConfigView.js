/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-len */

// external components
import React, { Component } from 'react';
import { connect } from "react-redux";
import axios from "axios";
import { withRouter } from 'react-router-dom';

// internal components
import AvailableApps from "./AvailableApps";

// redux actions
import { addToast } from "../../../components/Toast/actions";
import {
    getEntityModels,
    getProcessVariables,
    saveEntityVariables,
    getEntitySelectedDatas,
} from "../../../store/actions/index";

// constants
import { 
    SUPER_ADMINISTRATOR,
    CONFIG_VIEW_ENTITY 
} from "../../../Data/constants";

// constants
const TOTAL_ALLOWED_ENTITY_VARIABLES_SELECTION = 2;
const APP_URL = process.env.REACT_APP_APP_URL;

// EntityConfigView Component
class EntityConfigView extends Component {
    state = {
        error: false,
        apiCalls: [],
        allRoles: [],
        allModels: [],
        activeRole: '',
        activeModel: '',
        activeRoleId: '',
        entityViewId: '',
        entityVars: null,
        saveError: false,
        activeModelId: '',
        selectedForms: [],
        entityError: false,
        saveDisabled: true,
        selectedOptions: [],
        selectedFormFields: [],
        allEntityWorkflows: [],
        staticSelectedForms: [],
        selectedEntityWorkflows: [],
        staticSelectedFormFields: [],
        staticSelectedEntityWorkflows: []
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        this.setLoaderState(true);
        this.props.getEntityModels(orgId)
            .then(data => {
                const firstApp = data
                    && Array.isArray(data)
                    && data[0];
                this.setState({
                    allModels: data,
                    activeModel: (firstApp && firstApp.name) || "",
                    activeModelId: (firstApp && firstApp.id) || ""
                }, () => {
                    const {
                        allModels,
                        activeModelId
                    } = this.state;

                    if (
                        allModels
                        && Array.isArray(allModels)
                        && allModels.length > 0
                    ) {
                        this.getAllRoles();
                        this.getAllEntityWorkflows();
                    }

                    if (activeModelId) this.getEntityModelAllFormsFields(activeModelId)
                })
            })
            .catch(() => this.setState({ error: true }))
            .finally(() => this.setLoaderState(false))
    }

    // Save button disable enable logic
    setSaveBtnState = () => {
        const {
            selectedForms,
            staticSelectedForms,
            selectedFormFields,
            staticSelectedFormFields,
            selectedEntityWorkflows,
            staticSelectedEntityWorkflows,
        } = this.state;

        const comparison1 = JSON.stringify(selectedForms) === JSON.stringify(staticSelectedForms)
        const comparison2 = JSON.stringify(selectedFormFields) === JSON.stringify(staticSelectedFormFields)
        const comparison3 = JSON.stringify(selectedEntityWorkflows) === JSON.stringify(staticSelectedEntityWorkflows)

        return comparison1 && comparison2 && comparison3
    }

    // Set loader logic
    setLoaderState = (isAddition) => {
        this.setState(prevState => {
            let apiCalls = prevState.apiCalls;
            if (isAddition)
                apiCalls.push('true');
            else
                apiCalls.pop();
            return { apiCalls }
        }, () => {
            const { apiCalls } = this.state;
            if (
                apiCalls
                && Array.isArray(apiCalls)
            ) {
                if (apiCalls.length > 0) this.props.setLoader(true);
                if (apiCalls.length === 0) this.props.setLoader(false);
            }
        })
    }

    // API call to get all roles
    getAllRoles = () => {
        this.setLoaderState(true);
        axios
            .get(`${APP_URL}/${this.props.match?.params?.uuid}/users/org_roles?get_owner=true`)
            .then(response => {
                const data = response.data.data;
                this.setState({ allRoles: data });
                let initialId = data.filter(item => item.name === SUPER_ADMINISTRATOR)[0].id
                this.handleRoleChange(initialId);
            })
            .catch(error => this.props.addToast('error', 'Error', error.response.data.message))
            .finally(() => this.setLoaderState(false))
    }

    // API call to get all entity workflows
    getAllEntityWorkflows = () => {
        this.setLoaderState(true);
        axios
            .get(`${APP_URL}/${this.props.match?.params?.uuid}/apps?is_global=false`)
            .then(response => {
                const allEntityWorkflows = response.data.data;
                this.setState({ allEntityWorkflows });
            })
            .catch(error => this.props.addToast('error', 'Error', error.response.data.message))
            .finally(() => this.setLoaderState(false))
    }

    // API call to get all forms and form fields for the specific entity model
    getEntityModelAllFormsFields = (modelId) => {
        const orgId = this.props.match?.params?.uuid;

        this.setLoaderState(true);
        this.props.getProcessVariables(orgId, modelId)
            .then(vars => {
                this.setState({
                    entityVars: vars,
                    entityError: false,
                    saveError: false,
                })
            })
            .catch(() => {
                this.setState({
                    entityVars: null,
                    entityError: true,
                    saveError: false,
                })
            })
            .finally(() => this.setLoaderState(false))
    }

    // API call to get all selected forms and form fields for the specific entity model
    getEntityModelSelectedFormsFields = (modelId, roleId) => {
        const orgId = this.props.match?.params?.uuid;
        this.setLoaderState(true);
        this.props.getEntitySelectedDatas(orgId, modelId, roleId)
            .then(data => {
                if (data.id) {
                    let selectedFormFields = [];
                    if (data.config_view) {
                        let configViewObj = data.config_view
                        selectedFormFields = Object.keys(configViewObj).map(item => ({ [item]: configViewObj[item] }))
                    }
                    this.setState({
                        saveDisabled: true,
                        selectedFormFields,
                        entityViewId: data.id,
                        selectedForms: data.selected_entity_forms,
                        selectedOptions: data.selected_entity_forms,
                        selectedEntityWorkflows: data.entity_workflows,
                        staticSelectedFormFields: selectedFormFields,
                        staticSelectedForms: data.selected_entity_forms,
                        staticSelectedEntityWorkflows: data.entity_workflows
                    })
                } else {
                    this.setState({
                        entityViewId: '',
                        selectedForms: [],
                        saveDisabled: true,
                        selectedOptions: [],
                        selectedFormFields: [],
                        selectedEntityWorkflows: [],
                        staticSelectedForms: [],
                        staticSelectedFormFields: [],
                        staticSelectedEntityWorkflows: []
                    })
                }
            })
            .catch(error => this.props.addToast('error', 'Error', error.response.data.message))
            .finally(() => this.setLoaderState(false))
    }

    // Handler for role change
    handleRoleChange = activeRoleId => {
        const { allRoles, activeModelId } = this.state;
        let activeRole = allRoles
            && Array.isArray(allRoles)
            && allRoles.filter(item => item.id === activeRoleId)[0].name;
        this.setState({
            activeRole,
            activeRoleId
        });

        // api call
        this.getEntityModelSelectedFormsFields(activeModelId, activeRoleId)
    }

    // Handler for entity model change
    handleModelChange = activeModelId => {
        const { allModels, activeRoleId } = this.state;
        let activeModel = allModels
            && Array.isArray(allModels)
            && allModels.filter(item => item.id === activeModelId)[0].name;
        this.setState({
            activeModel,
            activeModelId
        });

        // api calls
        this.getEntityModelAllFormsFields(activeModelId)
        this.getEntityModelSelectedFormsFields(activeModelId, activeRoleId)
    }

    // Handler to save Entity changes
    saveEntityVariables = () => {
        const {
            activeRoleId,
            entityViewId,
            activeModelId,
            selectedForms,
            selectedFormFields,
            selectedEntityWorkflows,
        } = this.state;
        const orgId = this.props.match?.params?.uuid;

        this.setLoaderState(true);
        this.setState({ saveDisabled: true });

        let configViewObj = {}
        selectedFormFields
            && Array.isArray(selectedFormFields)
            && selectedFormFields.map(item => {
                configViewObj[Object.keys(item)[0]] = Object.values(item)[0];
                return null;
            })

        this.props.saveEntityVariables(
            orgId,
            activeRoleId,
            entityViewId,
            activeModelId,
            selectedForms,
            configViewObj,
            selectedEntityWorkflows
        ).then(response => {
            this.setState({ entityViewId: response.id })
        }).catch(() => {
            this.setState({ saveDisabled: false })
        }).finally(() => this.setLoaderState(false))
    }

    // Handler to check the form names
    handleFormChecked = event => {
        let checkedForms = [...this.state.selectedForms];

        event.target.checked
            ? checkedForms.push(event.target.name)
            : (checkedForms = checkedForms.filter(item => item !== event.target.name))

        this.setState(() => ({
            selectedForms: checkedForms,
            selectedOptions: checkedForms,
        }), () => this.setState({ saveDisabled: this.setSaveBtnState() }));
    }

    // Handler to check the field names
    handleFieldChecked = ({ target }) => {
        let checkedFormFields = [...this.state.selectedFormFields];
        let [key, value] = target.name.split("____");
        let checkedFieldDict = {};

        checkedFieldDict[key] = value;
        target.checked
            ? checkedFormFields.push(checkedFieldDict)
            : (checkedFormFields = checkedFormFields.filter(item => Object.keys(item)[0] !== key))

        this.setState(() => ({
            selectedFormFields: checkedFormFields,
        }), () => this.setState(prevState => ({
            saveDisabled: this.setSaveBtnState(),
            saveError: prevState.selectedFormFields.length > TOTAL_ALLOWED_ENTITY_VARIABLES_SELECTION
        })));
    }

    // Handler to check the entity workflows
    handleActionChecked = event => {
        let checkedWorkflows = [...this.state.selectedEntityWorkflows];

        event.target.checked
            ? checkedWorkflows.push(event.target.id)
            : (checkedWorkflows = checkedWorkflows.filter(item => item !== event.target.id))

        this.setState(() => ({
            selectedEntityWorkflows: checkedWorkflows,
        }), () => this.setState({ saveDisabled: this.setSaveBtnState() }));
    }

    // Handler to reorder the selected form names
    reorder = (list, startIndex, endIndex) => {
        const reorderedArray = Array.from(list);
        const [removed] = reorderedArray.splice(startIndex, 1);
        reorderedArray.splice(endIndex, 0, removed);
        return reorderedArray;
    }

    // Handler to do something on dragged end
    onDragEnd = sortedItem => {
        if (!sortedItem.destination) {
            return;
        }

        const selectedOptions = this.reorder(
            this.state.selectedOptions,
            sortedItem.source.index,
            sortedItem.destination.index
        );

        this.setState(() => ({
            selectedOptions,
            selectedForms: selectedOptions,
        }), () => this.setState({ saveDisabled: this.setSaveBtnState() }));
    }

    // Function to remove entity_name data from the Entity Variables
    formatEntityVars = (entityVars) => {
        let vars = entityVars;
        if (vars && vars !== []) {
            Object.keys(vars).map(formName => {
                Object.keys(vars[formName]).map(item => {
                    if ((item === 'entity_name') || (item === 'entity_photo')) delete vars[formName][item]
                    return null
                })
                return null
            })
            return vars
        }
        return null
    }

    render() {
        const { loader } = this.props;

        const {
            error,
            allRoles,
            allModels,
            saveError,
            activeRole,
            entityVars,
            activeModel,
            entityError,
            saveDisabled,
            activeModelId,
            selectedForms,
            selectedOptions,
            selectedFormFields,
            allEntityWorkflows,
            selectedEntityWorkflows,
        } = this.state;

        let content;

        if (allModels && allModels.length) {
            content = (
                <AvailableApps
                    apps={allModels}
                    id={activeModelId}
                    name={activeModel}
                    isLoading={loader}
                    allRoles={allRoles}
                    saveError={saveError}
                    activeRole={activeRole}
                    onDragEnd={this.onDragEnd}
                    processError={entityError}
                    saveDisabled={saveDisabled}
                    selectedForms={selectedForms}
                    configType={CONFIG_VIEW_ENTITY}
                    selectedOptions={selectedOptions}
                    selectedApp={this.handleModelChange}
                    handleCheck={this.handleFieldChecked}
                    allEntityWorkflows={allEntityWorkflows}
                    handleFormList={this.handleFormChecked}
                    selectedFormFields={selectedFormFields}
                    handleRoleChange={this.handleRoleChange}
                    saveProcessVars={this.saveEntityVariables}
                    handleActionChecked={this.handleActionChecked}
                    processVars={this.formatEntityVars(entityVars)}
                    selectedEntityWorkflows={selectedEntityWorkflows}
                    sectionTitle='Select fields to show in Entity View'
                    roleDropdownClassName='config_entity_view_role_dropdown'
                    totalAllowedSelection={TOTAL_ALLOWED_ENTITY_VARIABLES_SELECTION}
                    workflowDropdownClassName='config_entity_view_entity_model_dropdown'
                />
            )
        } else if (error) {
            content = (
                <p style={{ paddingTop: 30 }}>
                    Looks like there is an error while fetching installed Entity Models.
                </p>
            )
        } else if (!loader && allModels.length === 0) {
            content = (
                <p style={{ paddingTop: 30 }}>
                    Looks like there are no Entity Models Installed.
                </p>
            )
        } else if (loader && allModels.length === 0) {
            content = null
        }

        return (
            <>{content}</>
        )
    }
}

// redux dispatch to props
const mapDispatchToProps = dispatch => ({
    getEntityModels: (orgId) => dispatch(getEntityModels(orgId)),
    getProcessVariables: (orgId, modelId) => dispatch(getProcessVariables(orgId, modelId, 'ENTITY')),
    getEntitySelectedDatas: (orgId, modelId, roleId) => dispatch(getEntitySelectedDatas(orgId, modelId, roleId)),
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration)),
    saveEntityVariables: (orgId, activeRoleId, entityViewId, activeModelId, selectedForms, selectedFormFields, selectedEntityWorkflows) =>
        dispatch(saveEntityVariables(orgId, activeRoleId, entityViewId, activeModelId, selectedForms, selectedFormFields, selectedEntityWorkflows)),
});

// export
export default withRouter(connect(null, mapDispatchToProps)(EntityConfigView));
