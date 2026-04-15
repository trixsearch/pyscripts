import React from 'react';
import PropTypes from 'prop-types';
import functn from '../../../assets/images/svg/functionTags.svg';
import functnKey from '../../../assets/images/svg/functionTagsKey.svg';
import custom from '../../../assets/images/svg/customTags.svg';
import customKey from '../../../assets/images/svg/customTagsKey.svg';
import geoDefault from '../../../assets/images/svg/locationTags.svg';
import geoDefaultKey from '../../../assets/images/svg/locationTagsKey.svg';
import { loadAsset } from '../../utils';

const TagIcon = ({ category, hasAccess, className }) => {
  const getIcon = () => {
    switch (category) {
      case 'functional': return ((hasAccess && functnKey) || functn);
      case 'geographical': return ((hasAccess && geoDefaultKey) || geoDefault);
      default: return ((hasAccess && customKey) || custom);
    }
  };

  return (
    <span>
      <img src={loadAsset(getIcon())} alt="tagIcon" className={className} />
    </span>
  );
};

TagIcon.propTypes = {
  /** category for icon */
  category: PropTypes.string,
  /** true or false for a particular icon */
  hasAccess: PropTypes.bool,
  /** className for icon size */
  className: PropTypes.string,
};

TagIcon.defaultProps = {
  category: '',
  hasAccess: false,
  className: '',
};

export default TagIcon;
