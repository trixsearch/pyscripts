import React, { useState } from 'react';
import { connect } from "react-redux";
import axios from 'axios';

import DocumentUpload from './index';
import { Button } from '../AppButton/AppButton';
import { addToast } from '../../Toast/actions';
import Spinner from '../Spinner/Spinner';

const BulkImport = ({
    url,
    show,
    title,
    history,
    handleShow,
    redirectUrl,
    commonVariables = null,
    ...props
}) => {

    const [isLoading, setIsLoading] = useState(false);

    const acceptedFileFormat = ".xlsx, .xls, .csv";
    const uploadFile = (file) => {
        setIsLoading(true);
        let formData = new FormData();
        formData.append("file", file[0])
        if (commonVariables) formData.append('common_variable', JSON.stringify(commonVariables))

        const config = {
            headers: { "Content-Type": "multipart/form-data" }
        }

        axios.post(url, formData, config)
            .then(res => {
                props.addToast('success', 'Success', res.data.message);
                if (redirectUrl) {
                    history.push({ pathname: redirectUrl, state: (res.data.data && res.data.data.transaction_id) || "" })
                }
            })
            .catch(() => {
                props.addToast('error', 'Error', 'Bulk Import Failed');
            })
            .finally(() => {
                setIsLoading(false);
                handleShow(false);
            })
    }

    const getSampleFile = () => {
        setIsLoading(true);
        axios({
            url,
            method: "GET",
            responseType: "blob"
        })
            .then((res) => {
                if (res?.status === 204) {
                    return props.addToast('error', 'Error', 'Bulk Import Failed');
                }
                const docUrl = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement("a");
                link.href = docUrl;
                link.setAttribute("download", "sample_import.xlsx");
                document.body.appendChild(link);
                link.click();
                props.addToast('success', 'Success', 'Sample File is downloaded')
                // handleShow(false);
            })
            .catch(() => {
                // handleShow(false)
                return props.addToast('error', 'Error', 'Bulk Import Failed');
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    const sampleDocumentText = (
        <p style={{ textAlign: "center" }}>
            Click
            <Button
                variant="link"
                onClick={getSampleFile}
            >
                here
            </Button>
            to get the sample Template.
        </p>
    )
    return (
        <div>
            {isLoading && (<Spinner />)}
            {show ? (
                <DocumentUpload
                    show={show}
                    handleShow={handleShow}
                    handleUpload={uploadFile}
                    modalExtraBody={sampleDocumentText}
                    fileFormat={acceptedFileFormat}
                    title={title}
                    upload_type="Import"
                    multiple={false}
                    uploadText="Upload the filled template."
                    onClick={()=>{title==='Bulk Initiate Source Candidate Process' ? window.sendEvent("Hire_Complete_bulk_sourced_candidates") : '' }}
                />
            ) : null}
        </div>
    )
}

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(null, mapDispatchToProps)(BulkImport);
