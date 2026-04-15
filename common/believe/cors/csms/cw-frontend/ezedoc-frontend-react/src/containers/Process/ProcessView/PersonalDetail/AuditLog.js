import React from 'react';
import { HistoryActivity } from "../../../Entities/History";

import './personDetails.css'
import '../../../Entities/Css/entity.css'

const AuditLog = (props) => {
    let activities = null;
  
    if (props.auditData.length > 0) {
        activities = [];
        props.auditData.map((data, i) => {
            activities.unshift(
              <HistoryActivity activityData={data} key={`activity_${i + 1}`} />
            );
            return null;
        });
    }else {
        activities = <div className="no-history-text">No History</div>;
    }
    return activities
    
}

export default AuditLog;
