import React, { Component } from "react";
import ReactTooltip from 'react-tooltip';

import {isMobile} from '../utils';
import { HasAccess } from "../../platformDataStoreContext";
import { CW_SERVICE_PORTAL_UPDATE } from "../../Data/constants";

class WorkFlowSection extends Component {

    render() {
        // let classVar = "app_category_card";
        return (
            <div className="app_category_card outer_app_category">
                <div className="app_category_inner_card">
                    <div className="app_category_assoc_wfls" data-tip data-for={'app_btn_tooltip-' + this.props.id}>
                        <p>
                            <span className={`assoc_wflows_card_icons` + this.props.icon}>
                            </span>
                        </p>
                        <p className="category_card_text">{this.props.name}</p>
                    </div>
                    {this.props.name.length > 15 && !isMobile() ? (
                        <ReactTooltip id={"app_btn_tooltip-" + this.props.id} place="bottom" aria-haspopup='true' className="app_btn_bg_color">
                            <p className="app_title">{this.props.name}</p>
                        </ReactTooltip>
                    ) : null}
                    <HasAccess
                        permissions={[CW_SERVICE_PORTAL_UPDATE]}
                        yes={() => (
                            <div className="view_card_btn published_contents_view_card category_card_btn" style={{ marginTop: '10px' }}>
                                <button onClick={() => this.props.deleteContent('assoc_workflows', this.props.id)} className="install_app_btn" >Disassociate</button>
                            </div>
                        )}
                    />
                </div>
            </div>
        );
    }

};



export default WorkFlowSection;
