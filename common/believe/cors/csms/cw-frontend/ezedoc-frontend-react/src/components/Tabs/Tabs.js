/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-destructuring, react/destructuring-assignment */
import React, { cloneElement, memo } from 'react';
import { useHistory, useLocation } from 'react-router';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { isNil } from 'lodash';

import { useMergeState } from '../../utils/hooks';
import styles from './Tabs.module.css';
import { concatToUrl } from '../../utils/misc';
import { HasAccess } from '../../platformDataStoreContext';

let subTabActive = false;

const getTabs = (children, { activeKey, currentUrlPath, baseUrlPath, history }) => {
  // Using this flag to make sure only one tab is set to active at a time.
  // Just to avoid showing multiple tabas, when `title` or `key` or `urlPath`
  // get messed up with non unique values.
  let isSetActive;

  let activeTab;
  const tabs = React.Children.map(children, (node, i) => {
    let tab = null;
    if (React.isValidElement(node)) {
      const key = node.key || node.props.title;
      const urlPath = node.props.urlPath;
      let isActive = false;
      const tabUrlPath = urlPath ? concatToUrl(baseUrlPath || '', urlPath) : null;
      if (!isSetActive) {
        if (tabUrlPath) {
          if (currentUrlPath.includes(tabUrlPath)) isActive = true;
        } else isActive = activeKey ? activeKey === key : i === 0;
      }
      if (tabUrlPath !== currentUrlPath && tabUrlPath?.includes(currentUrlPath)) {
        if(!subTabActive){
          history.push(tabUrlPath);
          subTabActive = true;
          isActive = true;
        }
      }
      tab = {
        ...node.props,
        node,
        key,
        isActive,
        tabUrlPath,
      };
      if (isActive) {
        isSetActive = true;
        activeTab = tab;
      }
    }
    return tab;
  }).filter((tab) => tab);
  return { tabs, activeTab };
};

const TabPane = ({
  children, isActive, className, disabled
}) => {
  return (
    isActive && !disabled && (
      <div className={cx(styles.pane, className)}>
                        {children}
                      </div>
    )
  )
}

const TabNavBar = memo(({
  showSelectBackground, tabs, onClick, toolbarExtras, tabClassName
}) => (
  <div className={styles.navBar}>
    {tabs.map((tab) => !tab.hidden && (
      <HasAccess
        permissions={tab?.permissions}
            yes={() => (
              <div
                key={tab.key}
                role="button"
                tabIndex="0"
                onKeyDown={({ keyCode }) => keyCode === 13 && onClick(tab)}
                className={cx(styles.tab,tabClassName)}
                onClick={() => !tab.disabled && onClick(tab)}
              >
                <div className={cx(
                  styles.tabContent,
                  tab.isActive && styles.tabActive,
                  tab.isActive && showSelectBackground && styles.tabActiveBackground,
                  tab.disabled && styles.disabledTab,
                )}
                >
                  {tab.iconLeft && (
                  typeof tab.iconLeft === 'string' ? <img className={cx(styles.tabIcon, styles.tabIconLeft)} src={tab.iconLeft} alt="" />
                  : tab.iconLeft
                  )}
                  <div className={styles.tabTitle}>{tab.title}</div>
                  {tab.iconRight && (
                  typeof tab.iconRight === 'string' ? <img className={cx(styles.tabIcon, styles.tabIconRight)} src={tab.iconRight} alt="" />
                  : tab.iconRight
                  )}
                </div>
              </div>
            )}
      />
    ))}
    <div className={styles.toolbarExtras}>
      {toolbarExtras}
    </div>
  </div>
));

