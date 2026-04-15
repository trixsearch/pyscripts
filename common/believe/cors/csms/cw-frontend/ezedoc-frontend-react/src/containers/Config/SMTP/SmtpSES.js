import React, { Component } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { connect } from 'react-redux';

import { 
    sendActivationLink, verify_SES_Activation, saveSesSettings, clearSmtpState, intervalReset 
} from '../../../store/actions';
import FormikInput from '../../../components/UI/FormikInput';
import { Button } from '../../../components/UI/AppButton/AppButton';
import Spinner from '../../../components/UI/Spinner/Spinner';
import { SES_SETTINGS } from '../../../Data/TimeConstants';

class SmtpSes extends Component {

    countDownTimer

    constructor(props) {
        super(props);
        this.state = {
            email: "",
            display_name: "",
            showTimer: false,
            totalTime: SES_SETTINGS.total_time_secs,
            currentTime: { ...SES_SETTINGS.display_time }
        }
    }

    componentDidMount() {
        this.setState({
            email: this.props.ses.email,
            display_name: this.props.ses.display_name
        })
    }

    componentWillUnmount() {
        clearInterval(this.countDownTimer);
        this.props.clearSmtpState();
    }

    timeReducer = () => {
        
        let minutes = parseInt(this.state.totalTime / 60, 10);
        let seconds = parseInt(this.state.totalTime - minutes * 60, 10) || '00';
        
        this.setState(prevState => ({
            totalTime: prevState.totalTime - 1,
            currentTime: {
                mins: `0${minutes}`,
                secs: seconds < 10 && seconds > 0 ? `0${seconds}` : seconds,
            }
        }))
    }
    

    timer = () => {

        this.timeReducer();

        this.countDownTimer = setInterval(() => {

            this.timeReducer();

            if (this.state.totalTime < 0) {
                clearInterval(this.countDownTimer)
                this.props.intervalReset()
                this.setState({
                    totalTime: SES_SETTINGS.total_time_secs,
                    currentTime: { ...SES_SETTINGS.display_time }
                })
            }
        }, 1000);
    }


    handleActivate = (email, display_name) => {
        const orgId = this.props.match?.params?.uuid;

        this.setState({
            email,
            showTimer: true,
            display_name
        })
        this.props.verify_SES_Activation(orgId, email)
        .catch(() => {
            this.timer();
        })
    }

    handleReset = () => {
        this.setState(() => ({
            email: "",
            display_name: "",
            showTimer: false,
            totalTime: SES_SETTINGS.total_time_secs,
            currentTime: { ...SES_SETTINGS.display_time }
        }), () => {
            clearInterval(this.countDownTimer)
        })
        this.props.clearSmtpState();
    }


    handleSubmit = () => {
        const orgId = this.props.match?.params?.uuid;
        this.props.saveSesSettings(orgId, this.state.email, this.state.display_name)
        
        clearInterval(this.countDownTimer)
    }

    render() {
        const { 
            currentTime, totalTime, showTimer 
        } = this.state;
        const {
            loader, is_activated, timeout, showProgress, is_saved
        } = this.props;
        
        const { email, display_name } = this.props.ses

        return (
                <Formik
                    enableReinitialize
                    initialValues={{ email, display_name }}
                    onSubmit={(values) => {
                        this.handleActivate(values.email, values.display_name)
                    }}
                    validationSchema={Yup.object().shape({
                        email: Yup.string()
                            .email("Enter a valid Email address.")
                            .required("Email address can't be empty."),
                        display_name: Yup.string()
                            .required("Display Name Can't be empty.")
                    })}
                >
                    {props => {
                        const {
                            values, touched, errors, resetForm, handleChange, handleBlur, 
                            handleSubmit, dirty
                        } = props;
                        return (
                            <>
                                {loader && (<Spinner />)}
                                <div className="edit_app_detils_form_cont">
                                    <form onSubmit={handleSubmit} noValidate>
                                        <div className="form_up_box">
                                            <FormikInput
                                                name="display_name"
                                                label="Display Name"
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                handleChange={handleChange}
                                                handleBlur={handleBlur}
                                                autoComplete="off"
                                                className="col-md-6"
                                                data-cy="display-name"
                                            />
                                            <FormikInput
                                                name="email"
                                                type="email"
                                                label="Email"
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                handleChange={handleChange}
                                                handleBlur={handleBlur}
                                                autoComplete="off"
                                                className="col-md-6"
                                                data-cy="ses-email"
                                            />
                                            <button
                                                style={{ display: 'block', margin: 4 }}
                                                onClick={handleSubmit}
                                                type="button"
                                                className="fancy_btn active"
                                                disabled={!dirty || (totalTime && showProgress)}
                                            >
                                                Send Activation Link
                                            </button>
                                        </div>
                                    </form>
                                    {(showTimer && !is_saved) && (
                                        <>
                                            <div className="timer-outer-container">
                                                {(totalTime && showProgress) && (
                                                    <div className="timer-main-container">
                                                        <div className="timer-container">
                                                            <div className="timer-container-loader" />
                                                            <div className="timer">
                                                                <span>{currentTime.mins}</span>
                                                                <span>:</span>
                                                                <span>{currentTime.secs}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {is_activated ? (
                                                        <p className="timer-text">
                                                            Your Email id is verfied, you can save
                                                            it by clicking the save button.
                                                        </p>
                                                    ) : (
                                                            <p className="timer-text">
                                                                {timeout
                                                                    ? <span style={{color: 'red'}}>Failed to verify Email id, please try again after sometime.</span>
                                                                    : "An Activation Link has been sent to this email id, click on the link to complete the activation."}
                                                            </p>
                                                        )
                                                }
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="pt-0 cancel_publish_btn">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            this.handleReset()
                                            resetForm()
                                        }}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={this.handleSubmit}
                                        disabled={!is_activated || is_saved}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        )
                    }}
                </Formik>
        );
    }
}

const mapStateToProps = (state) => ({
    loader: state.Smtp.loader,
    is_activated: state.Smtp.is_activated,
    timeout: state.Smtp.timeout,
    showProgress: state.Smtp.showProgress,
    ses: state.Smtp.ses_values,
    is_saved: state.Smtp.is_saved
})

const mapDispatchToProps = (dispatch) => ({
    sendActivationLink: (email) => dispatch(sendActivationLink(this.props.match?.params?.uuid,email)),
    saveSesSettings: (orgId, email, display_name) => dispatch(saveSesSettings(orgId, email, display_name)),
    verify_SES_Activation: (orgId, email) => dispatch(verify_SES_Activation(orgId, email)),
    intervalReset: () => dispatch(intervalReset()),
    clearSmtpState: () => dispatch(clearSmtpState())
})

export default connect(mapStateToProps, mapDispatchToProps)(SmtpSes);