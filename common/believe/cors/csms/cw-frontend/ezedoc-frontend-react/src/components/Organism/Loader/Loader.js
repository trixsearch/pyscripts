import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import styles from './Loader.module.scss';

const mapArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const Loader = ({
  color, type, className, id, afterStyles,
}) => {
  const {
    height, left, width, top, radius,
  } = afterStyles;
  switch (type) {
    case 'stepLoaderColor':
      setTimeout(() => {
        const loaders = document.querySelectorAll(`#${id}`);
        loaders.forEach((loader) => {
          const { style } = loader;
          style.setProperty('--top', top || '31px');
          style.setProperty('--left', left || '39px');
          style.setProperty('--height', height || '4.75px');
          style.setProperty('--width', width || '1.75px');
          style.setProperty('--radius', radius || '50%');
          style.setProperty('--background', color);
        });
      }, 100);

      return (
        <div className={cx(className, styles.stepLoaderColor)}>
          {mapArray.map((item) => <div key={item} id={id} />)}
        </div>
      );

    case 'success': return (
      <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle
          className={styles.checkmarkCircle}
          cx="26"
          cy="26"
          r="25"
          fill="none"
        />
        <path className={styles.checkmarkTick} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
      </svg>
    );

    case 'loading': return (<div className={styles.load} />);

    case 'error': return (
      <svg className={styles.errorCheckmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle
          className={styles.errorCheckmarkCircle}
          cx="26"
          cy="26"
          r="25"
          fill="none"
        />
        <path className={styles.errorCheckmarkTick} fill="none" d="M16 16 36 36 M36 16 16 36" />
      </svg>
    );

    default: return null;
  }
};

Loader.propTypes = {
  /**
   * type of loader you want to show
   */
  type: PropTypes.oneOf(['stepLoaderColor', 'success', 'loading', 'error']),
  /**
   * color of the loader, applicable if type is stepLoaderColor
   */
  color: PropTypes.string,
  /**
   * classname for loader container
   */
  className: PropTypes.string,
  /**
   * some unique id
   */
  id: PropTypes.string.isRequired,
  /**
   * to control stylings of colored loader, use in below format
   * {
   * top:,
   * left:,
   * width:,
   * height:,
   * radius:,
   * }
   */
  afterStyles: PropTypes.objectOf(PropTypes.string),
};

Loader.defaultProps = {
  type: 'stepLoaderColor',
  color: 'blue',
  className: '',
  afterStyles: {
    top: '31px',
    left: '39px',
    width: '1.75px',
    radius: '50%',
    height: '4.75px',
  },
};

export default Loader;