const Tabs = (props) => {
  const isControlled = !isNil(props.activeTabKey);

  const [state, updateState] = useMergeState({ activeKey: null });
  if (isControlled) state.activeTabKey = props.activeTabKey;
  const activeKey = state.activeKey;
  const setActiveKey = (key) => updateState({ activeKey: key });

  const history = useHistory();
  const location = useLocation();

  const { tabs, activeTab } = getTabs(props.children, {
    activeKey,
    currentUrlPath: location.pathname,
    history,
    baseUrlPath: props.baseUrlPath,
    toolbarExtras: props.toolbarExtras,
  });

  const onSwitchTab = (tab) => {
    if (tab.tabUrlPath) {
      let queryParams = location.search;
      if ((activeTab && !activeTab.shareQueryParams) || !tab.acceptQueryParams) {
        queryParams = null;
      }
      let hash = location.hash;
      if ((activeTab && !activeTab.shareHash) || !tab.acceptHash) {
        hash = null;
      }
      const isHistoryPush = tab.pushHistory !== null ? tab.pushHistory : props.pushHistory;
      subTabActive = false;
      history[isHistoryPush ? 'push' : 'replace']({
        pathname: tab.tabUrlPath,
        search: queryParams,
        hash,
      });
    } else {
      if (props.onSwitchTab) props.onSwitchTab(tab.key);
      if (!isControlled) setActiveKey(tab.key);
    }
  };

  const renderTabPanes = () => tabs.map((tab) => cloneElement(tab.node, {
    key: tab.key,
    isActive: tab.isActive,
    className: cx(props.paneClassName, tab.className),
  }));

  return (
    <div className={cx(styles.container, props.className)}>
      <TabNavBar
        showSelectBackground={props.showSelectBackground}
        tabs={tabs}
        onClick={onSwitchTab}
        toolbarExtras={props.toolbarExtras}
        tabClassName={props.tabClassName}
      />
      {renderTabPanes()}
    </div>
  );
};

Tabs.propTypes = {
  // This will be used to show the active tab.
  // The value should be equal to the `title` or `key` prop of
  // `TabPane` based on whether `key` is provided.
  // If `key` is provided to `TabPane` then the value should be
  // equal to `key`.
  activeTabKey: PropTypes.string,
  onSwitchTab: PropTypes.func,
  // The active tab can also be linked to the browser's URL.
  // In that case the above `activeTabKey` and `onSwitchTab` props
  // will not be used.
  // This value of this prop if provided will be prepended to the URL string
  // to any operation involving the URL, like identifying active tab
  // and replacing the URL when switching tab.
  baseUrlPath: PropTypes.string,
  // By default `history.replace` willbe used for URL based
  // tab switch, when this is set it will use `history.push` instead.
  pushHistory: PropTypes.bool,
  // when `true` the selected tab will have backgrond color
  showSelectBackground: PropTypes.bool,
  className: PropTypes.string,
  paneClassName: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Tabs.defaultProps = {
  activeTabKey: null,
  onSwitchTab: null,
  baseUrlPath: null,
  pushHistory: false,
  showSelectBackground: false,
  className: null,
  paneClassName: null,
};

TabPane.propTypes = {
  /* eslint-disable react/no-unused-prop-types */
  title: PropTypes.string.isRequired,
  // By default title will be used as `key` to render the tab-panes
  // and tab-bars, but in case title cannot be unique you can use key prop
  // to provide unique value for key.
  key: PropTypes.string,
  // When provided used browsers's URL to set active tab and
  // replaces URL when the tab switches. Combined with `baseUrlPath`
  // of `Tabs` a tab can be tied to any arbitary URL.
  urlPath: PropTypes.string,
  // override `Tabs.pushHistory` for a specific tab.
  pushHistory: PropTypes.bool,
  /**
   * Share the query-params to next tab when moving away from this tab.
   */
  shareQueryParams: PropTypes.bool,
  /**
   * Share the URL hash to next tab when moving away from this tab.
   */
  shareHash: PropTypes.bool,
  /**
   * Accept the query-params from prev tab when moving in to this tab.
   */
  acceptQueryParams: PropTypes.bool,
  /**
   * Accept the URL hash from prev tab when moving in to this tab.
   */
  acceptHash: PropTypes.bool,
  /* eslint-enable react/no-unused-prop-types */
  children: PropTypes.node.isRequired,
  /**
   * Disable the tab. Diable the tab-click and
   * show noting when landed on tab using url navigation.
   */
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

TabPane.defaultProps = {
  className: null,
  key: null,
  urlPath: null,
  pushHistory: null,
  shareQueryParams: false,
  shareHash: false,
  acceptQueryParams: true,
  acceptHash: true,
  disabled: false,
};

export default Tabs;
export { TabPane, TabNavBar };
