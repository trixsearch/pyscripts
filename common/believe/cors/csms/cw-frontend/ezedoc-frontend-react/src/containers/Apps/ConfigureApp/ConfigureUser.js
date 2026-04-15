import React, { Component } from "react";
import "./configure.css"
import axios from "axios";
import ReactTooltip from 'react-tooltip';

import PermissionEdit from "./PermissionEdit"
import { Button } from "../../../components/UI/AppButton/AppButton";
import {GetCheckedValue} from "./utils"

class ConfigUserApp extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selected: "",
            model: false,
            permission: this.props.permission,
        }
    }

    save = () => {
        let data = {
            "workflow_permissions": this.state.permission
        }
        if (this.props.identity === "user") {
            let id = this.state.selected.id
            let url = `/api/permissions/org_users/${id}`;
            axios.patch(url, data).then(() => {
            }).catch(err => {
                console.log(err)
            }).finally(() => {
                this.setState({
                    model: false
                })
            })
        } else {
            let id = this.state.selected.id
            let url = `/api/permissions/org_groups/${id}`;
            axios.patch(url, data).then(() => {
            }).catch(err => {
                console.log(err)
            }).finally(() => {
                this.setState({
                    model: false
                })
            })
        }
    }

    checked = (event) => {
        let name = event.target.name;
        let checked1 = event.target.checked
        let permission = this.state.permission;
        permission[name] = checked1
        permission = GetCheckedValue(permission)
        this.setState(() => ({
            permission
        }))
    }
    close = () => {
        this.setState(prevState => ({
            model: !prevState.model
        }))
    }

    permissionEdit = () => {
        this.setState({
            model: true,
            selected: this.props.data,
        })
    }

    render() {
        const { click, data, permission, name } = this.props;
        const { model, selected } = this.state;

        const CheckBox = ({ name, text, checked }) => {
            const handleCheck = () => {
                click(data, name)
            }
            return (
                <div className="col_box edit_checkbox_body">
                    <div className="squaredThree">

                        <input
                            type="checkbox"
                            name={name}
                            disabled
                            checked={checked || (text ? permission[text] : permission[name])}
                            onChange={handleCheck}
                        />
                    </div>
                </div>
            )
        }

        return (
            <div className="row_box_body ">
                <div className="row_box">
                    <div className="col_box edit_checkbox_body">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span data-tip data-for={`${this.props.id}`} className="overflow-text">
                                {this.props.name}
                            </span>
                            <ReactTooltip id={this.props.id} place='bottom' delayShow={1000} aria-haspopup='true' className="app_btn_bg_color">
                                <span>{this.props.name}</span>
                            </ReactTooltip>
                            <span data-tip data-for={`${this.props.email}`} className="overflow-text">
                                {this.props.email}
                            </span>
                            <ReactTooltip id={this.props.email} place='bottom' delayShow={1000} aria-haspopup='true' className="app_btn_bg_color">
                                <span style={{fontSize: 12}}>{this.props.email}</span>
                            </ReactTooltip>
                        </div>
                    </div>
                    <CheckBox name="view" text="View" />
                    <CheckBox name="reassign" text="Reassign" />
                    <CheckBox name="withdraw" text="Withdraw" />
                    <CheckBox name="BulkEmail" text="BulkEmail" />
                    <CheckBox name="initiate" text="Initiate" checked />
                    <CheckBox name="ViewReport" />
                    <CheckBox name="UploadDocument" />
                    <CheckBox name="DownloadReport" />
                    <Button
                        variant="table_btn edit ezedox_user_edit"
                        onClick={this.permissionEdit}
                        icon="icon icon-edit"
                        disabled
                    >
                        Edit
                    </Button>
                    <PermissionEdit
                        save={this.save}
                        name={data.user ? `User : ${name}` : `Group : ${name}`}
                        open={model}
                        data={selected}
                        checked={this.state.permission}
                        close={this.close}
                        click={this.checked}
                    />
                </div>
            </div>
        );
    }
}

export default ConfigUserApp;
