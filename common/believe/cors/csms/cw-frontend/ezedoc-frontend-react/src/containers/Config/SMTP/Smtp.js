import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getEmailSettings, createSMTP, saveSesSettings } from '../../../store/actions';
import SmtpCreate from './SmtpCreate';
import SmtpSes from './SmtpSES';
import './Smtp.css';
import '../../Tasks/task.css';
import ErrorPage from '../../ErrorPage';
import Modal from '../../../components/Modal';
import { Button } from '../../../components/UI/AppButton/AppButton';
import Spinner from '../../../components/UI/Spinner/Spinner';


class Smtp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            smtp: {
                email: "",
                encryption: 1,
                host: "",
                is_service_active: false,
                password: "",
                port: "",
                username: "",
            },
            ses: {
                display_name: "",
                email: "",
                is_service_active: false
            },
            via_ses: true,
            via_smtp: false,
            fetch_error: false,
            default_prompt: false,
            prompt_modal: false,
            ses_active: false,
            smtp_active: false
        }
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;

        if (this.props.uiFeatures.smtpsettings.view) {
            this.props.getEmailSettings(orgId).then(res => {
                let default_prompt = !!res.email_settings.ses.email && !!res.email_settings.smtp.email
                this.setState({
                    ses: { ...res.email_settings.ses },
                    smtp: { ...res.email_settings.smtp },
                    ses_active: res.email_settings.ses.is_service_active,
                    smtp_active: res.email_settings.smtp.is_service_active,
                    default_prompt
                })
            }).catch(() => {
                this.setState({
                    fetch_error: true
                })
            })
        }
    }

    handleTabNav = ({ target: { name } }) => {
        this.setState({
            via_ses: name === "via_ses",
            via_smtp: name === "via_smtp"
        })
    }

    handleModal = (state) => {
        this.setState({
            prompt_modal: state
        })
    }

    handleRadio = ({ target: { id } }) => {
        this.setState({
            ses_active: id === "ses_active",
            smtp_active: id === "smtp_active"
        })
    }

    setDefault = () => {
        const orgId = this.props.match?.params?.uuid;

        this.setState({
            prompt_modal: false
        })
        if(this.state.smtp_active) {
        this.props.createSMTP(orgId, {...this.props.smtp, is_service_active: true})
            .then(() => {
                this.setState(prevState => ({
                    smtp: {
                        ...prevState.smtp,
                        is_service_active: true
                    },
                    ses: {
                        ...prevState.ses,
                        is_service_active: false
                    }
                }))
            })
        } else {
            this.props.saveSesSettings(orgId, this.props.ses.email, this.props.ses.display_name)
            .then(() => {
                this.setState(prevState => ({
                    smtp: {
                        ...prevState.smtp,
                        is_service_active: false
                    },
                    ses: {
                        ...prevState.ses,
                        is_service_active: true
                    }
                }))
            })
        }
    }

    render() {
        const {
            via_ses, via_smtp, ses, smtp, fetch_error, default_prompt, prompt_modal,
            smtp_active, ses_active
        } = this.state;
        const { loader } = this.props;
        if (fetch_error) {
            return (<ErrorPage />)
        }
        return (
            <div>
            {loader && (<Spinner />)}
                <div className="main_changable_container">
                    <div className="config_add_group_form">
                        <div className="default-settings-main-cont">
                            <div>
                                {(smtp.is_service_active || ses.is_service_active)
                                    && `Currently active : ${smtp.is_service_active ? 'SMTP Settings' : ''} ${ses.is_service_active ? 'Simple Email Service' : ''}`}
                            </div>
                            {default_prompt && (
                                <Button
                                    variant="fancy_btn active"
                                    onClick={() => this.handleModal(true)}
                                >
                                    Choose Default
                                </Button>
                            )}
                            {prompt_modal && (
                                <Modal
                                    title="Choose Default Email Settings."
                                    show={prompt_modal}
                                    onClose={() => this.handleModal(false)}
                                    primaryBtn={{
                                        className: 'fancy_btn active',
                                        text: "Save",
                                        onClick: this.setDefault
                                    }}
                                    secondaryBtn={{
                                        className: 'fancy_btn',
                                        text: "Cancel",
                                        onClick: () => {
                                            this.handleModal(false)
                                        }
                                    }}
                                >
                                    <div className="modal-radio-main-cont">
                                        <span className="col-md-2"/>
                                        <div className="modal-radio-cont">
                                            <div className="radio-container">
                                                <input className="radio" id="ses_active" type="radio" name="" checked={ses_active} onChange={this.handleRadio} />
                                                <label
                                                    className="radio-label"
                                                    htmlFor="ses_active"
                                                >
                                                    Simple Email Service (Recommended)
                                                </label>
                                            </div>
                                            <div className="radio-container">
                                                <input className="radio" id="smtp_active" type="radio" name="" checked={smtp_active} onChange={this.handleRadio} />
                                                <label
                                                    className="radio-label"
                                                    htmlFor="smtp_active"
                                                >
                                                    SMTP Settings
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </Modal>
                            )}
                        </div>
                        <div className="task-navbar" style={{ margin: '0px 0px 16px' }}>
                            <ul className="nav nav-tabs process_tab_ongoing_comp_ul task-navItem" role="tablist">
                                <li className={via_ses ? "nav-item active" : "nav-item"}>
                                    <button
                                        onClick={this.handleTabNav}
                                        type="button"
                                        className="nav-button"
                                        style={{ cursor: "pointer" }}
                                        name="via_ses"
                                        data-toggle="tab"
                                        data-tab="via_ses"
                                        role="tab"
                                        aria-controls="mytask"
                                        aria-selected="true"
                                    >
                                        Simple Email Service
                                    </button>
                                </li>
                                <li className={via_smtp ? "nav-item active" : "nav-item"} >
                                    <button
                                        onClick={this.handleTabNav}
                                        type="button"
                                        className="nav-button"
                                        style={{ cursor: "pointer" }}
                                        id="mytask-tab"
                                        name="via_smtp"
                                        data-tab="via_smtp"
                                        data-toggle="tab"
                                        role="tab"
                                        aria-controls="mytask"
                                        aria-selected="false"
                                    >
                                        SMTP Settings
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div className={via_smtp ? 'display-none' : ''}>
                            <SmtpSes ses={ses} />
                        </div>
                        <div className={via_ses ? 'display-none' : ''}>
                            <SmtpCreate smtp={smtp} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    ses: state.Smtp.ses_values,
    smtp: state.Smtp.smtp_values,
    loader: state.Smtp.loader,
    uiFeatures: state.auth.uiFeatures,

})

const mapDispatchToProps = (dispatch) => ({
    saveSesSettings: (orgId, email, display_name) => dispatch(saveSesSettings(orgId, email, display_name)),
    createSMTP: (orgId, data) => dispatch(createSMTP(orgId, data)),
    getEmailSettings: (orgId) => dispatch(getEmailSettings(orgId))
})

export default connect(mapStateToProps, mapDispatchToProps)(Smtp);
