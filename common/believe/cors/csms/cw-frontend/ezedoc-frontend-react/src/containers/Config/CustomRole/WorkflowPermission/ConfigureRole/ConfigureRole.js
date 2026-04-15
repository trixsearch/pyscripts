import React, { Component } from "react";
import { connect } from "react-redux";
import "./ConfigureRole.css"
import axios from "axios";
import ReactTooltip from 'react-tooltip';
import { withRouter } from "react-router-dom";

import PermissionEditModal from "./PermissionEditModal";
import { Button } from "../../../../../components/UI/AppButton/AppButton";
import {GetCheckedValue} from "../../utils";
import { addToast } from '../../../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

class ConfigureRole extends Component {

    constructor(props) {
        super(props);
        this.state = {
            model: false,
            permission: this.props.permission,
            id: this.props.id
        }
    }

    save = (id, roleId, appId) => {
        let url = `${APP_URL}/${this.props.match?.params?.uuid}/permissions/org_roles_permissions`;
        let data = {
            workflow_permissions: this.state.permission,
        }
        // if id is undefined, we make a post call to create the object
        if(id) {
            url += `/${id}`;
            axios.put(url,data).then((response)=>{
                this.props.addToast('success', 'Success', response.data.message)
            }).catch((error)=>{
                this.props.addToast('error', 'Error', error.response.data.message)
            }).finally(()=>{
                this.setState({model: false});
            })
        }else{
            data.role=roleId;
            data.app=appId
            axios.post(url,data).then((response)=>{
                this.props.addToast('success', 'Success', response.data.message)
                this.setState({id: response.data.data.id})
            }).catch((error)=>{
                this.props.addToast('error', 'Error', error.response.data.message)
            }).finally(()=>{
                this.setState({model: false});
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
            model: !prevState.model,
        }))
    }

    permissionEdit = () => {
        this.setState({
            model: true,
        })
    }

    render() {
        const { 
             data, permission, name, roleId, editDisabled
        } = this.props;
        const { model, id } = this.state;
        const appId = data.appId;
        const CheckBox = ({ name: checkboxName }) => {
            let isChecked = false;
            if (data.workflow_permission && checkboxName in data.workflow_permission) {
                isChecked = data.workflow_permission[checkboxName]
            }
            return (
                <div className="col_box edit_checkbox_body">
                    <div className="squaredThree">

                        <input
                            type="checkbox"
                            name={checkboxName}
                            disabled
                            checked={isChecked}
                        />
                    </div>
                </div>
            )
        }

        return (
            <div className="row_box_body configure_role">
                <div className="row_box" style={{display: 'flex', alignItems: 'center'}}>
                    <div className="col_box edit_checkbox_body">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span data-tip data-for={`${this.props.id}`}>
                                {this.props.name}
                            </span>
                            <ReactTooltip id={this.props.id} place='bottom' delayShow={1000} aria-haspopup='true' className="app_btn_bg_color">
                                <span>{this.props.name}</span>
                            </ReactTooltip>
                        </div>
                    </div>
                    <CheckBox name="View" text="View" />
                    <CheckBox name="Reassign" text="Reassign" />
                    <CheckBox name="Withdraw" text="Withdraw" />
                    <CheckBox name="BulkEmail" text="BulkEmail" />
                    <CheckBox name="Initiate" text="Initiate" checked />
                    <CheckBox name="UploadDocument" />
                    {this.props.rolePermission.change && (
                        <div className="col_box">
                            <Button
                                variant="table_btn edit ezedox_user_edit"
                                onClick={this.permissionEdit}
                                icon="icon icon-edit"
                                disabled={editDisabled}
                            >
                                Edit
                            </Button>
                        </div>
                    )}
                    <PermissionEditModal
                        save={()=>this.save(id, roleId, appId)}
                        name={`App : ${name}`}
                        open={model}
                        checked={permission}
                        close={this.close}
                        click={this.checked}
                    />
                </div>
            </div>
        );
    }
}


const mapStateToProps = (state) => ({
    rolePermission: state.auth.uiPermissions.organisationroleapppermissions,
})

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ConfigureRole));
