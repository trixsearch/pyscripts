import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { HasAccess } from "../../platformDataStoreContext";
import UnauthorizedPage from "../UnauthorizedPage";

import PortalData from "./PortalData"
import * as actions from '../../store/actions/index';
import AddPortal from './AddPortal'
import "./portal.css";
import { CW_SERVICE_CONTENT_CREATE, CW_SERVICE_PORTAL_CREATE, CW_SERVICE_PORTAL_VIEW } from "../../Data/constants";

class PortalDescription extends Component {
    componentDidMount() {
        this.props.getAllPortal(this.props.match?.params?.uuid);
    }

    render() {
        const orgId = this.props.match?.params?.uuid;

        return (
            <HasAccess
                permissions={[CW_SERVICE_PORTAL_VIEW]}
                yes={() => (
                    <Portals
                        data={this.props.data}
                        orgId={orgId}
                    />
                )}
                no={() => (
                    <UnauthorizedPage />
                )}
            />
        )
    }

}
class Portals extends Component {
    constructor(props) {
        super(props);
        this.state = {
            portalCreate: false
        };
        this.portalCreate = this.portalCreate.bind(this);
    }

    portalCreate() {
        this.setState(prevState => ({
            portalCreate: !prevState.portalCreate
        }));
    }

    render() {
        if (this.state.portalCreate === false) {
            return (
                <div style={{ marginTop: '-5px' }}>
                    <div className="body_nav_button" style={{ marginTop: '6px' }}>
                    <HasAccess
                        permissions={[CW_SERVICE_CONTENT_CREATE]}
                        yes={() => (
                            <Link to={`/custom-workflow/org/${this.props.orgId}/config/contents/create`} className="fancy_btn active ezedox_link">Create Content</Link>
                        )}
                    />
                    <HasAccess
                        permissions={[CW_SERVICE_PORTAL_CREATE]}
                        yes={() => (
                            <button type="button" onClick={this.portalCreate} className="fancy_btn create_portal_btn">Create Portal</button>
                        )}
                    />
                    </div>
                    <PortalInfo data={this.props.data} portalCreate={this.portalCreate} />
                </div>
            );
        } 
        return (
            <HasAccess
                permissions={[CW_SERVICE_PORTAL_CREATE]}
                yes={() => (
                    <AddPortal portalClose={this.portalCreate} />
                )}
            />
        )
    }
}


const PortalInfo = (props) => {
    if (props.data.length === 0) {
        return (
            <div className="main_changable_container">
                <div className="config_portals_no_data">
                    <p>
                        Nothing to show. Let’s start one by 
                        <button className="appear-like-link" type="button" onClick={props.portalCreate}>Add New</button>
                    </p>
                </div>
            </div>
            )
    }
    return (<PortalData data={props.data} />)
}

const mapStateToProps = state => ({
    loading: state.formData.loading,
    data: state.portal.data,
})

const mapDispatchToProps = dispatch => ({
    getAllPortal: (orgId) => dispatch(actions.PortalDetails(orgId)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PortalDescription));