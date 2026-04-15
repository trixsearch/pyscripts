import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import edit from '../../../assets/images/svg/edit.svg';
import addBlue from '../../../assets/images/svg/addBlue.svg';
import deleteIcon from '../../../assets/images/svg/delete.svg';
import add from '../../../assets/images/svg/addButtonPlus.svg';
import blueArrow from '../../../assets/images/svg/blueArrow.svg';
import printIcon from '../../../assets/images/svg/printWhite.svg';
import upArrowBlue from '../../../assets/images/svg/upArrowBlue.svg';
import uploadWhite from '../../../assets/images/svg/uploadWhite.svg';
import rightArrow from '../../../assets/images/svg/rightNavArrow.svg';
import upArrowWhite from '../../../assets/images/svg/upArrowWhite.svg';
import whiteDropdown from '../../../assets/images/svg/whiteDropdown.svg';

import Loader from '../../Organism/Loader';
import { loadAsset } from '../../utils';

import styles from './Button.module.scss';

const Button = ({
  type,
  isDisabled,
  className,
  clickHandler,
  label,
  icon1,
  IconStyle,
  labelStyle,
  arrowStyle,
  isSecondary,
  loaderProps,
  isButtonSubmit,
  id = '',
}) => {
  let buttonProps = {
    buttonClassName: null,
    labelClassName: null,
    src: null,
    imageClassname: null,
    isIconBeforeLabel: false,
  };
  switch (type) {
    case 'largeWithArrow':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.LargeButton,
          )
          : cx('btn', styles.DefaultButton, styles.LargeButton),
        labelClassName: isDisabled
          ? cx(styles.largeButtonLabel)
          : cx(styles.largeButtonLabel, styles.Cursor),
        src: rightArrow,
        imageClassname: styles.largeButtonIcon,
        loaderClassname: styles.largeButtonLoader,
      };
      break;

    case 'large':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.LargeButton,
          )
          : cx('btn', styles.DefaultButton, styles.LargeButton),
        labelClassName: cx('pt-1', styles.paddingTop),
        loaderClassname: styles.largeButtonLoader,
      };
      break;

    case 'mediumWithArrow':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.MediumButton,
          )
          : cx(
            'btn',
            styles.DefaultButton,
            styles.MediumButton,
          ),
        labelClassName: cx(styles.mediumButtonLabel, labelStyle),
        src: rightArrow,
        imageClassname: styles.mediumButtonIcon,
        loaderClassname: styles.mediumButtonLoader,
      };
      break;

    case 'medium':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.MediumButton,
          )
          : cx(
            'btn',
            styles.DefaultButton,
            styles.MediumButton,
          ),
        labelClassName: cx(styles.paddingTop),
        loaderClassname: styles.mediumButtonLoader,
      };
      break;

    case 'add':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx('btn', styles.DisabledButton, styles.AddButton)
          : cx('btn', styles.DefaultButton, styles.AddButton, {
            [`${styles.secondary}`]: isSecondary,
          }),
        isIconBeforeLabel: true,
        src: isSecondary ? addBlue : add,
        imageClassname: cx(styles.mediumAddIcon, styles.paddingTop),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'addDropdown':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx('btn', styles.DisabledButton, styles.AddButton)
          : cx('btn', styles.DefaultButton, styles.AddButton),
        src: icon1 || whiteDropdown,
        imageClassname: cx(styles.mediumDropdownIcon, IconStyle),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'addMini':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledMiniButton,
            styles.AddMiniButton,
          )
          : cx(
            'btn',
            styles.DefaultMiniButton,
            styles.AddMiniButton,
          ),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'edit':
      buttonProps = {
        buttonClassName: cx(
          'btn',
          styles.DisabledButton,
          styles.EditMode,
        ),
        isIconBeforeLabel: true,
        src: edit,
        imageClassname: cx(styles.EditIcon, styles.paddingTop),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'cancel':
      buttonProps = {
        buttonClassName: cx('btn', styles.cancelButton),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'custom':
      buttonProps = {
        buttonClassName: cx(
          'btn',
          styles.DisabledButton,
          styles.EditMode,
        ),
        src: icon1,
        isIconBeforeLabel: true,
        labelClassName: cx(labelStyle, styles.paddingTop),
        imageClassname: cx(styles.EditIcon, IconStyle),
      };
      break;

    case 'smallWithArrow':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.SmallButton,
          )
          : cx('btn', styles.DefaultButton, styles.SmallButton),
        labelClassName: styles.SmallButtonLabel,
        src: rightArrow,
        imageClassname: styles.SmallButtonIcon,
        loaderClassname: styles.smallButtonLoader,
      };
      break;

    case 'print':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx('btn', styles.printButtonDisabled)
          : cx('btn', styles.printButton),
        isIconBeforeLabel: true,
        src: printIcon,
        labelClassName: cx('ml-2', styles.paddingTop),
      };
      break;

    case 'secondaryButton':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx('btn', styles.DisabledButton)
          : cx('btn', styles.DefaultSecondaryButton),
        labelClassName: cx(styles.paddingTop),
      };
      break;
    case 'secondaryButtonWithArrow':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx('btn', styles.DisabledButton)
          : cx('btn', styles.DefaultSecondaryButtonWithArrow),
        src: blueArrow,
        imageClassname: cx(styles.SecondaryButtonArrow, arrowStyle),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'whiteButton':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx('btn', styles.DisabledButton)
          : cx('btn', styles.WhiteButton),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'upload':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.MediumButton,
          )
          : cx(
            'btn',
            styles.DefaultButton,
            styles.MediumButton,
          ),
        isIconBeforeLabel: true,
        imageClassname: 'pr-2',
        src: uploadWhite,
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'noButton': {
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.MediumButton,
            styles.noButton,
          )
          : cx(
            'btn',
            styles.DefaultButton,
            styles.MediumButton,
            styles.noButton,
          ),
        labelClassName: cx(styles.paddingTop),
      };
      break;
    }

    case 'yesButton': {
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.MediumButton,
            styles.yesButton,
          )
          : cx(
            'btn',
            styles.DefaultButton,
            styles.MediumButton,
            styles.yesButton,
          ),
        labelClassName: cx(styles.paddingTop),
      };
      break;
    }

    case 'newTab':
      buttonProps = {
        buttonClassName: isDisabled
          ? cx('btn', styles.DisabledButton, styles.AddButton)
          : cx('btn', styles.DefaultButton, styles.AddButton, {
            [`${styles.secondary}`]: isSecondary,
          }),
        isIconBeforeLabel: true,
        src: isSecondary ? upArrowBlue : upArrowWhite,
        imageClassname: cx(styles.mediumArrowIcon, styles.paddingTop),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'delete':
      buttonProps = {
        buttonClassName: cx('btn', styles.deleteBtn),
        isIconBeforeLabel: true,
        src: deleteIcon,
        imageClassname: cx(styles.paddingTop, styles.deleteImg),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'deleteWithBackground':
      buttonProps = {
        buttonClassName: cx('btn', styles.deleteWithBackgroundBtn),
        isIconBeforeLabel: true,
        src: deleteIcon,
        imageClassname: cx(styles.paddingTop, styles.deleteImg),
        labelClassName: cx(styles.paddingTop),
      };
      break;

    case 'customRightIcon':
      buttonProps = {
        buttonClassName: cx(
          'btn',
          styles.DisabledButton,
          styles.EditMode,
        ),
        src: icon1,
        labelClassName: cx(labelStyle, styles.paddingTop),
        imageClassname: cx(styles.EditIcon, IconStyle),
      };
      break;

    default:
      buttonProps = {
        buttonClassName: isDisabled
          ? cx(
            'btn',
            styles.DisabledButton,
            styles.MediumButton,
          )
          : cx(
            'btn',
            styles.DefaultButton,
            styles.MediumButton,
          ),
        labelClassName: cx(styles.paddingTop),
      };
      break;
  }
  const {
    buttonClassName, labelClassName, src, imageClassname, isIconBeforeLabel, loaderClassname,
  } = buttonProps;
  return (
    <Fragment key={type}>
      <span>
        <button
          id={id}
          type={isButtonSubmit ? 'submit' : 'button'}
          className={cx(buttonClassName, className)}
          onClick={clickHandler}
          disabled={isDisabled}
        >
          {src && !loaderProps?.isLoading && isIconBeforeLabel && <img src={loadAsset(src)} className={imageClassname} alt="buttonimage" /> }
          <label
            htmlFor="button"
            className={cx(labelClassName, styles.commonLabel,
              isButtonSubmit ? styles.noClickEvents : true)}
          >
            {label}
          </label>
          {src && !loaderProps?.isLoading && !isIconBeforeLabel && <img src={loadAsset(src)} className={imageClassname} alt="buttonimage" /> }
          {loaderProps?.isLoading && (
          <Loader
            type="stepLoaderColor"
            color={styles.white100}
            id="white"
            className={loaderClassname}
            {...loaderProps}
          />
          )}
        </button>
      </span>
    </Fragment>
  );
};

