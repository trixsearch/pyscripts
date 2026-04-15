import React, { Component } from "react";
import image404 from "../../src/assets/images/404.png"
import "./ErrorPage.css"


class UnauthorizedPage extends Component {

	goBackFunc(e) {
		e.preventDefault()
		this.props.history.goBack(-1)
	}
	
	render() {
		let goBackEle = null;
		if (this.props.history !== undefined) {
			goBackEle = <div className="skip_page ">
				<a onClick={(e) => {this.goBackFunc(e); return false}}>
					<span>Let’s go back</span>
					<span className="arrow_left -long">
					</span>
				</a>
			</div>
		}

		return (
			<div className="error_page_continer">
				<div className="error_page_img">
					{/* <img className="error_page_img_responsive" src={image404} alt="" /> */}
				</div>
				<div className="error_page_discription">
					<p className="unauthorized_oops_msg_text"><span>Oops! Access Denied</span> </p>
                    <p className="unauthorized_msg_text">Please contact your administrator for the access</p>
					{/* <p className="descriptive_tex">Descriptive error message goes here!</p> */}
				</div>
				{goBackEle}
			</div>
		)

	}
}

export default UnauthorizedPage;