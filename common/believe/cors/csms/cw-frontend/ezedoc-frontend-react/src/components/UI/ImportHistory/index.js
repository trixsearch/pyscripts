import React, { useState, useEffect, useRef } from 'react';
import moment from "moment";
import Axios from 'axios';
import {connect} from 'react-redux'

import Modal from '../../Modal';
import { Button } from '../AppButton/AppButton';
import "./ImportHistory.css";
import { 
    PROCESS_DATETIME_FORMAT, 
    UPDATE_BULK_PROCESS_RESULT,
    BULK_PROCESS_STEP_PROGRESS
} from "../../../Data/constants";

const flattenObject = (obj={}) => {
    try {
        if (typeof obj === "string")
            return obj;
        return Object.keys(obj).reduce((acc, k) => {
            if (Array.isArray(obj[k])) {
                return `${acc}_${k}_${obj[k].join('_')}`
            }
            if (obj[k].constructor === Object) {
                return `${acc}_${k}_${flattenObject(obj[k])}`;
            }
            if (typeof obj[k] === "string") {
                return `${acc}_${obj[k]}`
            }
            return acc
        }, "");
    } catch (err) {
        return "error"
    }
}

const ImportHistoryRow = (props) => {
    const cpToClipBoard = useRef(null);
    const [show, handleShow] = useState(false);
    const [percent, setPercent] = useState(0);
    
    const transactionId = props.data.transaction_id;
    const startedAt = props.data.started_at;
    const [completedAt, setCompletedAt] = useState(props.data.completed_at);
    const [status, setStatus] = useState(props.data.status);
    const [result, setResult] = useState({...props.data.result});

    useEffect(()=>{
        if(status === "IN_PROGRESS") {
            try {
                Axios.get(`/api/imports/${transactionId}`).then(res=>{
                    const percentCompleted = res.data.data.result.completed_percentage;
                    setPercent(percentCompleted || 0);
                })
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log(error);
            }
        }
    },[status, transactionId])

    useEffect(()=>{
        const data = props.updatesData;
        if(props.updateType && data && transactionId === data.transaction_id) {
            if(props.updateType.type === UPDATE_BULK_PROCESS_RESULT) {
                setCompletedAt(data.completed_at);
                setResult({...data.result});
                setStatus(data.status);
                setPercent(0);
            }else if(props.updateType.type === BULK_PROCESS_STEP_PROGRESS) {
                setResult({...data.result, success: data.success, failed: data.failed})
                setPercent(data.completed);
            }
        }
    },[props.updateType, props.updatesData, transactionId])

    let started_date = moment(startedAt).format(PROCESS_DATETIME_FORMAT);

    let completed_date = "-"
    if (completedAt) {
        completed_date = moment(completedAt).format(PROCESS_DATETIME_FORMAT);
    }
    let errors = []
    if (result && result.error_results) {
        Object.entries(result.error_results).map(entry => {
            let [name, error] = entry;
            if(props.entity === 'bulk_initiate_process') {
                error = error.message;
            }
            let flattened = flattenObject(error)
            errors.push({
                name,
                error: flattened
            })
            return entry
        })
    }

    const CopyToClipBoard = () => {
        cpToClipBoard.current.select();
        document.execCommand("copy")
    }

    return (
        <tr>
            <td className="col-md-4 col-xs-12">
                {transactionId}
            </td>
            <td className="col-md-3 col-xs-12">
                {started_date}
            </td>
            <td className="col-md-3 col-xs-12">
                {completed_date}
            </td>
            <td className="col-md-1 import_history_status col-xs-12">
                {percent !== 0 ?`${percent} %`: status}
            </td>
            <td className="col-md-1 col-xs-12">
                <Button
                    variant="table-row-edit"
                    onClick={() => { handleShow(true) }}
                >
                    Results
                </Button>
            </td>
            <Modal
                show={show}
                title="Import Results"
                onClose={() => { handleShow(false) }}
                primaryBtn={{
                    className: 'fancy_btn hide d-none',
                }}
                secondaryBtn={{
                    className: 'fancy_btn',
                    text: "Close",
                    onClick: () => {
                        handleShow(false)
                    }
                }}
            >
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'baseline' }}>
                        <p>
                            Success:
                            <span style={{ color: 'green', paddingLeft: 2 }}>
                                {`${result && (result.success || 0)}`}
                            </span>
                        </p>
                        <p>
                            Ignored:
                            <span style={{ color: 'orange', paddingLeft: 2 }}>
                                {`${result && (result.ignored || 0)}`}
                            </span>
                        </p>
                        <p>
                            Failed:
                            <span style={{ color: 'red', paddingLeft: 2 }}>
                                {`${result && (result.failed || 0)}`}
                            </span>
                        </p>
                        {!!errors.length && (
                        <>
                            <Button 
                                onClick={CopyToClipBoard}
                                variant="cp-to-clipboard btn fancy_btn"
                            >
                                Copy to clipboard
                            </Button>
                            <textarea
                                className="hidden-textarea"
                                ref={cpToClipBoard} 
                                defaultValue={JSON.stringify(result.error_results)} 
                            />
                        </>
                    )}
                    </div>
                    {!!errors.length && (
                        <div className="error-results-cont">
                            <div className="error-results-cont-main-header">
                                <p className="error-results-cont-header-col1">
                                    Field
                                </p>
                                <p className="error-results-cont-header-col2">
                                    Error
                                </p>
                            </div>
                            <div className="error-results-cont-body">
                                {errors.map((error, index) => {
                                    return (
                                        <div
                                            key={`${transactionId + index}__error_row`}
                                            className="error-results-cont-header"
                                        >
                                            <p className="error-results-cont-header-col1">
                                                {error.name}
                                            </p>
                                            <p className="error-results-cont-header-col2">
                                                {error.error}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            </Modal>
                {!completedAt?<div className="progress-bar" style={{'width':`${percent}%`}} />:null}
        </tr>
    )
}

const mapStateToProps = state=> ({
    updateType: state.websocket.updateType,
    updatesData: state.websocket.updatesData,
})
export default connect(mapStateToProps)(ImportHistoryRow);