Button.propTypes = {
  /**
   * Type of Button
   */
  type: PropTypes.oneOf([
    'largeWithArrow',
    'large',
    'mediumWithArrow',
    'medium',
    'add',
    'addDropdown',
    'addMini',
    'edit',
    'cancel',
    'custom',
    'smallWithArrow',
    'print',
    'secondaryButton',
    'whiteButton',
    'upload',
    'secondaryButtonWithArrow',
    'save',
    'noButton',
    'yesButton',
    'newTab',
    'delete',
    'default',
    'deleteWithBackground',
    'customRightIcon',
  ]),
  /**
   * if button disabled
   */
  isDisabled: PropTypes.bool,
  /**
   * additional button overriding class
   */
  className: PropTypes.string,
  /**
   * on button click
   */
  clickHandler: PropTypes.func,
  /**
   * button label
   */
  label: PropTypes.string.isRequired,
  /**
   * label classname to override label style
   */
  labelStyle: PropTypes.string,
  /**
   * icon path for button
   */
  icon1: PropTypes.string,
  /**
   * icon classname to override icon style
   */
  IconStyle: PropTypes.string,
  /**
   * arrow styles for type secondaryButtonWithArrow
   */
  arrowStyle: PropTypes.string,
  /**
   * true if button is secondary button
   */
  isSecondary: PropTypes.bool,
  /**
   * loader props
   */
  loaderProps: PropTypes.object,
  id: PropTypes.string,
};

Button.defaultProps = {
  type: 'default',
  isDisabled: false,
  className: '',
  labelStyle: '',
  icon1: '',
  IconStyle: '',
  arrowStyle: '',
  clickHandler: () => null,
  isSecondary: false,
  loaderProps: {
    isLoading: false,
  },
  id: '',
};

export default Button;
