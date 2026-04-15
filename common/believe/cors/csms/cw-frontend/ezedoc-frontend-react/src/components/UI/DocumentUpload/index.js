import React, { useState } from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import { addToast } from '../../Toast/actions';

import Modal from '../../Modal';
import './styles.css';

const DocumentUpload = ({ 
    show, handleShow, handleUpload, multiple , modalExtraBody, fileFormat, title, upload_type,
    uploadText, ...props
    }) => {

    const [files, setFiles] = useState([]);

    const handleClick = ({ target: { id } }) => {
        let [fileIndex] = id.split('____')
        setFiles(files.filter((file, index) => {
            return (index !== Number(fileIndex))
        }))
    }

    const handleFileUpload = (uploadedFiles) => {
        if(uploadedFiles[0].name.length > 100) {
            props.addToast('error', 'Error', 'This file cannot be uploaded as the file name is greater than 100 letters. Retry with a shorter name.')
        } else {
            if(multiple) {
                return setFiles([...files, ...uploadedFiles]);
            }
                return setFiles([...uploadedFiles])
        }   
    }

    const handleFileSubmit = () => {
        handleUpload(files)
    }
    
    return (
        <>
        <Modal
            show={show}
            onClose={() => handleShow(!show)}
            title={title}
            primaryBtn={{ 
                text: upload_type || "Upload", disabled: (!files.length), className: "fancy_btn active", onClick: handleFileSubmit 
            }}
            secondaryBtn={{ text: "Cancel", className: "fancy_btn", onClick: () => handleShow(!show) }}
        >
            {modalExtraBody}
            <div className="file-upload-modal">
            <section className="file-drag-drop-container file-drag-drop-dashed">
            <Dropzone 
                onDrop={acceptedFiles => handleFileUpload(acceptedFiles)}
            >
                {({ getRootProps, getInputProps }) => (
                    
                        <div className="droppable-container" {...getRootProps()}>
                            <input {...getInputProps()} accept={fileFormat} multiple={multiple} />
                            <p className="appear-like-link">
                                <span style={{ marginRight: 8 }} className="glyphicon glyphicon-upload" />
                                {uploadText}
                            </p>
                        </div>
                   
                )}
            </Dropzone>
            </section>
            <div className="file-name-container">
                {Array.isArray(files) && files.map((file, index) => (
                    <div
                        className="file-name-card"
                        key={`${file.size}__${file.path}`}
                    >
                        <div className="file-name-card-btn">
                            <div>
                            {file.name.length > 20 ? (
                                <p>
                                    <span className="file-name">{`${file.name.substring(0, 10)}...`}</span>
                                    <span className="file-name">{file.name.substring(file.name.length - 6, file.name.length)}</span>
                                </p>
                            ) : (
                                    <p className="file-name">
                                        {file.name}
                                    </p>
                                )}
                                <p className="uploaded-file-size"> 
                                    {Math.round(Number(file.size / 1000), 2)}
                                    KB
                                </p>
                            </div>
                            <button
                                id={`${index}____${file.name}`}
                                type="button"
                                onClick={handleClick}
                            >
                                &#10005;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            </div>
        </Modal>
        </>
    )
}

DocumentUpload.defaultProps = {
    uploadText: "Drag and drop some files here, or click to select files"
}

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(null, mapDispatchToProps)(DocumentUpload);
