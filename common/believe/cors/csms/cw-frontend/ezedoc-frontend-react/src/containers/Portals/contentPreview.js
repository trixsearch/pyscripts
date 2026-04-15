import React, { Component } from "react";
import Modal from 'react-responsive-modal';
import "./portal.css";
import QuillEditior from "./Quil_Editor"


class ContentPreview extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            modalForDesktopView: true
        }
        this.showForDesktopView = this.showForDesktopView.bind(this);
        this.showForMobileView = this.showForMobileView.bind(this);
    }

    showForDesktopView() {
        this.setState({ modalForDesktopView: true });
    }
    showForMobileView() {
        this.setState({ modalForDesktopView: false });
    }

    render() {
        // if (this.props.preview === true) {
        let modalView = (this.state.modalForDesktopView) ? "model-head main_content_cont_head for_destop_view" : "model-head main_content_cont_head for_mobile_view";
        return (
            <Modal open={this.props.preview} onClose={this.props.close} center>
                <div className={modalView}>
                    <div className="col-md-12">
                        <div className="col-md-6"><h4 className="modal-title">Preview</h4></div>
                        <div className="col-md-6">
                            <div className="col-md-offset-6" style={{ margin: "auto", textAlign: "center", marginTop: "7px" }}>
                                <span onClick={this.showForDesktopView} className="icon-desktop_preview"></span>
                                <span onClick={this.showForMobileView} className="icon-smartphone_preview"></span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="model-body main_changable_content_cont">
                            <QuillEditior preview={this.props.preview} text={this.props.text} />
                        </div>
                    </div>
                </div>
            </Modal>
        );
        // } else {
        //     return (
        //         <Modal open={this.props.preview} onClose={this.props.close} center>
        //             <div className="model-head main_content_cont_head">
        //                 <div className="model-body main_changable_content_cont">
        //                     <h4 className="modal-title">Preview</h4>
        //                     <QuillEditior preview={this.props.preview} text={this.props.text} />
        //                 </div>
        //             </div>
        //         </Modal>
        //     );
        // }
    }

};


export default ContentPreview;
