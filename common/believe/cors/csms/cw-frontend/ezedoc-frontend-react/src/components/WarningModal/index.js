import React from "react";
import Modal from "react-bootstrap/Modal";
import Warning from '../../assets/images/warning.png'
import "./Style.css";

export default ({
show,message,primaryBtn,secondaryBtn
}) => {
  return (
    <Modal
      className='warning-container'
      show={show}
      onHide={secondaryBtn.onClick}
      centered
      animation
    >
      <div className="warning-body">
        <Modal.Body>
            <div className="warning-img">
                <img src={Warning} alt='Warning'/>
            </div>
            <div className="text d-flex justify-content-center">
                {message} 
            </div>
        </Modal.Body>
      </div>
      <div className="warning-footer">
        <Modal.Footer>
          <button type='button' className='fancy_btn' onClick={() => secondaryBtn.onClick()}>
            {secondaryBtn.text}
          </button>
          <button type='button' className='fancy_btn active' onClick={() => primaryBtn.onClick()}>
            {primaryBtn.text}
          </button>
        </Modal.Footer>
      </div>
    </Modal>
  );
};
