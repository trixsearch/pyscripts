/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import _ from 'lodash';
import cx from 'classnames';
import scrollStyle from '../../../ScrollBar.module.scss';
import TraverseCard from '../TraverseCard/TraverseCard';
import styles from './TraverseCol.module.scss';

class TraverseCol extends Component {
    handleSelectAll = () => {
      let selectedArray = this.props.tagList;
      selectedArray = selectedArray.filter((tg) => tg.allowSelect !== false);
      this.props.selectAllTags(selectedArray);
    }

    handleShowSelectAll = () => {
      const {
        showSelectAll, addedTags, tagList, singleTagSelection, selectionType, tagType,
      } = this.props;
      if (selectionType != null && selectionType !== tagType) {
        return false;
      }
      let addedtagFromCol = 0;
      _.forEach(addedTags, (addedtag) => {
        _.forEach(tagList, (tag) => {
          if (tag.uuid === addedtag.uuid) {
            addedtagFromCol += 1;
          }
        });
      });
      return !singleTagSelection && showSelectAll && addedtagFromCol !== tagList.length;
    }

    render() {
      const {
        tagList, disableTags, tagType, category, arrayIndex, isTagColumn,
        selectedId, addedTags, updateTag, SectionStyle, cardStyle, ActiveClass,
        SectionHead, disabled, selectionType, sharedTagQuery, orgId,
      } = this.props;
      const showSelectAll = this.handleShowSelectAll();
      const tagListCard = tagList.map((tag) => {
        let isDisabled = false;
        if (disableTags !== undefined) {
          isDisabled = _.includes(disableTags, tag.uuid);
        }
        return (
          <TraverseCard
            key={tag.uuid}
            orgId={orgId}
            name={tag.name}
            id={tag.uuid}
            tag={tag}
            isDisabled={isDisabled}
            tagType={tagType}
            category={category}
            selectionType={selectionType}
            arrayIndex={arrayIndex}
            isTag={isTagColumn}
            isSelected={selectedId === tag.uuid}
            markSelected={this.handleSelectedTag}
            addedTags={addedTags}
            updateTag={updateTag}
            SectionStyle={SectionStyle}
            cardStyle={cardStyle}
            ActiveClass={ActiveClass}
            disabled={disabled}
            sharedTagQuery={sharedTagQuery}
            allowSelect={tag.allowSelect}
          />
        );
      });
      return (

        <div className={cx(styles.SectionStyle, scrollStyle.scrollbar)}>
          <div className="d-flex">
            <span className={cx(styles.sectionHead, SectionHead)}>{tagType}</span>
            {showSelectAll
              ? (
                <div
                  onClick={this.handleSelectAll}
                  className={cx('ml-auto', styles.selectAllBtn)}
                  aria-hidden
                >
                  select all
                </div>
              ) : null}
          </div>
          <br />
          <span>
            {tagListCard}
          </span>
        </div>

      );
    }
}

export default TraverseCol;
