/* eslint-disable no-param-reassign */
import React, { Component } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Input from "../../components/UI/Input/Input";
import Buttom from "../../components/UI/Button/Button";
import * as actions from "../../store/actions/index";
import Spinner from "../../components/UI/Spinner/Spinner";
import datatype from "../../Data/Createdata";

import "../Auth.css";
import "./loginStyles.css";

class SetPassword extends Component {
  state = {
    controls: [
      {
        elementType: "input",
        elementConfig: {
          type: "password",
          placeholder: " ",
        },
        label: "New Password",
        value: "",
        validation: {
          required: true,
          minLength: 8,
        },
        valid: false,
        touched: false,
        cType: "password",
      },
      {
        elementType: "input",
        elementConfig: {
          type: "password",
          placeholder: " ",
        },
        label: "Confirm Password",
        value: "",
        validation: {
          required: true,
          minLength: 8,
        },
        valid: false,
        touched: false,
        cType: "repeatPassword",
      },
    ],
    match: false,
  };

  componentDidMount() {
    this.props.onGetlogo();
  }

  inputChangeHandler = (event, selectedInput) => {
    if (this.state.match) {
      this.setState({ match: false });
    }

    // eslint-disable-next-line react/no-access-state-in-setstate
    const updatedForm = [...this.state.controls];
    updatedForm.forEach((el) => {
      if (el.cType === selectedInput) {
        el.value = event.target.value;
        el.touched = true;
        el.valid = this.checkValidity(event.target.value, el.validation);
      }
    });

    this.setState({
      controls: updatedForm,
    });
  };

  submitHandler = (event) => {
    event.preventDefault();

    let empty = "";
    let isvalid = false;
    let password = "";
    let repeatPassword = "";
    this.state.controls.forEach((el) => {
      empty = el.value;
      isvalid = el.valid;
      if (el.cType === datatype.password) {
        password = el.value;
      }
      if (el.cType === datatype.repeatPassword) {
        repeatPassword = el.value;
      }
    });

    if (password !== repeatPassword) {
      this.setState({
        match: true,
      });
    }
    if (password === repeatPassword) {
      if (isvalid && empty !== "") {
        this.props.onPassword(
          this.props.match?.params?.uuid,
          password,
          this.props.match.params.id,
          this.props.match.params.token,
          this.props.history
        );
      }
    }
  };

  checkValidity(value, rules) {
    let isValid = true;
    if (!rules) {
      return true;
    }
    if (rules.required) {
      isValid = value.trim() !== "" && isValid;
    }

    if (rules.minLength) {
      isValid = value.length >= rules.minLength && isValid;
    }

    if (rules.maxLength) {
      isValid = value.length <= rules.maxLength && isValid;
    }

    if (rules.isEmail) {
      const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
      isValid = pattern.test(value) && isValid;
    }

    if (rules.isNumeric) {
      const pattern = /^\d+$/;
      isValid = pattern.test(value) && isValid;
    }

    return isValid;
  }

  render() {
    let createOrglogo = null;
    let oranameVar = null;
    let characterZero = null;
    if (this.props.orgName) {
      oranameVar = this.props.orgName;
      characterZero = oranameVar.charAt(0);
    }
    if (!this.props.orgLogo) {
      createOrglogo = (
        <div className="login-tenant-no-logo">
          <span className="noLogo-class">{characterZero}</span>
          <span>{this.props.orgName}</span>
        </div>
      );
    } else if (this.props.orgLogo && !this.props.showOrgName) {
      createOrglogo = (<img className="logo" src={this.props.orgLogo} alt="" />);
    } else if (this.props.orgLogo && this.props.showOrgName) {
      createOrglogo = (
        <>
          <span className="brand_logo text-change">
            <img src={this.props.orgLogo} alt="" />
            {this.props.orgName}
          </span>
        </>
      );
    }

    let authRedirect = null;

    let passwordMessage = null;

    if (this.state.match) {
      passwordMessage = <p className="invalid_message">password not match</p>;
    }
    if (this.props.message) {
      passwordMessage = <p className="invalid_message">{this.props.message}</p>;
    }

    if (this.props.redirect) {
      authRedirect = <Redirect to="/login?newUser=true" />;
    }
    let form = this.state.controls.map((formElement) => {
      return (
        <Input
          floatLabel="floating-label"
          key={formElement.cType}
          elementType={formElement.elementType}
          elementConfig={formElement.elementConfig}
          invalid={!formElement.valid}
          shouldValidate={formElement.validation}
          touched={formElement.touched}
          label={formElement.label}
          changed={(event) => this.inputChangeHandler(event, formElement.cType)}
        />
      );
    });

    if (this.props.loading) {
      form = <Spinner />;
    } else {
      form = (
        <div className="login_main_body_container">
          <div className="login_body_container forgot_pass_background">
            <div className="sign_in_up_box">
                <div className="login_logo">
                  {createOrglogo}
                </div>
                <p>Set your password</p>
                <div className="empty_space"/>
                <form onSubmit={this.submitHandler}>
                  {form}
                  <div className="errormessage"> 
                    {passwordMessage}
                  </div>
                  <Buttom button="login_btn" buttonType="login_btn_cont">
                    Save
                  </Buttom>
                </form>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        {authRedirect}
        {form}
      </div>
    );
  }
}
const mapStateToProps = (state) => ({
    loading: state.password.loading,
    message: state.password.message,
    redirect: state.password.redriect,
    orgLogo: state.orgLogo.logo,
    orgName: state.orgLogo.name,
    showOrgName: state.orgLogo.showOrgName,
});

const mapDispatchToProps = (dispatch) => ({
    onPassword: (orgId, password, id, token, history) => dispatch(actions.passwordSet(orgId, password, id, token, history)),
    onGetlogo: () => dispatch(actions.orgLogoGet()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SetPassword);
