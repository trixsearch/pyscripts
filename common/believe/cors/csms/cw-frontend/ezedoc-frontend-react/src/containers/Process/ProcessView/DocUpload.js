import React, { useState } from 'react';
import { connect } from "react-redux";
import axios from 'axios';

import { useParams } from 'react-router-dom';
import { addToast } from '../../../components/Toast/actions';
import DocumentUpload from '../../../components/UI/DocumentUpload';

const APP_URL = process.env.REACT_APP_APP_URL;

const DocUpload = ({ id , setLoader, ...props }) => {

    const { uuid: orgId } = useParams();
    const [show, handleShow] = useState(false);

    const uploadDocs = (files) => {
        setLoader(true);

        const url = `${APP_URL}/${orgId}/forms/files/upload_process_document`;
        const formData = new FormData();
        for( let i = 0; i < files.length; i+=1 ) {
            let file = files[i];
            formData.append("file", file);
            formData.append("processInstanceId", id)
          }
        const config = { 
            headers:  { "Content-Type" : 'multipart/form-data',}
        }
        axios.post(
            url, formData, config
        ).then((res) => {
            props.addToast('success', 'Success', res.data.message)
            handleShow(false);
            setLoader(false);
        }).catch(() => {
            props.addToast('error', 'Error', 'Falied to upload files.')
            setLoader(false);
            handleShow(false);
        }).finally(() => {
            setLoader(false);
        })
    }
    const acceptedFileFormat = "image/png, image/jpg, image/jpeg, .pdf";
    const title = "Upload Documents"
    return (
        <div className="docUpload">
            <button
                type="button"
                className="action-task"
                onClick={() => handleShow(!show)}
            >
                <div className="menuItemImageContainer">
                    <span className="processImage icon-upload" />
                </div>
                <div className="menuItemTextContainer">
                    <div className="headerRow">Upload</div>
                </div>
            </button>
            {show && (
                <DocumentUpload 
                    show={show} 
                    handleShow={handleShow} 
                    handleUpload={uploadDocs} 
                    multiple 
                    fileFormat={acceptedFileFormat} 
                    title={title}
                />
            )}
        </div>
    )
}

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(null, mapDispatchToProps)(DocUpload);
