import React from "react";
import Modal from "react-bootstrap/Modal";
import model_info_logo from '../../../assets/images/svg/model_info_logo.svg';
import '../../WarningModal/Style.css'
import './Style.css';

export default (props) => {
  return (
    <Modal
      className='warning-container report-download-modal'
      show={props.show}
      onHide={props.hideReportDownload}
      centered
      animation
    >
      <div className="warning-body">
        <Modal.Body>
            <div className="warning-img">
                <img src={model_info_logo} alt='Info'/>
            </div>
            <div className="msg-text">
                {props.message} 
            </div>
        </Modal.Body>
      </div>
      <div className="warning-footer">
        <Modal.Footer>
          <button type='button' className='fancy_btn' onClick={() => props.hideReportDownload()}>
          Cancel
          </button>
          <button type='button' disabled={props.disabledButton} className='fancy_btn active' onClick={() => props.handleReportGeneration(props.downloadURl)}>
            Download
          </button>
        </Modal.Footer>
      </div>
    </Modal>
  );
};