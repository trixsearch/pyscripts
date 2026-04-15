import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import {
    Link
} from "react-router-dom";
import * as actions from '../../../store/actions/index';
import Carousel from "../../../components/UI/Carousel/Carousel";
import routes from "../../../urls";

import "./app.css";

class AppAdd extends Component {
    constructor(props) {
        super(props);
        this.state = {
            clicked: "",
            name : ""
        }
        this.selectionId = this.selectionId.bind(this);
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        if (this.props.feature) {
            this.props.onCount(orgId);
        }
    }

    selectionId(value, key, id) {
        this.setState({
            clicked: id,
            name : value
        })
    }

    render() {
        const orgId = this.props.match?.params?.uuid;
        let app = `/custom-workflow/org/${orgId}workflows/add/${this.state.clicked}`
        return (
        <Fragment>
            <div>
                <div className="body_nav_button add_workflows_btn">
                    {this.props.permission 
                        ? (
                        <Link to={routes.APP_ADD.to(orgId)}>
                            <button
                                type="button"
                                className={`${this.state.clicked? "fancy_btn" : "fancy_btn active"} ezedox_manage`}
                            >
                                Add more Workflows
                            </button>
                        </Link>
                        ) : <div/>
                    }
                </div>
                <div className="body_nav_config_btn">
                    {this.state.clicked ? (
                        <Link to={app}>
                            <button
                                type="button"
                                className={`${this.state.clicked? "fancy_btn active" : "fancy_btn"} ezedox_manage`}
                            >
                                Configure Workflow
                            </button>
                        </Link>
                    ) : (" ")}
                </div>
                <div className="main_changable_container">
                    <div className="app_btn_container">
                        <div className="app_btn_heading">
                            <p>Manage Installed Workflows</p>
                        </div>
                        <div className="app_all_btn_main_cont">
                            <div className="container container_btn_slide">
                                <div className="row">
                                <div className="col-lg-12">
                                    <Carousel 
                                        section='workflow' 
                                        appName={this.state.name}
                                        appsdata={this.props.data}
                                        selectedApp={this.selectionId}
                                        carouselContentLoader={this.props.data.length === 0}
                                    />
                                </div>
                                </div>
                            </div>
                        </div>
                        {/* -- Do not remove the below commented code -- refers to ->(DE488) */}
                        {/* <div className="">
                            <div className="app_btn_heading">
                                <p>All Cloned Workflows</p>
                            </div>
                            <div className="msg_text">
                                <p>If you cloned any workflow it will appear here</p>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        </Fragment>
        )
    }
} 

const mapStateToProps = state => {
    return {
        loading: state.appSelected.loading,
        data: state.appSelected.data,
        permission: state.auth.uiPermissions.organisationworkflow.add,
        feature: state.auth.uiFeatures.organisationworkflow.view,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        onCount: (orgId) => dispatch(actions.AppListDetails(orgId)),
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(AppAdd);