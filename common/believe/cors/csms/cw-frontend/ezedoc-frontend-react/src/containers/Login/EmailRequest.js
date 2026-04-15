import React from "react";
import { connect } from "react-redux";
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useParams } from "react-router-dom";

import FormikInput from '../../components/UI/FormikInput';
import * as actions from '../../store/actions/index';
import Spinner from "../../components/UI/Spinner/Spinner";

import '../Auth.css';
import './loginStyles.css';

const EmailRequest = (props) => {

 const {
    error,
    success,
    loading, 
    orgLogo, 
    orgName,
    message,
    showOrgName,
    emailForPassword, 
    } = props;

    const { uuid: orgId } = useParams();

    const submitHandler = (email) => {
        emailForPassword(orgId, email);
    }

    let createOrglogo = null;
    let oranameVar = null;
    let characterZero = null;
    if (orgName) {
        oranameVar = orgName;
        characterZero = oranameVar.charAt(0);

    }
    if (!orgLogo) {
        createOrglogo = (
            <div className="login-tenant-no-logo">
                <span className="noLogo-class">{characterZero}</span>
                <span>{orgName}</span>
            </div>
        )
    } else if (orgLogo && !showOrgName) {
        createOrglogo = (<img className="logo" src={orgLogo} alt="" />)
    } else if (orgLogo && showOrgName) {
        createOrglogo = (
            <span className="brand_logo text-change">
                <img src={orgLogo} alt="" />
                {orgName}
            </span>
        )
    }

    let errorMessage = null;
    if (error) {
        errorMessage = <p className="invalid_message">{error}</p>
    }
    let form = (
        <>
            <div className="forget_text_heading">
                <p>Forgot Your Password?</p>
                <p className="sub_text">
                    Type your Email ID below and we will send you a mail to reset your password.
                </p>
            </div>
            {errorMessage}
            <ForgotPasswordForm handleSubmit={submitHandler} />
        </>
    )

    if (loading) {
        form = (
            <Spinner />
        );
    }

    if (success) {
        form = (
            <div className="forget_text_heading">
                <p> Completed Successfully</p>
                <p className="sub_text">{message}</p>
                <p>Thank you</p>
            </div>
        )
    }

    return (
        <div className="login_main_body_container">
            <div className="login_body_container forgot_pass_background">
                <div className="sign_in_up_box">
                    <div className="login_logo">
                        {createOrglogo}
                    </div>
                    {form}
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = (state) => ({
    loading: state.emailReq.loading,
    message: state.emailReq.message,
    error: state.emailReq.error,
    success: state.emailReq.success,
    orgLogo: state.orgLogo.logo,
    orgName: state.orgLogo.name,
    showOrgName: state.orgLogo.showOrgName
})
const mapDispatchToProps = dispatch => ({
    emailForPassword: (orgId, email) => dispatch(actions.emailForPassword(orgId, email)),
})

export default connect(mapStateToProps, mapDispatchToProps)(EmailRequest);


const ForgotPasswordForm = ({ handleSubmit }) => {
    return (
        <Formik
            initialValues={{ email: "" }}
            onSubmit={(values) => {
                handleSubmit(values.email.toLowerCase())
            }}
            validationSchema={Yup.object().shape({
                email: Yup.string().email("Enter a valid Email address.").required("Email address can't be empty."),
            })}
        >
            {props => {
                const { 
                    // eslint-disable-next-line no-shadow
                    values, touched, errors, handleChange, handleBlur, handleSubmit 
                } = props;
                return (
                    <form onSubmit={handleSubmit} noValidate>
                        <FormikInput
                            name="email"
                            type="email"
                            label="Email ID"
                            values={values}
                            errors={errors}
                            touched={touched}
                            className="lowercase"
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            autoComplete="off"
                        />
                        <div className="login_btn_cont">
                            <button
                                type="submit"
                                className="login_btn"
                                onClick={props.clicked}
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                )
            }}
        </Formik>
    )
}