import React from "react";
import "./configure.css"
import Modal from '../../../components/Modal';

export const CheckBox = (props) => {

    const {
        name, checked, click, text, disabled
    } = props;

    return (
        <div className="permission-edit-grid">
            <div className="squaredThree">
                <input
                    disabled={disabled}
                    type="checkbox"
                    name={name}
                    checked={checked[name]}
                    onChange={click}
                />
            </div>
            <p className="permission-edit-text">{text || name}</p>
        </div>
    )
}

export default (props) => {
    return (
        <Modal
            show={props.open}
            onClose={props.close}
            title={props.name}
            primaryBtn={{ text: 'Save', className: 'fancy_btn active', onClick: props.save }}
            secondaryBtn={{ text: "Cancel", className: 'fancy_btn', onClick: props.close }}
        >
            <div className="permission-edit-container">
                <CheckBox name='View' click={props.click} checked={props.checked} />
                <CheckBox name='Reassign' click={props.click} checked={props.checked} />
                <CheckBox name='Withdraw' click={props.click} checked={props.checked} />
                <CheckBox name='BulkEmail' click={props.click} checked={props.checked} />
                <CheckBox name='Initiate' disabled click={props.click} checked={{ Initiate: true }} />
                <CheckBox name="ViewReport" text='View Report' click={props.click} checked={props.checked} />
                <CheckBox name="UploadDocument" text="Upload Document" click={props.click} checked={props.checked} />
                <CheckBox name='DownloadReport' text='Download Report' click={props.click} checked={props.checked} />
            </div>
        </Modal>
    )
}
