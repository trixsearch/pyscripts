import React, { Component } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';

import Spinner from '../../components/UI/Spinner/Spinner';
import FormikInput from '../../components/UI/FormikInput';

import '../Auth.css';
import './loginStyles.css';

export default class LoginForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fields: {
                Email: "",
                Password: ""
            },
            error_response: ""
        }
    }

    componentWillUnmount() {
        this.props.clearPswdSetMessage();
    }

    authFail = (error_response) => {
        if (this.props.setpasswordMessage) {
            this.props.clearPswdSetMessage();
        }
        this.setState(prevState => ({
            fields: { ...prevState.fields, Password: "" },
            error_response,
        }))
    }

    handleSubmit = (Email, Password) => {
        this.setState(prevState => ({ fields: { ...prevState.fields, Email, Password }, error_response: "" }))
        this.props.onAuth(Email, Password, this.props.history, this.authFail, this.props.location.state)
    }

    render() {
        const { loading, setpasswordMessage } = this.props;
        return (
            <>
                <div className="successmessage">{setpasswordMessage}</div>
                <div className="invalid-credentials">
                    {this.state.error_response}
                </div>
                {loading && (<Spinner />)}
                <Formik
                    enableReinitialize
                    initialValues={this.state.fields}
                    onSubmit={(values) => {
                        this.handleSubmit(values.Email.toLowerCase(), values.Password)
                    }}
                    validationSchema={Yup.object().shape({
                        Email: Yup.string().email("Enter a valid Email address.").required("Email address can't be empty."),
                        Password: Yup.string().required(`Please enter your password.`),
                    })}
                >
                    {props => {
                        const { 
                            values, touched, errors, handleChange, handleBlur, handleSubmit 
                        } = props;
                        return (
                            <form onSubmit={handleSubmit} noValidate>
                                <FormikInput
                                    name="Email"
                                    type="email"
                                    label="Email"
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    className="lowercase"
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                    autoComplete="off"
                                />
                                <FormikInput
                                    name="Password"
                                    label="Password"
                                    type="password"
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                    autoComplete="off"
                                />
                                <div className="forgot_password_label">
                                    <Link to='/getpassword'>Forgot password?</Link>
                                </div>
                                <div className="login_btn_cont">
                                    <button disabled={loading} type="submit" className="login_btn">Login</button>
                                </div>
                            </form>
                        )
                    }}
                </Formik>
            </>
        )
    }
}
