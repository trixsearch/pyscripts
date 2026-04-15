/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
import React, { Component } from 'react';
import { connect } from "react-redux";
import axios from "axios";
import { withRouter } from 'react-router-dom';

import { addToast } from "../../../components/Toast/actions";
import {
    getApps,
    getProcessVariables,
    saveProcessVariables,
} from "../../../store/actions/index";
import AvailableApps from "./AvailableApps";
import { 
    SUPER_ADMINISTRATOR, 
    CONFIG_VIEW_PROCESS
} from "../../../Data/constants";

const TOTAL_ALLOWED_PROCESS_VARIABLES_SELECTION = 5;
const APP_URL = process.env.REACT_APP_APP_URL;

class ProcessConfigView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            id: "",
            apps: [],
            apiCalls: [],
            error: false,
            processVars: null,
            processError: false,
            selected_form_fields: [],
            saveError: false,
            selected_forms: [],
            allRoles: [],
            activeRole: "",
            activeRoleId: "",
            processViewId: "",
            selectedOptions: "",
            saveDisabled: true,
            staticSelectedForms: [],
            staticSelectedFormFields: []
        };
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid; 
        if (!this.props.feature) {
            this.props.setLoader(false);
            return;
        }
        this.setLoaderState(true);
        this.props
            .getApps(orgId)
            .then((data) => {
                let [firstApp] = data;
                this.setState(
                    {
                        error: false,
                        apps: data,
                        name: (firstApp && firstApp.name) || "",
                        id: (firstApp && firstApp.id) || "",
                    },
                    () => {
                        this.getAllRole();
                        this.setLoaderState(true);
                        this.props
                            .getProcessVariables(orgId, this.state.id)
                            .then((data1) => {
                                this.setState({
                                    processVars: data1,
                                    processError: false,
                                    saveError: false,
                                });
                            })
                            .catch(() => {
                                this.setState({
                                    processVars: null,
                                    processError: true,
                                    saveError: false,
                                });
                            })
                            .finally(() => this.setLoaderState(false))
                    }
                );
            })
            .catch(() => {
                this.setState({
                    error: true,
                });
            })
            .finally(() => this.setLoaderState(false))
    }

    // Save button disable enable logic
    setSaveBtnState = () => {
        const {
            selected_forms,
            staticSelectedForms,
            selected_form_fields,
            staticSelectedFormFields,
        } = this.state;

        const comparison1 = JSON.stringify(selected_forms) === JSON.stringify(staticSelectedForms)
        const comparison2 = JSON.stringify(selected_form_fields) === JSON.stringify(staticSelectedFormFields)

        return comparison1 && comparison2
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

    getAllRole = (id) => {
        let toSearchId = id;
        this.setLoaderState(true);
        axios
            .get(`${APP_URL}/${this.props.match?.params?.uuid}/users/org_roles?get_owner=true`)
            .then((response) => {
                const data = response.data.data;
                this.setState({ allRoles: data });
                if (!toSearchId) {
                    toSearchId = data.filter(
                        (item) => item.name === SUPER_ADMINISTRATOR
                    )[0].id;
                }
                this.handleRoleChange(toSearchId);
            })
            .catch(error => this.props.addToast('error', 'Error', error.response.data.message))
            .finally(() => this.setLoaderState(false))
    };

    handleRoleChange = (id) => {
        const roleData = this.state.allRoles;
        let activedRoleName = roleData.filter(
            (item) => item.id === id
        )[0].name;
        this.setState({
            activeRole: activedRoleName,
            activeRoleId: id,
        });
        this.setLoaderState(true);
        axios
            .get(
                `${APP_URL}/${this.props.match?.params?.uuid}/apps/process_view/${this.state.id}/process_view_data?role=${id}`
            )
            .then(res => {
                if (res.data.data.id) {
                    this.setState({
                        saveDisabled: true,
                        processViewId: res.data.data.id,
                        selected_forms: res.data.data.selected_forms,
                        selectedOptions: res.data.data.selected_forms,
                        selected_form_fields: res.data.data.selected_form_fields,
                        staticSelectedForms: res.data.data.selected_forms,
                        staticSelectedFormFields: res.data.data.selected_form_fields,
                    });
                } else {
                    this.setState({
                        processViewId: "",
                        saveDisabled: true,
                        selected_forms: [],
                        selectedOptions: [],
                        selected_form_fields: [],
                        staticSelectedForms: [],
                        staticSelectedFormFields: [],
                    });
                }
            })
            .catch(error => this.props.addToast('error', 'Error', error.response.data.message))
            .finally(() => this.setLoaderState(false))
    };

    selectedApp = (name, process_key, id) => {
        this.setState(
            () => ({
                name,
                id,
            }),
            () => {
                this.handleRoleChange(this.state.activeRoleId);
                this.setLoaderState(true);
                this.props
                    .getProcessVariables(orgId, this.state.id)
                    .then((data) => {
                        this.setState({
                            processVars: data,
                            processError: false,
                            saveError: false,
                        });
                    })
                    .catch(() => {
                        this.setState({
                            processVars: null,
                            processError: true,
                            saveError: false,
                        });
                    })
                    .finally(() => this.setLoaderState(false))
            }
        );
    };

    saveProcessVars = () => {
        const orgId = this.props.match?.params?.uuid; 

        this.setLoaderState(true);
        this.setState({ saveDisabled: true });
        this.props
            .saveProcessVariables(
                orgId,
                this.state.id,
                this.state.selected_form_fields,
                this.state.selected_forms,
                this.state.activeRoleId,
                this.state.processViewId
            )
            .then((res) => {
                this.setState({
                    processViewId: res.id,
                });
            })
            .catch(() => {
                this.setState({
                    saveDisabled: false,
                });
            })
            .finally(() => this.setLoaderState(false))
    };

    handleFormList = (event) => {
        let checked_forms = [...this.state.selected_forms];
        event.target.checked
            ? checked_forms.push(event.target.name)
            : (checked_forms = checked_forms.filter(
                (item) => item !== event.target.name
            ));

        this.setState(() => ({
            selected_forms: checked_forms,
            selectedOptions: checked_forms,
        }), () => this.setState({ saveDisabled: this.setSaveBtnState() }));
    };

    handleCheck = ({ target }) => {
        let checked_form_fields = [...this.state.selected_form_fields];
        let [key, value] = target.name.split("____");
        let checkedFieldDict = {};
        checkedFieldDict[key] = value;
        target.checked
            ? checked_form_fields.push(checkedFieldDict)
            : (checked_form_fields = checked_form_fields.filter(
                (item) => Object.keys(item)[0] !== key
            ));

        this.setState(() => ({
            selected_form_fields: checked_form_fields,
            saveDisabled: false,
        }), () => this.setState((prevState) => ({
            saveDisabled: this.setSaveBtnState(),
            saveError: prevState.selected_form_fields.length > TOTAL_ALLOWED_PROCESS_VARIABLES_SELECTION
        })));
    };

    reorder = (list, startIndex, endIndex) => {
        const reorderedArray = Array.from(list);
        const [removed] = reorderedArray.splice(startIndex, 1);
        reorderedArray.splice(endIndex, 0, removed);
        return reorderedArray;
    };

    onDragEnd = (sortedItem) => {
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
            selected_forms: selectedOptions,
        }), () => this.setState({ saveDisabled: this.setSaveBtnState() }));
    };

    render() {
        const {
            id,
            name,
            apps,
            error,
            allRoles,
            saveError,
            activeRole,
            processVars,
            processError,
            saveDisabled,
            selected_forms,
            selectedOptions,
            selected_form_fields,
        } = this.state;

        const { loader } = this.props;

        let content;

        if (apps && apps.length) {
            content = (
                <AvailableApps
                    apps={apps}
                    name={name}
                    isLoading={loader}
                    selectedApp={this.selectedApp}
                    id={id}
                    processVars={processVars}
                    processError={processError}
                    handleCheck={this.handleCheck}
                    saveProcessVars={this.saveProcessVars}
                    selectedFormFields={selected_form_fields}
                    selectedForms={selected_forms}
                    saveError={saveError}
                    handleFormList={this.handleFormList}
                    allRoles={allRoles}
                    activeRole={activeRole}
                    handleRoleChange={this.handleRoleChange}
                    onDragEnd={this.onDragEnd}
                    selectedOptions={selectedOptions}
                    saveDisabled={saveDisabled}
                    configType={CONFIG_VIEW_PROCESS}
                    totalAllowedSelection={TOTAL_ALLOWED_PROCESS_VARIABLES_SELECTION}
                    roleDropdownClassName='config_view_role_dropdown'
                    workflowDropdownClassName='config_view_workflow_dropdown'
                    sectionTitle='Select fields to show in Process View'
                />
            );
        } else if (error) {
            content = (
                <p style={{ paddingTop: 30 }}>
                    Looks like there is an error while fetching installed Apps.
                </p>
            );
        } else if (!loader && apps.length === 0) {
            content = (
                <p style={{ paddingTop: 30 }}>
                    Looks like there are no Apps Installed.
                </p>
            );
        } else if (loader && apps.length === 0) {
            content = null
        }

        return (
            <>{content}</>
        )
    }
}

const mapStateToProps = (state) => ({
    feature: state.auth.uiFeatures.organisationworkflow.view,
});

const mapDispatchToProps = (dispatch) => ({
    getApps: () => dispatch(getApps()),
    getProcessVariables: (orgId, id) => dispatch(getProcessVariables(orgId, id)),
    saveProcessVariables: (orgId, id, data, forms, activeRoleId, processViewId) => dispatch(
        saveProcessVariables(orgId, id, data, forms, activeRoleId, processViewId)
    ),
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ProcessConfigView));
