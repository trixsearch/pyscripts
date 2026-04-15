import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

import { getRegexErrorMessage, validator } from "containers/utils";
import * as actions from '../../store/actions/index';
import "./portal.css";

class PortalAdd extends Component {
    constructor(props) {
        super(props)
        this.state = {
            name: "",
            description: "",
            message: ""
        }
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        this.props.getAllPortal(orgId);
    }

    portalCreate = () => {
        const orgId = this.props.match?.params?.uuid;
        let data = {
            "name": this.state.name,
            "description": this.state.description
        }
        if (this.state.name === "" || this.state.description === "") {
            this.setState({
                message: "Enter the mandatory field"
            })
        } else {
            this.props.portalCreate(orgId, data, this.props.portalClose());
        }
    }

    portalName = (event) => {
        this.setState({ name: event.target.value, message: '' })
    }

    portalDecription = (event) => {
        this.setState({ description: event.target.value, message: '' })
    }

    render() {
        const { name, message } = this.state
        const nameValidator = validator(name)
        return (
            <>
                <div className="main_changable_container">
                    <div className="app_category_cont">
                        <div className="edit_app_detils_form_cont ezedox_portal add-portal-window">
                            <div className='error-message-element' style={{color: 'red', fontSize: '14px', padding: '10px 0 0 63px'}}>
                                {message || null}
                            </div>
                            <form className="form_up_box">
                                <div className="row col-md-12 m-0">
                                    <div className="floating-label col-md-6">
                                        <input 
                                            type="text" 
                                            value={name} 
                                            onChange={this.portalName} 
                                            className="floating-input" 
                                            style={nameValidator ? {borderColor: '#d0021b', color: '#d0021b'} : {}}
                                        />
                                        <label>Portal Name</label>
                                        <span className='error-message-element' style={{color: 'red', fontSize: '14px'}}>
                                            {nameValidator ? getRegexErrorMessage('portal name') : null}
                                        </span>
                                    </div>
                                    <div className="floating-label col-md-6">
                                        <input onChange={this.portalDecription} value={this.state.description} className="floating-input" type="text" />
                                        <label>Portal description</label>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="cancel_publish_btn">
                        <button type="button" onClick={this.props.portalClose} className="fancy_btn cancel_button">Cancel</button>

                        <button type="button" disabled={nameValidator} onClick={this.portalCreate} className="fancy_btn active">Create</button>
                    </div>
                </div>
            </>
        )
    }

}

const mapStateToProps = state => ({
    loading: state.formData.loading,
    app: state.portal.app,
    data: state.portal.content
})

const mapDispatchToProps = dispatch => ({
    getAllPortal: (orgId) => dispatch(actions.listApps(orgId)),
    portalCreate: (orgId, data, fun) => dispatch(actions.PortalCreateId(orgId, data, fun))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PortalAdd));
