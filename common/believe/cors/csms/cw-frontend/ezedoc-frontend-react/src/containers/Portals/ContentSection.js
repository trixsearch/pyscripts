/* eslint-disable react/button-has-type */
import React, { Component } from "react";
import {
    Link
} from "react-router-dom";
import "./portal.css";
import { HasAccess } from "../../platformDataStoreContext";
import { CW_SERVICE_CONTENT_UPDATE } from "../../Data/constants";
// const APP_URL = process.env.REACT_APP_APP_URL;

// eslint-disable-next-line react/prefer-stateless-function
class ContentSection extends Component {

    render() {
        const orgId = this.props.match.params.uuid;
        let url = `/custom-workflow/org/${orgId}/content/edit/${this.props.id}`
        return (
            <div className="app_showing_card portal_view_card">
                <div className="message_heading">
                    <p>
                        <span>{this.props.name}</span>
                        <HasAccess
                            permissions={[CW_SERVICE_CONTENT_UPDATE]}
                            yes={() => (
                                <Link to={url}>
                                    <span className="icon-edit" />
                                </Link>
                            )}
                        />
                    </p>
                </div>
                <div className="descrip_view_card">
                    <p className="category_card_text">{this.props.description}</p>
                </div>
                <HasAccess
                    permissions={[CW_SERVICE_CONTENT_UPDATE]}
                    yes={() => (
                        <div className="view_card_btn published_contents_view_card">
                            <button onClick={this.props.click} className="install_app_btn">Unpublish</button>
                        </div>         
                    )}
                />
            </div>

        );
    }

}

export default ContentSection
