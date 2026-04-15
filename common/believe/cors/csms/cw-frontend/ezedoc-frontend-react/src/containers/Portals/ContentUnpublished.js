import React from "react";
import {
    Link
} from "react-router-dom";
import { HasAccess } from "../../platformDataStoreContext";
import "./portal.css";
import { CW_SERVICE_CONTENT_DELETE, CW_SERVICE_CONTENT_UPDATE } from "../../Data/constants";

function ContentUnpublish(props) {

        const orgId = props.match.params.uuid;

        let url = `/custom-workflow/org/${orgId}/content/edit/${props.id}`

        return (
            <div className="app_showing_card portal_view_card">
                <div className="message_heading">
                    <p>
                        <span>{props.name}</span>
                        <HasAccess
                            permissions={[CW_SERVICE_CONTENT_UPDATE]}
                            yes={() => (
                                <Link to={url}>
                                    <span className="icon-edit" />
                                </Link>
                            )}
                        />
                        <HasAccess
                            permissions={[CW_SERVICE_CONTENT_DELETE]}
                            yes={() => (
                                <span 
                                    onClick={props.delete}
                                    role="presentation"
                                    className="delete-content"
                                >
                                    <img src={require('../../assets/images/svg/delete.svg')} />
                                </span>
                            )}
                        />
                    </p>
                </div>
                <div className="descrip_view_card">
                    <p className="category_card_text">{props.description}</p>
                </div>
                <div className="view_card_btn published_contents_view_card">
                <HasAccess
                    permissions={[CW_SERVICE_CONTENT_UPDATE]}
                    yes={() => (
                        <div className="view_card_btn published_contents_view_card">
                            <button type='button' onClick={props.click} className="install_app_btn">Publish</button>
                        </div>         
                    )}
                />
                </div>
            </div>

        );

}


export default ContentUnpublish
