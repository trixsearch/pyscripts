import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import ReactTooltip from 'react-tooltip';
import { NavLink } from "react-router-dom";

import IconPicker from './IconPicker';
import { isMobile } from '../../utils';
import Spinner from "../../../components/UI/Spinner/Spinner";
import { addToast } from '../../../components/Toast/actions';
import "./configure.css";

const APP_URL = process.env.REACT_APP_APP_URL;

class ConfigureApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            description: "",
            version: "",
            workFlowIcon: "",
            workFlowOpen: false,
            isAdminInitiable: false,
            loader: false
        }
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        this.setState({ loader: true })

        axios.get(`${APP_URL}/${orgId}/apps/${this.props.id}`).then(res => {
            let workflow = res.data.data
            this.setState({
                name: workflow.name,
                description: workflow.description,
                version: workflow.version || "",
                workFlowIcon: workflow.icon_class,
                workFlowOpen: workflow.is_open,
                isAdminInitiable: workflow.is_admin_initiable,
                workflowDetailsPermission: workflow.initiate_permission
                    || this.props.processPermission
                    || this.props.editWorkflowPermission,
                loader: false
            })
        }).catch(() => { })
    }

    publishWorkflow = () => {
        const orgId = this.props.match?.params?.uuid;
        this.setState({ loader: true })
        let data = {
            "icon_class": this.state.workFlowIcon,
            "name": this.state.name,
            "description": this.state.description,
            "is_open": this.state.workFlowOpen,
            "is_admin_initiable": this.state.isAdminInitiable,
            "version": this.state.version
        }
        axios.put(`${APP_URL}/${orgId}/apps/${this.props.id}`, data).then(res => {
            this.props.addToast('success', 'Success', res.data.message)
        }).catch((err) => {
            if(err.response && err.response.data)
                this.props.addToast('error', 'Error', err.response.data.message)
            this.props.addToast('error', 'Error', 'Something went wrong, please try after sometime.')
        }).finally(() => {
            this.setState({
                loader: false
            })
        })

    }

    selectWorkflow = (icon) => {
        this.setState({ workFlowIcon: icon })
    }

    handleChange = ({ target: { name, value } }) => {
        this.setState({
            [name]: value
        })
    }

    handleCheckBox = ({ target: { name, checked } }) => {
        this.setState({
            [name]: checked
        })
    }

    render() {
        const {
            loader, name, description, version, workFlowIcon, workFlowOpen, isAdminInitiable
        } = this.state;

        return (
            <div>
                {loader && (<Spinner />)}
                {this.state.workflowDetailsPermission && (
                    <div>
                        <div className="app_category_head">
                            <p>Edit App Details</p>
                        </div>
                        <div className="edit_app_detils_form_cont">
                            <form className="form_up_box">
                                <div className="row col-md-12 m-0">
                                    <div className="floating-label col-md-6">
                                        <input
                                            name="name"
                                            onChange={this.handleChange}
                                            className="floating-input"
                                            value={name}
                                        />
                                        <label>App Name</label>
                                    </div>
                                    <div className="floating-label col-md-6">
                                        <input
                                            name="description"
                                            onChange={this.handleChange}
                                            className="floating-input"
                                            value={description}
                                        />
                                        <label>Description</label>
                                    </div>
                                </div>
                                <div className="row col-md-12 m-0">
                                    <div className="floating-label col-md-3">
                                        <input
                                            name="version"
                                            onChange={this.handleChange}
                                            placeholder=" "
                                            className="floating-input"
                                            value={version}
                                        />
                                        <label>Version</label>
                                    </div>
                                    <div className="floating-label col-md-3 iconPicker-container">
                                        <div className="iconPicker-selected">
                                            {workFlowIcon
                                                ? <i className={`${workFlowIcon} iconPicker-current-icon`} />
                                                : <span className="iconPicker-fallback">?</span>
                                            }
                                        </div>
                                        <IconPicker selectWorkflow={this.selectWorkflow} />
                                    </div>
                                    <div className="floating-label col-md-3">
                                        <input
                                            className="open_checkbox"
                                            type="checkbox"
                                            name="workFlowOpen"
                                            checked={workFlowOpen}
                                            onChange={this.handleCheckBox}
                                        />
                                        <span className="open_form">
                                            Anonymous Initiation
                                        </span>
                                        <div className="open_form_info" data-tip data-for="open">
                                            <i className="glyphicon glyphicon-question-sign open_help" aria-hidden="true" />
                                        </div>
                                        {!isMobile() ? (
                                            <ReactTooltip id="open" place='bottom' delayShow={1000} aria-haspopup='true' className="app_btn_bg_color">
                                                <h6 className="entity_name-text">This workflow will become open and can be initiated anonymously</h6>
                                            </ReactTooltip>
                                        ) : null}
                                    </div>
                                    <div className="floating-label col-md-3">
                                        <input
                                            className="open_checkbox"
                                            type="checkbox"
                                            name="isAdminInitiable"
                                            checked={isAdminInitiable}
                                            onChange={this.handleCheckBox}
                                        />
                                        <span className="open_form">
                                            Admin Initiated
                                        </span>
                                        <div className="open_form_info" data-tip data-for="open1">
                                            <i className="glyphicon glyphicon-question-sign open_help" aria-hidden="true" />
                                        </div>
                                        {!isMobile() && (
                                            <ReactTooltip id="open1" place='bottom' delayShow={1000} aria-haspopup='true' className="app_btn_bg_color">
                                                <h6 className="entity_name-text">Allows workflow to be started by an admin.</h6>
                                            </ReactTooltip>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="cancel_publish_btn">
                            <NavLink to="/workflows">
                                <button type="button" className="fancy_btn">Cancel</button>
                            </NavLink>
                            <button type="submit" onClick={this.publishWorkflow} className="fancy_btn active">Publish</button>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    processPermission: state.auth.uiPermissions.processes.manage,
    editWorkflowPermission: state.auth.uiPermissions.organisationworkflow.change
})

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(mapStateToProps, mapDispatchToProps)(ConfigureApp);