import React, { Component, Fragment, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { connect, useDispatch } from "react-redux";

import Content from "./ContentData"
import * as actions from '../../store/actions/index';
import { Button } from "../../components/UI/AppButton/AppButton";
import { HasAccess } from "../../platformDataStoreContext";

import "./portal.css";
import { CW_SERVICE_CONTENT_CREATE, CW_SERVICE_CONTENT_VIEW } from "../../Data/constants";
import UnauthorizedPage from "../UnauthorizedPage";

class Contents extends Component {

    render() {
        const orgId = this.props.match?.params?.uuid;

        return (
            <Fragment>
                <div className="body_nav_button">
                    <HasAccess
                        permissions={[CW_SERVICE_CONTENT_CREATE]}
                        yes={() => (
                            <Link to={`/custom-workflow/org/${orgId}/config/contents/create`} className="fancy_btn active ezedox_link">Create Content</Link>
                        )}
                    />
                </div>
                <HasAccess
                    permissions={[CW_SERVICE_CONTENT_VIEW]}
                    yes={() => (
                        <ContentsData data={this.props.data} />
                    )}
                    no={() => (<UnauthorizedPage />)}
                />
            </Fragment>
        )
    }
}

const ContentsData = props => {
    const dispatch = useDispatch();
    const { uuid: orgId } = useParams();

    useEffect(() => {
        if(orgId){
            dispatch(actions.ContentDetails(orgId))
        }
    }, [dispatch, orgId])

    if (props.data.length === 0) {
        return (
            <div className="main_changable_container">
                <div className="config_portals_no_data">
                    <p>
                        There is no content to show. Start creating new one.
                        <Button variant="link">Add New</Button>
                        !
                    </p>
                </div>
            </div>
        );
    }
    return <Content data={props.data} />;
};


const mapStateToProps = state => {
    return {
        data: state.content.data,
    }
}


export default connect(mapStateToProps)(Contents);
