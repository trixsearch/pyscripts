import React, { Component } from "react";

class PreviewOne extends Component {
    render() {
        let workflowStyle = null;
        let ongoingStyle = null;
        let buttonStyle = null;

        if (this.props.theme) {
            workflowStyle = {
                backgroundImage: `linear-gradient(116deg, ${this.props.theme.first_primary_color}, ${this.props.theme.second_primary_color})`,
                color: 'white'
            };
            ongoingStyle = {
                color: "#000a12",
                borderColor: "blue"
            };
            buttonStyle = {
                backgroundImage: `linear-gradient(116deg, ${this.props.theme.first_button_color}, ${this.props.theme.second_button_color})`,
                color: this.props.button_text_color === 'BLACK' ? '#000' : '#fff'
            };
        }

        return (
            <div className="nav_side_previewer">
                <div className="previewer_mai_body">
                    <div className="previewer_side">
                        <div className="config_text">
                            Config
                        </div>
                        <div className="theme_text" style={{ "color": this.props.theme.first_primary_color }}>
                            Themes
                        </div>
                    </div>
                    <div className="previewer_body">
                        <div className="body_nav_indicater">
                            <span className="icon-corner_path out_a"></span>
                            <div>
                                <span className="space_btw" style={{ color: this.props.theme.first_primary_color }}>Dashboard</span>
                            </div>
                        </div>
                        <div className="all_workflows_cont">
                            <div className="all_workflows_text">All Workflows</div>
                            <div className="all_workflows_card" style={workflowStyle}>
                                Employee Onboarding
                            </div>
                            <div className="all_workflows_ongoing_prs_card">
                                <p className="all_workflows_o_p_text" style={ongoingStyle}>Ongoing Process</p>
                                <p className="all_workflows_o_p_count">5</p>
                            </div>
                        </div>
                        <button className="prev_btn" style={buttonStyle}>Button</button>
                    </div>
                </div>
            </div>
        )
    }
}

export default PreviewOne;
