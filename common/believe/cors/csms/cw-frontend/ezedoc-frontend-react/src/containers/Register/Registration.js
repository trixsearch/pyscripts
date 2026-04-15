import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik } from 'formik';
import * as Yup from 'yup';
import { parseQueryString } from 'containers/utils';

import { signUpAuth } from "../../store/actions/index";
import Spinner from "../../components/UI/Spinner/Spinner";
import FormikInput from '../../components/UI/FormikInput';
import { UNALLOWED_EMAIL_PROVIDERS } from '../../Data/constants'

import '../Auth.css';
import './register.css';

class Registration extends Component {
    state = {
        firstName: "",
        middleName: "",
        lastName: "",
        companyEmail: "",
    }

    render() {
        const { loading, message, error, domain_url, companyName } = this.props
        const { firstName, middleName, lastName, companyEmail } = this.state;

        let domain = `${domain_url.split('.')[0]}`;
        if (message) {
            return (<p className="register_message">{message}</p>)
        }
        if (error) {
            return (<div className="errormessage">{error}</div>)
        }
        if (loading) {
            return (<Spinner />);
        }
        return (
            <>
                {message ? null : <p style={{textAlign: 'center'}}> Setup organisation owner account</p>}
                <Formik
                    initialValues={{ 
                        firstName, middleName, lastName, companyEmail 
                        }}
                    onSubmit={(values) => {
                        const { 
                            firstName, lastName, middleName, companyEmail 
                            } = values;
                        const queryParams = parseQueryString(this.props.location.search);
                        this.props.onRegister(firstName, middleName, lastName, companyEmail.toLowerCase(), domain_url, companyName, queryParams)
                    }}
                    validationSchema={Yup.object().shape({
                        firstName: Yup.string().required(`First Name can't be empty.`),
                        lastName: Yup.string().required(`Last Name can't be empty.`),
                        middleName: Yup.string(),
                        companyEmail: Yup.string().email("Company Email must be a valid Email address."
                                ).required(`Email can't be empty.`).test(
                                    'validEmail',
                                    'Personal email id is not allowed, provide company email id',
                                    value => {
                                        if(!value) { return false }
                                        let valid = false;
                                        let emailProvider = value.split('@');
                                        if (Array.isArray(emailProvider) && emailProvider.length>1){
                                            emailProvider = emailProvider[1].split('.');
                                            if(Array.isArray(emailProvider) && emailProvider.length > 0) {
                                                let enteredDomain = emailProvider[0];
                                                if(!UNALLOWED_EMAIL_PROVIDERS.includes(enteredDomain.toLowerCase())) {
                                                    valid = true;
                                                }                                            
                                            }
                                        }
                                        return valid;
                                    },
                          )
                    })}
                >
                    {props => {
                        const { values, touched, errors, isSubmitting, handleChange,
                            handleBlur, handleSubmit } = props;
                        return (
                            <form className="form_up_box" onSubmit={handleSubmit} noValidate autoComplete="off">
                                <FormikInput
                                    name="firstName"
                                    label="First Name"
                                    touched={touched}
                                    errors={errors}
                                    values={values}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                />
                                <FormikInput
                                    name="middleName"
                                    label="Middle Name"
                                    touched={touched}
                                    errors={errors}
                                    values={values}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                />
                                <FormikInput
                                    name="lastName"
                                    label="Last Name"
                                    touched={touched}
                                    errors={errors}
                                    values={values}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                />
                                <FormikInput
                                    type="email"
                                    name="companyEmail"
                                    label="Company Email ID"
                                    touched={touched}
                                    errors={errors}
                                    values={values}
                                    handleChange={handleChange}
                                    className="lowercase"
                                    handleBlur={handleBlur}
                                    placeholder={`${values.firstName?values.firstName:'yourName'}@${domain}.com`}
                                />
                                <div className="login_btn_cont">
                                    <button disabled={isSubmitting} className="signup_btn" type="submit">Sign Up</button>
                                </div>
                            </form>
                        );
                    }}
                </Formik>
            </>
        )
    }
}

const mapStateToProps = state => ({
    loading: state.signup.loader,
    error: state.signup.error,
    message: state.signup.message,
    domain_url: state.domainReg.domain_url,
    companyName: state.domainReg.companyName,
})

const mapDispatchToProps = dispatch => ({
    onRegister: (first, middle, last, email, domain_url, companyName, queryParams) => 
        dispatch(signUpAuth(first, middle, last, email, domain_url, companyName, queryParams)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Registration);
