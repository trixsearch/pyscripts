import React, { Component } from "react";
import { connect } from "react-redux";

import { DomainCheck, domainRegister } from "../../store/actions/index";
import Spinner from "../../components/UI/Spinner/Spinner";
import Dots from '../../components/UI/DotsLoader/Dots';
import datatype from "../../Data/Createdata";

import '../Auth.css';
import './register.css';

const base_domain = process.env.REACT_APP_HOST_NAME;
            
class DomainRegister extends Component {
    constructor(props) {
        super(props)
        this.state = {
            domain: "",
            company: "",
            dirty: false,
            regexValid: true
        }
    }
    handleBlurDomain = ({ target }) => {
        if (target.value.length > 1 && this.state.regexValid) {
            this.props.onDomainCheck(target.value)
        }
        this.setState({ dirty: true })
    }

    handleChangeDomain = ({ target }) => {
        let domainName = target.value.toLowerCase().trim().replace(/\s+/g, '');
        let regexValid = (/^[a-z0-9]+$/).test(domainName);

        this.setState({
            domain: domainName,
            dirty: false,
            company: "",
            regexValid
        })
    }
    handleChangeCompany = ({ target }) => {
        this.setState({ company: target.value })
    }
    submitHandler = (event) => {
        event.preventDefault();
        const { company, domain } = this.state
        this.props.onDomainRegister(company, domain)
    }
    render() {
        const { domain, company, dirty, regexValid } = this.state
        const { domainCheckLoader, domainAvailable, domainChecked, loader } = this.props;
        
        let domainAvi = <p className="invalid_message">&nbsp;</p>;
        let icon = <span></span>;
        let validClass = "floating-input"
        let invalidClass = "floating-input Invalid"
        let inputClass = validClass
        let disabledButton = domainCheckLoader || !regexValid || !(!domainAvailable && domainChecked && domain.length > 1 && company.length > 1)

        if (dirty && (domain.length < 2 || (!regexValid || domainAvailable))) {
            domainAvi = <p className="invalid_message">{datatype.DomainNotAvi}</p>
            inputClass = invalidClass
        }
        if (dirty && !domainAvailable && domainChecked && regexValid) {
            icon = <span className="checkmark"></span>;
            inputClass = validClass
        }
        if (dirty && (domain.length < 2 || (!regexValid || domainAvailable))) {
            icon = <span className="close_box"></span>;
        }
        if (domainCheckLoader) {
            icon = <span></span>
        }
        if (loader) {
            return <Spinner />
        }
        return (
            <>
                < div className="errormessage domain" >
                    {this.props.domainCheckLoader ? <Dots /> : domainAvi}
                </div >
                <form className="form_up_box" autoComplete="off">
                    <div className="floating-label">
                        <div className="company_identifier">
                            <input className={inputClass}
                                type="text" placeholder=' '
                                name="domain" value={domain}
                                maxLength="100"
                                onChange={this.handleChangeDomain} onBlur={this.handleBlurDomain}
                                onFocus={this.onFocus} />
                            <label className="wrap">Company Identifier</label>
                        </div>
                        <div className="ezedox_email_box">
                            <span>.{base_domain}</span>
                            {icon}
                        </div>
                    </div>
                    <div className="floating-label" style={{ flexDirection: 'column' }}>
                        <input type='text' placeholder=' '
                            className='floating-input'
                            name="company" value={company}
                            maxLength="100"
                            onChange={this.handleChangeCompany} onBlur={this.handleBlurCompany} />
                        <label>Company Name</label>
                        <span style={{ color: 'red', marginTop: '.15rem' }}>&nbsp;</span>
                    </div>
                    <div className="login_btn_cont">
                        <button disabled={disabledButton} onClick={this.submitHandler} className="signup_btn" type="button">
                            Proceed
                        </button>
                    </div>
                </form>
            </>
        )
    }
}
const mapStateToProps = state => ({
    loader: state.domainReg.loading,
    domainCheckLoader: state.domain.loading,
    domainAvailable: state.domain.count,
    domainChecked: state.domain.checked,
})

const mapDispatchToProps = dispatch => ({
    onDomainCheck: (domain) => dispatch(DomainCheck(domain)),
    onDomainRegister: (companyName, domain_url) => dispatch(domainRegister(companyName, domain_url)),
})

export default connect(mapStateToProps, mapDispatchToProps)(DomainRegister);