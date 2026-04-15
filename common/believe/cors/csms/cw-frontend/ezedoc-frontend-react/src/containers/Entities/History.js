/* eslint-disable no-console */
// external components
import React, { Component } from "react";
import Axios from 'axios';

// internal components
import { getTaskName } from 'containers/utils';
import IconChooser from "./HistoryIconChooser";


// Api Response for audit log
//  id: "83465cdc-9b34-4098-83cb-583ab50853b1"
//  name: "Document Submission"
//  activity_type: "userTask"
//  assignee: "harishchowdary72+5@gmail.com"
//  end_time: "2019-07-16T10:53:05.401000Z"
//  entity: "ade383d0-6574-447d-b63b-9030161f7b60"

// History Activity Component
export const HistoryActivity = ({ activityData }) => (
  <div className="historyActivity">
    <div className="historyActivityBadge">
      <span className="historyActivityIcon">
        <IconChooser type={activityData.activityType} />
      </span>
    </div>
    <div className="historyActivityPanel">
      <div className="historyActivityInfo">
        <span className="activityDoer">
          <span className="doer">{activityData.assignee}</span>
          <span className="activityDateTime">{activityData.endTime?new Date(activityData.endTime).toLocaleString():""}</span>
        </span>
        <p>{getTaskName(activityData.activityName)}</p>
      </div>
    </div>
  </div>
);

// Identity History Component
class IdentityHistory extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loader: false,
      historyActivitiesData: null
    }
    this.historyRef = React.createRef()
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
    // get axios call need here to collect history datas
    this.setState({
      loader: true
    });

    Axios.get(`/api/entity/master/audit_log?entity=${this.props.id}`)
    .then(res => {
        this.setState({
            historyActivitiesData: res.data.data
        });
    })
    .catch(err => { console.log(err) })
    .finally(() => {
        this.setState({
            loader: false
        })
    })
    // axios call should make when the component get update according to prop showHistory
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  handleClickOutside = (event) => {
    if (this.historyRef.current && !this.historyRef.current.contains(event.target)) {
      this.props.handler();
    }
  }

  render() {
    const { loader, historyActivitiesData } = this.state;

    let activities = null;

    if (loader) {
      // content loader implementation here
      activities = null;
    } else if (!loader && historyActivitiesData === null) {
      activities = <div className="no_history_data">No History</div>;
    } else if (!loader && historyActivitiesData !== null) {
      activities = [];
      historyActivitiesData.map((data, i) => {
        activities.unshift(
          <HistoryActivity activityData={data} key={`activity_${i + 1}`} />
        );
        return null;
      });
    }

    return (
      <div className="entityHistory" ref={this.historyRef}>
        <div className="headerSection">
          <h5>
            <strong>History</strong>
          </h5>
          <span
            role="presentation"
            onClick={this.props.handler}
            className="glyphicon glyphicon-remove closeIcon"
          />
        </div>
        <div
          className="historyActivities"
          style={{ height: window.innerHeight - 120 }}
        >
          {activities}
        </div>
      </div>
    );
  }
}

export default IdentityHistory;