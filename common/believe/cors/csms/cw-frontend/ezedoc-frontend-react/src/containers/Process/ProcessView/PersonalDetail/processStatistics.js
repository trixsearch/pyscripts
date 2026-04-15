import React from 'react';
import moment from 'moment';

import { msToTime } from '../../../utils';
import { PROCESS_DATETIME_FORMAT } from '../../../../Data/constants';

const ProcessStats = (props) => {
    if (props.type && props.type === "entity") {
        return (
            <div className="process-stats" style={{ "padding": "10px" }}>
                <div className="process_details_text">
                    <p>Started By</p>
                    <h6>{props.data.entity_data ? props.data.entity_data.initiator || '-' : "-"}</h6>
                </div>
                <div className="process_details_text">
                    <p>Created At</p>
                    <h6>{props.data.created_at ? moment(props.data.created_at).format(PROCESS_DATETIME_FORMAT) : "-"}</h6>
                </div>
                <div className="process_details_text">
                    <p>Updated At</p>
                    <h6>{props.data.updated_at ? moment(props.data.updated_at).format(PROCESS_DATETIME_FORMAT) : "-"}</h6>
                </div>
            </div>
        )
    }
    
    const duration = props.data && props.data.durationInMillis ? msToTime(props.data.durationInMillis) : "-";
    const entityName = props.data.variables && props.data.variables.filter(variable => variable.name === "entity_name");
    const initiator = props.data.variables && props.data.variables.filter(variable => variable.name === "initiator");

    return (
        <div className="process-stats">
            <div className="process_details_text">
                <p>Started By</p>
                <h6>{initiator[0] ? initiator[0].value : "-"}</h6>
            </div>
            <div className="process_details_text">
                <p>For</p>
                <h6>{entityName[0] ? entityName[0].value : "-"}</h6>
            </div>
            <div className="process_details_text">
                <p>Started At</p>
                <h6>{moment(props.data.startTime).format(PROCESS_DATETIME_FORMAT) || "-"}</h6>
            </div>
            <div className="process_details_text">
                <p>Completed At</p>
                <h6>{props.data.endTime ? moment(props.data.endTime).format(PROCESS_DATETIME_FORMAT) : "-"}</h6>
            </div>
            <div className="process_details_text">
                <p>Process Duration</p>
                <h6>{duration}</h6>
            </div>
            <div className="process_details_text">
                <p>Withdraw Reason</p>
                <h6>{props.data.deleteReason || "-"}</h6>
            </div>
        </div>
    )
}

export default ProcessStats;
