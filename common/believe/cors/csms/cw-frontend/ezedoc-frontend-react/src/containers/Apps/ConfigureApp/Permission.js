import React from "react";
import { CheckBox } from './PermissionEdit'

import "./configure.css";

export default (props) => (
    <div className="permission-add-container">
        <CheckBox name='View' click={props.click} checked={props.checked} />
        <CheckBox name='Reassign' click={props.click} checked={props.checked} />
        <CheckBox name='Withdraw' click={props.click} checked={props.checked} />
        <CheckBox name='BulkEmail' click={props.click} checked={props.checked} />
        <CheckBox name='Initiate' disabled click={props.click} checked={{ Initiate: true }} />
        <CheckBox name="ViewReport" text='View Report' click={props.click} checked={props.checked} />
        <CheckBox name="UploadDocument" text="Upload Document" click={props.click} checked={props.checked} />
        <CheckBox name='DownloadReport' text='Download Report' click={props.click} checked={props.checked} />
    </div>
)