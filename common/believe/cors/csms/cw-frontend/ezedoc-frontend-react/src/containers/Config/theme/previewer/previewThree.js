import React, { Component } from "react";

class PreviewThree extends Component {

    render() {
        let buttonStyle = null;

        const imageStyle = {
            margin: '0 auto',
            display: 'block',
            maxWidth: '70px',
            maxHeight: '36px'
        }

        if (this.props.theme) {
            buttonStyle = {
                backgroundImage: `linear-gradient(116deg, ${this.props.theme.first_button_color}, ${this.props.theme.second_button_color})`,
                color: this.props.button_text_color === 'BLACK' ? '#000' : '#fff'
            };

        }

        return (
            <div className="top_nav_btn_previewer">
                <div className="top_nav_btn_head">
                    <div className="col-md-12">
                        <div className="top_nav_icon_first"></div>
                        <div className="top_nav_icon"></div>
                        <div className="top_nav_icon"></div>
                    </div>
                </div>
                <div className="top_nav_btn_body">
                    <div className="top_nav_welcome_message">
                        CEO Message
                    </div>
                    <div className="top_nav_company_text">
                        Welcome to {this.props.orgInfo.name}
                    </div>
                    <div className="body_nav_img_cont">{(this.props.orgInfo.logo) ? <img src={this.props.orgInfo.logo} style={imageStyle} alt="" /> : null}</div>
                    <button className="prev_btn" style={buttonStyle}>Button</button>
                </div>
                <div className="top_nav_btn_footer">
                    <div className="col-md-12">
                        <div className="col-md-3">
                            <div className="pie-wrapper progress-45 style-2">
                                <span className="label">45<span className="smaller">%</span></span>
                                <div className="pie">
                                    <div className="left-side half-circle" style={{ borderColor: this.props.theme.first_primary_color }}></div>
                                    <div className="right-side half-circle"></div>
                                </div>
                                <div className="shadow"></div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="body_nav_footer_text">
                                Onboarding Progress
                            </div>
                        </div>
                        <div className="col-md-5"></div>
                    </div>
                    <button className="prev_btn" style={buttonStyle}>Button</button>
                </div>
            </div>
        )
    }
}

export default PreviewThree;
