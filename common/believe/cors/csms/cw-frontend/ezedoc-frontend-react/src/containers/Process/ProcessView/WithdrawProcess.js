import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../../store/actions/index";
import Withdraw from '../../../components/UI/Withdraw';
import {withRouter } from "react-router-dom";

class WithdrawProcess extends Component {
    state = {
        show: false,
    }

    handleShow = () => {
        this.setState({
            show: true
        });
    }

    handleClose = () => {
        this.setState({
            show: false
        })
    }

    handleSave = (comment) => {
        const orgId = this.props.match?.params?.uuid;
        this.props.withdrawProcess(this.props.id, comment, this.props.page, this.props.processKey, this.props.pageSize, this.props.history, orgId)
    }

    render() {
        return (
            <div className="withdraw">
                <button type="button" className="action-task" onClick={this.handleShow}>
                    <div className="menuItemImageContainer">
                        <span className="processImage icon-withdraw" />
                    </div>
                    <div className="menuItemTextContainer">
                        <div className="headerRow">Withdraw</div>
                    </div>
                </button>
                {this.state.show && (
                    <Withdraw
                        show={this.state.show}
                        handleClose={this.handleClose}
                        title="Withdraw process"
                        handleSave={this.handleSave}
                    />
                )}
            </div>
        );
    }
}

const mapDispatchToProps = {
    withdrawProcess: actions.withdrawProcess,
}

export default withRouter(connect(null, mapDispatchToProps)(WithdrawProcess));