import React, { Component } from "react";
import PreviewOne from './previewOne';
import PreviewTwo from './previewTwo';
import PreviewThree from './previewThree';


class PreviewMain extends Component {
    render() {
        return (
            <div className="display_document_box">
                <div className="app_category_head">
                    <p>Previewer</p>
                </div>
                <div className="previewer_container">
                    <PreviewOne theme={this.props.theme} button_text_color={this.props.button_text_color} />
                    <PreviewTwo theme={this.props.theme} button_text_color={this.props.button_text_color} />
                    <PreviewThree theme={this.props.theme} orgInfo={this.props.orgInfo} button_text_color={this.props.button_text_color} />
                </div>
            </div>
        )
    }
}

export default PreviewMain;