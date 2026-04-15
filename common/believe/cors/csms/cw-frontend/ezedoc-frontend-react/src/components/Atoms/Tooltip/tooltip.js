import React from 'react';
import ReactTooltip from 'react-tooltip';
import cx from 'classnames';
import PropTypes from 'prop-types';
import styles from './tooltip.module.scss';

const { tooltipArea, tooltipInfo, tooltipAreaNoArrow } = styles;
const Tooltip = ({
  children, id, onShow, tooltipClass, place, arrowColor, type, delayShow,
}) => {
  const color = type === 'info' ? styles.infoWarning10 : arrowColor;
  return (
    <ReactTooltip
      className={cx(
        { [`${tooltipArea}`]: arrowColor !== 'transparent' },
        tooltipClass, { [`${tooltipInfo}`]: type === 'info' },
        { [`${tooltipAreaNoArrow}`]: arrowColor === 'transparent' },
      )}
      border
      id={id}
      type="light"
      place={place}
      wrapper="div"
      afterShow={onShow}
      arrowColor={color}
      delayShow={delayShow}
    >
      {children}
    </ReactTooltip>
  );
};

Tooltip.propTypes = {
  /**
   * id for tooltip, should be unique in a page
   */
  id: PropTypes.string.isRequired,
  /**
   * children, React component which should display inside Tooltip
   */
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  /**
   * onShow callback triggers when tooltip is shown
   */
  onShow: PropTypes.func,
  /**
   * place: position of the tooltip wrt to element
   */
  place: PropTypes.oneOf(['left', 'right', 'bottom', 'top']),
  /**
   * arrowColor color of arrow, if given transparent does not show the arrow for tooltip
   */
  arrowColor: PropTypes.string,
  /**
   * tooltip class overrides default tooltip class
   */
  tooltipClass: PropTypes.string,
  /**
   * type: different tooltip use cases
   */
  type: PropTypes.oneOf(['info', 'custom']),
  /**
   * delays showing of tooltip in ms
   */
  delayShow: PropTypes.number,

};

Tooltip.defaultProps = {
  onShow: () => null,
  place: 'right',
  arrowColor: null,
  tooltipClass: '',
  type: 'custom',
  delayShow: 1,
};

export default Tooltip;
