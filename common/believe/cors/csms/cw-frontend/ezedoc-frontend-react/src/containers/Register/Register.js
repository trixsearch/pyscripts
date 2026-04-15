import React from "react";
import { connect } from "react-redux";

import Registration from "./Registration";
import DomainRegister from "./DomainRegister";
import Logo from '../../assets/images/ezedox-white.svg';

import PngBground from "../../assets/images/signup_bg.png";
import WebpBground from "../../assets/images/signup_bg.webp";

import "../Auth.css";
import "./register.css";

function EzeDoxLogo() {
  return (
    <div className="login_logo">
      <h2>
        <img src={Logo} alt="logo" width="183" height="58" />
      </h2>
    </div>
  );
}

function Register({ ownerSignupPage, ...props }) {
  return (
    <div className="signup_main_body_container">
      <div className="signup_body_container">
      <picture>
        <source className="sign-up-bg-img" type="image/webp" srcSet={WebpBground} />
        <img className="sign-up-bg-img" src={PngBground} alt="sign-up background" />
      </picture>
        <p className="signup_text_left">Sign Up</p>
        <div
          className={
            !ownerSignupPage ? "signup_body signup_proceed_body" : "signup_body"
          }
        >
          <div className="top_border_nav" />
          <div className="sign_in_up_box">
            <EzeDoxLogo />
            {ownerSignupPage ? <Registration {...props} /> : <DomainRegister />}
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToprops = (state) => ({
  ownerSignupPage: state.domainReg.ownerSignupPage,
});

export default connect(mapStateToprops)(Register);
