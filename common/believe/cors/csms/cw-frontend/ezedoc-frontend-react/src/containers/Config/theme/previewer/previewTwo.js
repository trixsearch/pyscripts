import React, { Component } from "react";

class PreviewTwo extends Component {

    render() {
        let workflowStyle = null;
        let buttonStyle = null;

        let Input = ({ handleChange, handleBlur, value, error, touched, type, name, label }) => (
            <div className="form_up_box floating-label col-md-12">
                <input name={name} placeholder=" " type={type} value={value}
                    onChange={handleChange} onBlur={handleBlur}
                    style={{ color: this.props.theme.first_primary_color }}
                    className={error && touched ? 'floating-input Invalid' : 'floating-input'} readOnly />
                <label>{label}</label>
                {error && touched && <span style={{ color: 'red', marginTop: '.15rem' }}>{error}</span>}
            </div>
        )

        if (this.props.theme) {
            workflowStyle = {
                backgroundImage: `linear-gradient(116deg, ${this.props.theme.first_primary_color}, ${this.props.theme.second_primary_color})`,
                color: 'white'
            };
            buttonStyle = {
                backgroundImage: `linear-gradient(116deg, ${this.props.theme.first_button_color}, ${this.props.theme.second_button_color})`,
                color: this.props.button_text_color === 'BLACK' ? '#000' : '#fff'
            };
        }

        return (
            <div className="nav_btn_previewer">
                <div className="nav_btn_previewer_rectangle" style={workflowStyle}>
                    <div className="nav_btn_previewer_bg_image" ></div>
                </div>
                <div className="nav_btn_midle_body">
                    <div className="col-md-12">
                        <div className="theme_input_user_name_pass m-t-zero">
                            <Input className="floating-point" value="Username" disabled="disabled" type='text' autocomplete="false"
                                label='Username' />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="theme_input_user_name_pass">
                            <Input className="floating-point" value="Password" disabled="disabled" type='text' autocomplete="false"
                                label='Password' />
                        </div>
                    </div>
                    <button className="prev_btn" style={buttonStyle}>Button</button>
                </div>
            </div>
        )
    }
}

export default PreviewTwo;
