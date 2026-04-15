import React from "react";
import Modal from "react-bootstrap/Modal";
import axios from 'axios';
import { connect } from "react-redux";

import Charts from '../Chart/Chart';
import './Querymodal.css';
import { downloadReports, RetrieveReportVariables} from "../../../store/actions/index";
import { Button } from "../../../components/UI/AppButton/AppButton";
import {REPORT_CHOICES} from "../../../Data/constants";
import { addToast } from '../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

class QueryModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: this.props.data.query.query.length ? [...this.props.data.query.query] : [{
          type: "common",
          comparision: "EQUALS",
          attribute: "",
          value: ""
        }],
      config: []
    }
  }

  componentDidMount() {
    const orgId = this.props.match?.params?.uuid;
    let url = ''
    if ((this.props.data.report_on !== 'INVENTORY') && (this.props.data.report_on !== 'BGV')) {
      this.props.RetrieveReportVariables(true);
      if(this.props.data.report_on === 'ENTITY') {
        url = `${APP_URL}/${orgId}/apps/${this.props.data.entity_master_model}/report_view?type=entity`
      } else{
        url = `${APP_URL}/${orgId}/apps/${this.props.data.apps}/report_view`
      }
      axios.get(url).then(response => {
        this.setState({config: response.data.data})
        this.props.RetrieveReportVariables(false);
      }).catch(() => {
        this.setState({config: []})
        this.props.RetrieveReportVariables(false);
      })
    }
  }


  handleAttribute = (data, i) => {
    let value = data.target.value;
    if (data.target.type === "number") {
      value = Number(data.target.value);
    }
    let name = data.target.name;
    
    this.setState(prevState => {
      let queryTemp = [...prevState.query];
      queryTemp[i] = {
      ...queryTemp[i],
      [name]: value
    };
      return {
        query: queryTemp
      }
    });
  };

  delete = (data) => {
    this.setState(prevState => {
      return {
        query: prevState.filter((e, key) => key !== data)
      }
    });
  };

  count = () => {
    this.setState(prevState => ({
      query: [...prevState.query, {
        type: "common",
      comparision: "EQUALS",
      attribute: "",
      value: ""
      }]
    }))
  };

  generateReport = () => {
    const orgId = this.props.match?.params?.uuid;

    const { 
      selected_fields, id ,report_type , send_via_email,report_on
    } = this.props.data;
    let queries = this.state.query;
    let isValid = true;
    queries.forEach(query => {
      if (query.value === "") {
        isValid = false;
      }
    })
    if (isValid) {
      let postData = {
        selected_fields, 
        query: {query : this.state.query},
        report_type,
        send_via_email,
        report_on
      }

      this.props.downloadReports(orgId, id, postData, send_via_email, report_on, this.props.showReportDownload, this.props.hideReportDownload, this.props.onClose).then(res => this.props.handleTransectionId(res));
      this.props.onClose();
    }else {
      this.props.addToast('error', 'Error', 'Fill all the mandatory query parameters.')
    }
  }

  render() {
    const {
       show, onClose, data , hideFilter
    } = this.props;
    
    let reportOnEntity = false
    if (data && data.report_on === "ENTITY") {
      reportOnEntity = true
    }

    const reportOnInventory = (data && data.report_on === 'INVENTORY') || false
    const reportOnBgv = (data && data.report_on === 'BGV') || false
    return (
      <Modal
        className='querybuilder-modal-container'
        show={show}
        onHide={onClose}
      >
        <div className="querybuilder-modal-header">
          <Modal.Header closeButton>
            <Modal.Title>Generate Report</Modal.Title>
            <span className="modal-subtitle">Please fill the details to generate report.</span>
          </Modal.Header>
        </div>
        <div className="querybuilder-modal-body">
          <Modal.Body>
            {data && (
              <Charts
                report_type={REPORT_CHOICES[data.report_type]}
                hideFilter={hideFilter}
                show={false}
                clicked={data.apps}
                query={this.state.query}
                handleAttribute={this.handleAttribute}
                count={this.count}
                config={this.state.config}
                delete={this.delete}
                reportOnEntity={reportOnEntity}
                reportOnInventory={reportOnInventory}
                reportOnBgv={reportOnBgv}
                runReport
              />
             )}
          </Modal.Body>
        </div>
        <div className="querybuilder-modal-footer">
          <Modal.Footer>
            <div>
              <Button onClick={onClose} variant="secondary">
                Cancel
              </Button>
              <Button onClick={this.generateReport} variant="primary">
                Generate Report
              </Button>
            </div>
          </Modal.Footer>
        </div>
      </Modal>
    )
  }
}

const mapDispatchToProps = (dispatch) => ({
  downloadReports: (orgId, id, data, send_via_email, report_on, showReportDownload, hideReportDownload, callBack) => dispatch(downloadReports(orgId, id, data, send_via_email, report_on, showReportDownload, hideReportDownload, callBack)),
  addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration)),
  RetrieveReportVariables: (loader) =>dispatch(RetrieveReportVariables(loader)),
})

export default connect(null, mapDispatchToProps)(QueryModal);
