/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import forEach from 'lodash/forEach';
import cx from 'classnames';
import { withRouter } from 'react-router';
import  TagIcons from '../../../../components/Atoms/TagIcons';
import Tooltip from '../../../../components/Atoms/Tooltip'
import * as actions from '../Store/action';
import styles from './TraverseCard.module.scss';
import arrow from '../../../../assets/images/svg/dropdownArrow.svg';
import check from '../../../../assets/images/svg/rightNavTick.svg';
import uncheck from '../../../../assets/images/svg/greyCircle.svg';

class TraverseCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAdded: false,
      showAddIcon: false,
    };
  }

  componentDidMount() {
    this.handleShowAdded();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.addedTags !== this.props.addedTags || this.props.tag !== prevProps.tag) {
      this.handleShowAdded();
    }
  }

    handleShortenTagName = (tagName) => {
      const maxLength = 17;
      if (tagName.length > maxLength) {
        const updatedName = `${tagName.substring(0, maxLength)}...`;
        return (updatedName);
      }
      return (tagName);
    }

    handleShowAdded() {
      let isAdded = false;
      const { id } = this.props;
      forEach(this.props.addedTags, (addedtag) => {
        if (addedtag.uuid === id) {
          isAdded = true;
        }
      });
      this.setState({ isAdded });
    }

    handleGetSubTagsList = () => {
      const { sharedTagQuery, orgId } = this.props;
      this.props.onGetSubTagList(this.props.arrayIndex, this.props.id,
        this.props.name, orgId, this.props.tag.category, sharedTagQuery);
    }

    handleSelectTag = (event) => {
      event.stopPropagation();
      if (!this.props.isDisabled) {
        if (this.state.isAdded) this.props.updateTag({ value: this.props.tag }, 'delete');
        else this.props.updateTag({ value: this.props.tag }, 'add');
      }
    }

    render() {
      const { selectionType, tagType, allowSelect } = this.props;
      // eslint-disable-next-line max-len
      let allowSelection = selectionType != null ? (selectionType.trim().toLowerCase() === tagType.trim().toLowerCase()) : true;
      if (allowSelect === false) {
        allowSelection = false;
      }
      return (
        <>
          <div
            className={cx(styles.FolderAlign, this.props.cardStyle, this.props.isSelected
              ? (styles.FolderActive, this.props.ActiveClass) : null)}
            onClick={this.handleGetSubTagsList}
            onMouseEnter={allowSelection ? () => this.setState({ showAddIcon: true }) : null}
            onMouseLeave={() => this.setState({ showAddIcon: false })}
            data-for={this.props.name} data-tip={this.props.name}
          >

            <span
              className={this.props.isDisabled ? styles.disableSelection : null}
            >
              <TagIcons
                category={this.props.tag.category}
                hasAccess={this.props.tag.hasAccess}
              />

                        &nbsp; &nbsp;
            </span>
            <span>
              {this.handleShortenTagName(this.props.name)}
              {this.props.name.length > 17 ?
                <Tooltip
                  id={this.props.name}
                  arrowColor="transparent"
                  place="top"
                  type="info"
                >
                  {this.props.name}
                </Tooltip> : null}
            </span>

            <div onClick={(event) => (this.props.disabled ? null : this.handleSelectTag(event))} className={cx('ml-auto', this.props.disabled ? styles.disabled : null)}>
              {this.state.showAddIcon && !this.state.isAdded
                ? (
                  <>
                    <img src={uncheck} alt="lock" style={{ height: '15px', marginRight: '0.5rem' }} />
                    <span className={styles.verticalLine} />
                  </>
                )
                : this.state.isAdded
                  ? (
                    <>
                      {' '}
                      <img src={check} alt="lock" style={{ height: '14px', marginRight: '0.5rem' }} />
                      <span className={styles.verticalLine} />
                    </>
                  )
                  : null}

            </div>

            {this.props.tag.hasChildren
              ? <><img src={arrow} alt="arrow" className={cx(styles.arrow)} /></>
              : null}

          </div>
          <br />
        </>
      );
    }
}

const mapDispatchToProps = (dispatch) => ({
  onGetSubTagList: (arrayIndex, tagId, tagName, orgId, category, sharedTagQuery) => dispatch(
    actions.getSubTagTraverse(arrayIndex, tagId, tagName, orgId, category, sharedTagQuery),
  ),
});

export default withRouter(connect(null, mapDispatchToProps)(TraverseCard));
