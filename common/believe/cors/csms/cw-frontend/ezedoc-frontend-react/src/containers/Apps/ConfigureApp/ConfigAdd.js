import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import AsyncSelect from 'react-select/async';
import { withRouter } from "react-router-dom";

import Modal from '../../../components/Modal';
import Permission from "./Permission";
import "./configure.css";
import { customStyles } from "../../Config/Utils/ReactSelectStyles";
import { handleUserSearch, handleGroupSearch, DropdownIndicator } from '../../Config/Utils/ConfigUtils';
import {GetCheckedValue} from "./utils";
import { addToast } from '../../../components/Toast/actions';

class ConfigureAdd extends Component {
    constructor(props) {
        super(props)
        this.state = {
            users: [],
            groups: [],
            options: [],
            value: "user",
            user: true,
            group: false,
            identify: "user",
            selectedOption: "",
            permAddModal: false,
            checked: {
                "View": false,
                "BulkEmail": false,
                "Initiate": true,
                "Withdraw": false,
                "Reassign": false,
                "ViewReport": false,
                "DownloadReport": false,
                "UploadDocument": false
            }
        }
    }

    handleCheck = (event) => {
        let name = event.target.name;
        let checked1 = event.target.checked
        let permission = this.state.checked;
        permission[name] = checked1
        permission = GetCheckedValue(permission)
        this.setState(() => ({
            checked: permission
        }))
    }

    selectUser = (data) => {
        this.setState({
            userId: data.id,
            userSelected: data,
            permission: true,
            users: [],
            groups: []
        })
    }

    handleSelect = (option) => {
        this.setState({
            selectedOption: option,
            permission: true,
            userId: option.value
        })
    }

    handleRadio = ({ target }) => {
        if (target.name === 'user')
            this.setState(prevState => ({
                user: true,
                group: false,
                identify: "user",
                options: prevState.users,
                selectedOption: "",
                checked: {
                    "View": false,
                    "BulkEmail": false,
                    "Initiate": true,
                    "Withdraw": false,
                    "Reassign": false,
                    "ViewReport": false,
                    "DownloadReport": false,
                    "UploadDocument": false
                },
            }))
        else if (target.name === 'group') {
            this.setState(prevState => ({
                user: false,
                group: true,
                identify: "group",
                options: prevState.groups,
                selectedOption: "",
                checked: {
                    "View": false,
                    "BulkEmail": false,
                    "Initiate": true,
                    "Withdraw": false,
                    "Reassign": false,
                    "ViewReport": false,
                    "DownloadReport": false,
                    "UploadDocument": false
                },
            }))
        }
    }

    handleAddModal = () => {
        this.setState(prevState => ({
            permAddModal: !prevState.permAddModal,
            selectedOption: "",
            identify: "user",
            user: true,
            group: false,
            checked :{
                "View": false,
                "BulkEmail": false,
                "Initiate": true,
                "Withdraw": false,
                "Reassign": false,
                "ViewReport": false,
                "DownloadReport": false,
                "UploadDocument": false
            }
        }))
    }

    handleSaveUsers = (id, permissions, identity) => {
        if (identity === "user") {
            let userData = {
                "app": this.props.id,
                "user": id,
                "workflow_permissions": permissions
            }
            axios.post(`/api/permissions/org_users`, userData)
                .then(() => {
                    this.setState(() => ({
                        users: true,
                        groups: false,
                        permAddModal: false
                    }))
                })
                .catch(err => {
                    let message = err.response ? err.response.data.message : "Failed to add permissions"
                    this.props.addToast('error', 'Error', message)
                    this.setState({
                        permAddModal: false
                    })
                }).finally(() => {
                    this.props.update();
                })
                
        } else if (identity === "group") {
            let userData = {
                "app": this.props.id,
                "group": id,
                "workflow_permissions": permissions
            }
            axios.post(`/api/permissions/org_groups`, userData)
                .then(() => {
                    this.setState(() => ({
                        users: true,
                        groups: false,
                        permAddModal: false
                    }))
                })
                .catch(err => {
                    let message = err.response ? err.response.data.message : "Falied to add permissions"
                    this.props.addToast('error', 'Error', message)
                    this.setState({
                        permAddModal: false
                    })
                }).finally(() => {
                    this.props.update();
                })
        }
    }


    render() {
        const {
            selectedOption, checked, identify, user, group, permAddModal
        } = this.state;
        const orgId = this.props.match?.params?.uuid;

        return (
            <div className="body_nav_button">
                <button
                    type="button"
                    onClick={this.handleAddModal}
                    className="table_btn edit"
                    disabled
                >
                    <span className="icon_edit icon-edit" />
                    <span>Add</span>
                </button>
                {permAddModal && (
                    <Modal
                        show={permAddModal}
                        onClose={this.handleAddModal}
                        title="Add a new User or Group"
                        primaryBtn={{
                            text: "Save",
                            className: "fancy_btn active",
                            onClick: () => this.handleSaveUsers(selectedOption.value, checked, identify)
                        }}
                        secondaryBtn={{ text: "Cancel", className: "fancy_btn", onClick: this.handleAddModal }}
                    >
                        <div className="config-add-modal-body">
                            <div className="config-add-modal-container">
                                <div className="user-group-radio-container" >
                                    <div>
                                        <input type="radio" name="user" id="user" value={user} checked={user} onChange={this.handleRadio} />
                                        <label htmlFor="user" className="ezedox_model_label">User</label>
                                    </div>
                                    <div>
                                        <input type="radio" name="group" id="group" value={group} checked={group} onChange={this.handleRadio} />
                                        <label htmlFor="group" className="ezedox_model_label">Group</label>
                                    </div>
                                </div>
                                <div className="config-add-react-select">
                                    <AsyncSelect
                                        noOptionsMessage={() => null}
                                        components={{ DropdownIndicator }}
                                        value={selectedOption}
                                        placeholder={`Search for ${identify}`}
                                        styles={customStyles}
                                        loadOptions={identify === 'user' ? (text) => handleUserSearch(orgId, text) : (text) => handleGroupSearch(orgId, text)}
                                        onChange={this.handleSelect}
                                    />
                                </div>
                            </div>
                            <p className="config-add-permission">Permissions</p>
                            <Permission click={this.handleCheck} checked={checked} />
                        </div>
                    </Modal>
                )}
            </div>
        )
    }
}

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default withRouter(connect(null, mapDispatchToProps)(ConfigureAdd));
