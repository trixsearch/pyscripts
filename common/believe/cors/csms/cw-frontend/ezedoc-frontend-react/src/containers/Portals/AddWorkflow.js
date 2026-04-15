import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

import * as actions from '../../store/actions/index';
import Modal from '../../components/Modal';
import DecisionWorkContent from './DecisionWorkContent';
import "./portal.css"

class AddPortal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
        }
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        this.props.getAllPortal(orgId);
        if(!this.props.workflows){
            this.props.getAllContent(orgId);
        }
    }

    render() {
        let contentOption = []
        let app = this.props.app;
        let workflows = this.props.workflowsData;
        let contents = this.props.contentsData;
        let content = this.props.data;
        app = app && app.filter(e => !workflows.find(m => e.id === m.id))
        content = content && content.filter(e => !contents.find(m => e.id === m.content.id))
        if(content) {
                content.map((e) => {
                contentOption.push({ value: e.id, label: e.name })
                return e
            })
        }
        let categoryOption = [];
        if(app) {
                app.map((e) => {
                categoryOption.push({ value: e.id, label: e.name })
                return e
            })
        }

        return (
            <Modal show={this.props.open} onClose={this.props.close} title={this.props.messageContent}
                primaryBtn={{text: 'Associate', className: 'fancy_btn active', onClick: () => {
                        this.props.create(this.props.workflows)}}}
                secondaryBtn={{ text: "Cancel", className: 'fancy_btn', onClick: this.props.close }}>
                <div className="app_error_msg">
                    {this.props.message}
                </div>
                <div className="addWorkflow-content" style={{ width: '100%' }}>
                    <DecisionWorkContent
                        handleApps={this.props.handleApps}
                        handleContent={this.props.handleContent}
                        categoryOption={categoryOption}
                        contentOption={contentOption}
                        props={this.props} />
                </div>
            </Modal>
        );
    }
};

const mapStateToProps = state => ({
    loading: state.formData.loading,
    app: state.portal.app,
    data: state.portal.content
})

const mapDispatchToProps = dispatch => ({
    getAllPortal: (orgId) => dispatch(actions.listApps(orgId)),
    getAllContent: (orgId) => dispatch(actions.ContentDetail(orgId)),
    portalCreate: (orgId, data, fun) => dispatch(actions.PortalCreateId(orgId, data, fun))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddPortal));
