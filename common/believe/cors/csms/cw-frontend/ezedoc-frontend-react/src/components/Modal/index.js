import React from "react";
import Modal from "react-bootstrap/Modal";
import "./Style.css";

export default ({
  show,
  onClose,
  title,
  children,
  primaryBtn,
  secondaryBtn,
  extraButtonData,
  customClassName
}) => {
  return (
    <Modal
      className={`reusable-modal-container ${customClassName}`}
      show={show}
      onHide={onClose}
      centered
      animation
    >
      <div className="reusable-modal-header">
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
      </div>
      <div className="reusable-modal-body">
        <Modal.Body>{children}</Modal.Body>
      </div>
      <div className="reusable-modal-footer">
        <Modal.Footer>
          {
            secondaryBtn
            && (
              <button className={secondaryBtn.className} onClick={onClose} type='button'>
                {secondaryBtn.text}
              </button>
            )
          }
          {
            primaryBtn
            && (
              <button className={primaryBtn.className} onClick={primaryBtn.onClick} disabled={primaryBtn.disabled} type='button'>
                {primaryBtn.text}
              </button>
            )
          }
          {extraButtonData || null}
        </Modal.Footer>
      </div>
    </Modal>
  );
};
