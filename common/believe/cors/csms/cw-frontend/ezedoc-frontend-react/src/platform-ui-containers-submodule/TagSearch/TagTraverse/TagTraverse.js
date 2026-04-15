/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import { withRouter } from 'react-router';
import scrollStyle from '../../ScrollBar.module.scss';
import * as actions from './Store/action';
import TraverseCol from './TraverseCol/TraverseCol';
import styles from './TagTraverse.module.scss';
import Loader from '../../../components/Organism/Loader/Loader';

class TagTraverse extends Component {
  componentDidMount() {
    const { sharedTagQuery, orgId } = this.props;
    this.props.onGetTagList(orgId, this.props.category, sharedTagQuery);
  }

  componentDidUpdate(prevProps) {
    const { sharedTagQuery, orgId } = this.props;
    if (this.props.orgId !== prevProps.orgId || this.props.category !== prevProps.category) {
      this.props.onGetTagList(orgId, this.props.category, sharedTagQuery);
    }
  }

  componentWillUnmount() {
    this.props.onInitState();
  }

  render() {
    const { orgId } = this.props;
    const tagColumns = this.props.tagsArray.map((tagColumn, index) => (
      <React.Fragment key={index}>
        <TraverseCol
          key={index}
          orgId={orgId}
          tagList={tagColumn.tagList}
          disableTags={this.props.disableTags}
          tagType={tagColumn.tagType}
          category={this.props.category}
          selectionType={this.props.type}
          tagId={tagColumn.tagId}
          selectedId={tagColumn.selectedId}
          selectedTag={tagColumn.selectedTag}
          arrayIndex={index}
          addedTags={this.props.tags}
          updateTag={this.props.updateTag}
          SectionHead={this.props.SectionHead}
          cardStyle={this.props.cardStyle}
          ActiveClass={this.props.ActiveClass}
          singleTagSelection={this.props.singleTagSelection}
          showSelectAll={this.props.showSelectAll}
          selectAllTags={this.props.selectAllTags}
          disabled={this.props.disabled}
          sharedTagQuery={this.props.sharedTagQuery}
        />
      </React.Fragment>
    ));

    return (
      <>

        {this.props.tagTraverseState === 'LOADING'
          ? (this.props.assign
            ? <Loader type="tagSearchModal" assign /> : <Loader type="tagSearchModal" />)
          : (
            <div className={cx(styles.scroll, scrollStyle.scrollbar, this.props.traverseHeight)}>
              <div
                className={cx(
                  styles.SectionAli,
                  this.props.SectionStyle,
                  this.props.traverseHeight,
                )}
              >
                {tagColumns}
              </div>
            </div>
          )}
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  tagsArray: state.tagTraverse?.tagsArray||[],
  tagTraverseState: state.tagTraverse?.getTagTraverseState,
});

const mapDispatchToProps = (dispatch) => ({
  onInitState: () => dispatch(actions.initState()),
  onGetTagList: (orgId, category, sharedTagQuery) => dispatch(
    actions.getTagTraverse(orgId, category, sharedTagQuery),
  ),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TagTraverse));
