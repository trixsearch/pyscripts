import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import styles from './Modal.module.scss';

const Modal = ({
  show, children, onBackDropClick, className, modalWrapperClass,
}) => {
  const showHideClassName = show
    ? cx(styles.modal, styles.displayBlock, modalWrapperClass)
    : cx(styles.modal, styles.displayNone);

  const handleBackdropClick = (event) => {
    if (event.target.id === event.currentTarget.id) {
      event.preventDefault();
      event.stopPropagation();
      onBackDropClick();
    }
  };

  return (
    <div aria-hidden className={showHideClassName} id="modal-container-#001" onClick={handleBackdropClick}>
      <section className={cx(styles.modal_main, className)}>
        {children}
      </section>
    </div>
  );
};

Modal.propTypes = {
  /**
   * shows modal if true
   */
  show: PropTypes.bool.isRequired,
  /**
   * child component to be rendered in modal
   */
  children: PropTypes.node,
  /**
   * child component to be rendered in modal
   */
  className: PropTypes.string,
  /**
   * funtion to close modal onBackdropclick
   */
  onBackDropClick: PropTypes.func,
  /**
   * modal wrapper class
   */
  modalWrapperClass: PropTypes.string,
};

Modal.defaultProps = {
  children: () => null,
  className: {},
  onBackDropClick: () => null,
  modalWrapperClass: undefined,
};

export default Modal;