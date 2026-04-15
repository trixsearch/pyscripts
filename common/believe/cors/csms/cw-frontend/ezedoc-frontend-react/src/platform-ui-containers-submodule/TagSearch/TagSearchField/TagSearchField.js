/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-shadow */
/* eslint-disable max-len */
/* eslint-disable no-return-assign */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import { withRouter } from 'react-router';
import _ from 'lodash';
import { connect } from 'react-redux';
import cx from 'classnames';
import TagIcons from '../../../components/Atoms/TagIcons';
import scrollStyle from '../../ScrollBar.module.scss';
import * as actions from '../Store/action';
import styles from './TagSearchField.module.scss';
import search from '../../../assets/images/svg/search-small.svg';
import close from '../../../assets/images/svg/closeNotification.svg';
import right from '../../../assets/images/svg/right.svg';

class TagSearchField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryString: '',
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClick, false);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.queryString !== this.state.queryString) {
      if (this.state.queryString.length !== 0) {
        this.props.onGetTagList(this.props.orgId, this.props.category, this.props.type, this.state.queryString, this.props.name, this.props.vendorId, this.props.clientId, this.props.usedIn, this.props.subVendorId, this.props.superClientId);
      } else {
        this.props.onInitState();
      }
    }
    document.querySelector('#inputTagField').reportValidity();
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick, false);
    this.props.onInitState();
  }

  handleInputChange = (event) => {
    this.setState({
      queryString: event.target.value,
    });
  };

  handleSelectTag = (targetIndex) => {
    const selecteTag = _.cloneDeep(this.props.data[this.props.name][targetIndex]).pop();

    this.props.updateTag({ value: selecteTag }, 'add');
    this.props.onInitState();
    this.setState({ queryString: '' });
  }

  handleClose = () => {
    this.props.onInitState();
  }

  handleClick = (event) => {
    if (this.dropDownDiv) {
      if (!this.dropDownDiv.contains(event.target)) {
        this.handleClose();
      }
    }
  }

  render() {
    const { name, hideSearchIcon = false, isReportsPage } = this.props;
    return (
      <>
        {this.props.label ? ( <label className={cx(styles.labelText, this.props.labelText, 'mt-3')}> 
          <span>
            {this.props.label}
          </span>
          <span className={styles.requiredStar}>{isReportsPage ? '*' : null}</span>
        </label> ) : null}
        <div className={cx(this.props.BarStyle, this.props.noBorder ? null : styles.tagBar, this.props.searchBarWrapper)}>
          {!hideSearchIcon ? <img src={search} alt="search" className={cx('pb-1 pl-1 mr-1', this.props.imgSize)} /> : null}
          {
            this.props.tags && !this.props.hideTagsInInput ? this.props.tags.map((tag, index) => (
              <div key={index} className={styles.tagButtons}>
                <TagIcons
                  hasAccess={tag.hasAccess}
                  category={tag.category}
                  className={cx('pr-2 ml-1', styles.tagHeight)}
                />
                {tag.name}
                &nbsp;
                <img
                  src={close}
                  alt="search"
                  onClick={
                    !this.props.disabled ? () => this.props.updateTag({ value: tag }, 'delete')
                      : undefined
                  }
                  className={!this.props.disabled ? cx(styles.close, 'ml-2') : cx(styles.closeDisable, 'ml-2')}
                />
              </div>
            )) : null
          }
          <input
            id="inputTagField"
            name={this.props.name}
            className={cx(' ml-1 px-0 ', styles.searchBar, this.props.className)}
            type="text"
            value={this.state.queryString}
            placeholder={this.props.placeholder}
            onChange={(event) => this.handleInputChange(event)}
            disabled={this.props.disabled}
            autoComplete="off"
            required={this.props.isRequired}
            {...this.props.searchBarProps}
          />
          {!_.isEmpty(this.props.data[name])
            ? (
              <div className={cx(styles.dropdownMenu, scrollStyle.scrollbar, this.props.dropdownMenu)}>

                {this.props.data[name].map((searchArr, index) => {
                  const searchLength = searchArr.length;
                  if (this.props.disableTags !== undefined && _.includes(this.props.disableTags, searchArr[searchLength - 1].uuid)) {
                    return null;
                  }
                  return (

                    <div
                      key={index}
                      className={styles.tagDropDown}
                      onClick={(() => this.handleSelectTag(index))}
                      ref={(dropDownDiv) => this.dropDownDiv = dropDownDiv}
                    >
                      {searchArr.map((ser, index) => (

                        <div key={index} className={cx(styles.iconStyle)}>
                          <TagIcons
                            hasAccess={ser.hasAccess}
                            category={ser.category}
                            className={styles.iconSize}
                          />
                          <span className="pl-2">
                            {index !== (searchArr.length - 1)
                              ? (
                                <span>
                                  {ser.name}
                                  <img src={right} height="12px" alt="right" className="mx-3" />
                                </span>
                              )
                              : <span className={styles.searchText}>{ser.name}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )
            : null}

        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  getDataState: state.tagSearch?.getDataState,
  data: state.tagSearch?.data||[],
});

const mapDispatchToProps = (dispatch) => ({
  onInitState: () => dispatch(actions.initState()),
  onGetTagList: (orgId, category, type, key, name, vendorId, clientId, usedIn, subVendorId, superClientId) => dispatch(actions.getTagList(orgId, category, type, key, name, vendorId, clientId, usedIn, subVendorId, superClientId)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TagSearchField));
