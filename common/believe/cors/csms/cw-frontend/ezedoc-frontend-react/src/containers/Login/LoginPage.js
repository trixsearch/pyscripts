import React from "react";
import { connect } from "react-redux";

import { auth } from "store/actions/signIn/Login";
import { clearPswdSetMessage } from "store/actions/signIn/passwordSet";
import ErrorPage from "../ErrorPage";
import LoginForm from "./LoginForm";
import PngBGround from "../../assets/images/login_bg.png";
import WebpBGround from "../../assets/images/login_bg.webp";

import "../Auth.css";
import "./loginStyles.css";

function LoginComponent(props) {
  return props.orgExists ? <LoginPage {...props} /> : <ErrorPage />;
}

const LoginPage = (props) => {
  const { orgLogo, orgName } = props;
  return (
    <div className="login_main_body_container">
      <div className="login_body_container">
        <picture className="login-page-bg">
          <source className="login-page-bg" type="image/webp" srcSet={WebpBGround} />
          <img className="login-page-bg" src={PngBGround} alt="login background" />
        </picture>
        <div className="sign_in_up_box">
          <div className="login_logo">
            {orgLogo ? (
                <img
                  loading="lazy"
                  className="logo"
                  src={orgLogo}
                  alt="Org logo"
                />
            ) : (
                <div className="login-tenant-no-logo">
                  <span className="noLogo-class">
                    {orgName && orgName.charAt(0)}
                  </span>
                  <span>{orgName}</span>
                </div>
              )}
          </div>
          <p> LOGIN using your Email ID and Password</p>
          <LoginForm {...props} />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  loading: state.auth.loading,
  message: state.auth.message,
  setpasswordMessage: state.password.message,
  orgLogo: state.orgLogo.logo,
  orgName: state.orgLogo.name,
  showOrgName: state.orgLogo.showOrgName,
  orgExists: state.orgLogo.orgExists,
});

const mapDispatchToProps = {
  onAuth: auth,
  clearPswdSetMessage,
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginComponent);
