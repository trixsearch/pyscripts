import React, { Component } from "react";

import "./portal.css";

class PortalSection extends Component {

    render() {
        let classVar = "app_category_card outer_app_category";
        let borderGrad = "app_category_inner_card";
        if (this.props.id === this.props.clicked) {
            classVar = "app_category_card active";
            borderGrad = "app_category_disable_inner_card";
        }
        return (
            <div onClick={this.props.click} className={classVar}>
                <div className={borderGrad}>
                    <p>
                        <span className="icon-portal-template">
                        </span>
                    </p>
                    <p className="category_card_text">{this.props.name}</p>
                </div>
            </div>
        );
    }

};




export default PortalSection;
