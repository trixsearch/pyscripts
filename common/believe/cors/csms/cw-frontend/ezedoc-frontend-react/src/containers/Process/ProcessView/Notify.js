
import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import ReactQuill from 'react-quill'
import Modal from "react-bootstrap/Modal";
import EmailPhone from "./EmailPhoneList"
import 'react-quill/dist/quill.snow.css'; 
import { addToast } from '../../../components/Toast/actions';
import "./notify.css"

const APP_URL = process.env.REACT_APP_APP_URL;

class Notify extends Component {
    state = {
        subject:"",
        email_body :"",
        sms_body : "",
        email_check : true,
        sms_check : true,
        message  : "",
        showCountEmail : true,
        showCountPhone : true
    }

    modules2 = {
        toolbar: null,
    }

      formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image','video'
    ]

    emailBody = (data) => {
        this.setState({
            email_body:data 
        })
    }

    showAllEmail = () => {
        
         this.setState({
            showCountEmail : false
         })
    }

    showAllPhone = () => {
        this.setState({
           showCountPhone : false
        })
   }

    subjectMessage = (event) => {
        this.setState({
            message :""
        })
        let name = event.target.name
        let value = event.target.value
        this.setState({
            [name] : value
        })
    }

    smsEmailCheck = (event) => {
        this.setState({
            message :""
        })
        let name = event.target.name
        let value = event.target.checked
        this.setState({
            [name] : value
        })

    }

    closeModal= () => {
        
        this.setState({
            subject:"",
            email_body :"",
            sms_body : "",
            email_check :true,
            sms_check :true,
            showCountEmail : true,
            showCountPhone : true
        })
        this.props.close()
    }
 
    handleOnBlur = () =>{
        this.setState({
            showCountEmail : true,
            showCountPhone : true
         })
    }

    saveModal = () => {
        const orgId = this.props.match?.params?.uuid;

        this.setState({
            message :""
        })
        let {
email_body,sms_body,subject,email_check,sms_check
} = this.state;
        if(!this.props.selected_email.length) {
            email_check = false
        }else if (!this.props.selected_phone.length) {
            sms_check = false
        }
        
        if(!email_check && !sms_check) {
            this.setState({
                message :  "Select checkbox of email or sms"
            }) 
        } else if(email_check && (email_body === "" || subject === "") ) {
            this.setState({
                message :  "Fill All the mandatory fields for email"
            })  
        } else if (sms_check && sms_body === "") {
            this.setState({
                message :  "Fill All the mandatory fields for sms"
            }) 
        } else {
           let data = {}
           let contacts = this.props.selected_cards && this.props.selected_cards.map((e) => (
               { email: e.email, phone: e.phone }
            ))
           data.email_body = email_body
           data.sms_body = sms_body
           data.subject = subject
           data.email_check = email_check
           data.sms_check = sms_check
           data.contacts = contacts
            let url = `${APP_URL}/${orgId}/config/bulkemail`
        
            axios.post(url , data)
            .then(() => {
                this.setState({
                    subject:"",
                    email_body :"",
                    sms_body : "",
                    email_check :true,
                    sms_check :true,
                    showCountEmail : true,
                    showCountPhone : true
                })
                this.props.addToast('success', 'Success', 'Notification sent successfully')
                this.props.save()
            })
            .catch(() =>{
                this.props.addToast('error', 'Error', 'Something went wrong')
            });
        }
    }
 
    render() {
        let {selected_email,selected_phone} = this.props;

        let {
            email_body,
            sms_body,
            subject,
            email_check,
            sms_check,
            message,
            showCountEmail,
            showCountPhone
        }= this.state;
        let modalBody = null;
            modalBody = (
                <div>
                    <form>
                        <div className="app_error_msg">{message}</div>
                        {selected_email.length
                        ? (
<> 
                            <div className="form-group form-check">
                                    <input type="checkbox" className="form-check-input input-email" onChange={this.smsEmailCheck} checked={email_check} name="email_check" />
                                    <label className="form-check-label email-text" htmlFor="exampleCheck1"> Email</label>
                                        <EmailPhone 
                                            selected_data={selected_email} 
                                            showCount={showCountEmail} 
                                            showAll={this.showAllEmail}
                                            handleOnBlur={this.handleOnBlur}
                                        />
                                
                            </div>
                            <div className="form-group">
                                <input 
                                    onChange={this.subjectMessage}
                                    type="text" 
                                    name="subject"
                                    className="form-control ezedox_text" 
                                    placeholder="Subject"
                                    readOnly={!email_check}
                                    value={subject}
                                />
                            </div>
                            <ReactQuill
                                theme="snow"
                                value={email_body}
                                readOnly={!email_check}
                                modules={this.modules}
                                formats={this.formats}
                                onChange={this.emailBody} 
                            />
</>
) : ""}
                        {selected_phone.length 
                        ? (
<>
                            <div className="form-group form-check">
                                <input type="checkbox" onChange={this.smsEmailCheck} className="form-check-input input-email" checked={sms_check} name="sms_check" />
                                <label htmlFor="exampleInputEmail1"> SMS</label>
                                <EmailPhone 
                                    selected_data={selected_phone} 
                                    showCount={showCountPhone} 
                                    showAll={this.showAllPhone}
                                    handleOnBlur={this.handleOnBlur}
                                />
                            </div>
                            <div className="form-group">
                                <textarea 
                                    onChange={this.subjectMessage}
                                    name="sms_body"
                                    className="form-control"
                                    readOnly={!sms_check} 
                                    rows="3" 
                                    value={sms_body}
                                    placeholder="message"
                                />
                            </div>
                        
</>
) : ""}
                    </form>
                </div>
            )
       
        return (
            <Modal
                className='reusable-modal-container notify_modal'
                show={this.props.notify_me}
                centered
                animation
            > 
                <div className="resusable-modal-header notify_header">
                    <Modal.Header>
                    <Modal.Title>Send reminder using Email and/or SMS</Modal.Title>
                    </Modal.Header>
                </div>
                <div className="notify-modal-body ">
                <Modal.Body>{modalBody}</Modal.Body>
                </div>
                <div className="reusable-modal-footer">
                <Modal.Footer>
                    <button onClick={this.closeModal} type="button" className="fancy_btn">
                      Cancel
                    </button>
                    
                    <button onClick={this.saveModal} type="button" className="fancy_btn active">
                      Send
                    </button> 

                </Modal.Footer>
                </div>
            </Modal>

        );
    }
}

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(null, mapDispatchToProps)(Notify);
