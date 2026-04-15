import React, { Component } from "react";
import Modal from 'react-responsive-modal';
import Select from 'react-select';
import { withRouter } from "react-router-dom";
import "./portal.css"
import { connect } from "react-redux";
import * as actions from '../../store/actions/index';


class AddContent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
        }
    }
    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        this.props.getAllPortal(orgId);
        this.props.getAllContent(orgId);
    }
    render() {
        let contentOption = []
        this.props.data && this.props.data.map((e) => {
            contentOption.push({ value: e.id, label: e.name })
        })
        let categoryOption = [];
        this.props.app && this.props.app.map((e) => {
            categoryOption.push({ value: e.id, label: e.name })
        })

        const customStyles = {
            input: (styles) => {
                return {
                    ...styles,
                    height: 33,
                }
            },
            menu: (styles) => {
                return {
                    ...styles,
                    maxHeight: 'auto',
                    'overflow-y': 'auto',
                    position: 'relative'
                };
            },
            menuList: styles => {
                return {
                  ...styles,
                  maxHeight: "unset",
                };
            },
        }

        return (
            <Modal open={this.props.open} onClose={this.props.close} center>
                <div className="model-head">
                    <div className="model-body">
                        <div className="main_changable_container">
                            <div className="app_category_cont">
                                <div className="edit_app_detils_form_cont ezedox_portal">
                                    <form className="form_up_box">
                                        <div className="row col-md-12 m-0">
                                            <div className="floating-label col-md-12">
                                                <div style={{ width: '100%' }}>
                                                    <Select
                                                        isClearable={false}
                                                        isMulti={true}
                                                        styles={customStyles}
                                                        placeholder='Contents'
                                                        onChange={this.handleApps}
                                                        options={categoryOption} />
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                    <div className="text_editor_btn_cont">
                                        <button onClick={this.portalCreate} className="fancy_btn">Create</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>



        );
    }

};
const mapStateToProps = state => {
    return {
        loading: state.formData.loading,
        app: state.portal.app,
        data: state.portal.content
    }
}
const mapDispatchToProps = dispatch => {
    return {
        getAllPortal: (orgId) => dispatch(actions.listApps(orgId)),
        getAllContent: (orgId) => dispatch(actions.ContentDetail(orgId)),
        portalCreate: (orgId, data, fun) => dispatch(actions.PortalCreateId(orgId, data, fun))
    }

}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddContent));
