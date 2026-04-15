import React, { Suspense } from "react";
import {
  Route,
  Switch,
  Redirect,
  withRouter,
  useParams,
} from "react-router-dom";
import { connect } from "react-redux";

import * as constants from "Data/constants";
// import SideDrawer from "components/Navigation/SideDrawer/SideDrawer"
import Toolbar from "components/Navigation/Toolbar/Toolbar";
import License from "components/License/License";
import Logout from "containers/Login/Logout";
import ErrorPage from "containers/ErrorPage";
import { isMobile } from "containers/utils";
import routes from "../urls";
import Spinner from "../components/UI/Spinner/Spinner";
import { withPlatformData } from "../platformDataStoreContext";

export const PrivateRoute = (privateRouteProps) => {
  const {
    hasPermission, feature, render, ...props
  } = privateRouteProps;
  const { uuid: orgId } = useParams();

  return hasPermission ? (
    <Route
      render={(compProps) => (
        <License feature={feature}>{render(compProps)}</License>
      )}
      {...props}
    />
  ) : (
    <Redirect
      to={`/custom-workflow/org/${orgId}/process${props.history ? props.history.location.search : ""
        }`}
    />
  );
};

const AuthIndexRoute = ({ history, orgId }) => (
  // The substring removes "/org" from pathname ,
  // because we have /org as basename, and if not removed, we will have /org/org<some-path>
  history.location && history.location.state ? (
    <Redirect to={history.location.state.substring(4)} />
  ) : (
    <Redirect to={`/custom-workflow/org/${orgId}/process${history.location.search}`} />
  )
);

class ModularRoutes extends React.Component {
  state = {
    sidenavopen: !isMobile(),
    shepherdTourData: {},
    showTourButton: false,
  };

  shouldComponentUpdate(prevProps, prevState) {
    if (
      prevProps.location.pathname !== this.props.location.pathname
      || prevState.sidenavopen !== this.state.sidenavopen
      || this.props.location.search !== prevProps.location.search
      || prevState.shepherdTourData !== this.state.shepherdTourData
      || prevState.showTourButton !== this.state.showTourButton
    )
      return true;
    return false;
  }

  // eslint-disable-next-line consistent-return
  // componentDidUpdate(prevProps) {
  // //  if(prevProps.isVendor!==this.props.isVendor) {
  // //   return this.props.history.push(this.props.isVendor 
  // //    ? `${this.props.match.url}/job`:`${this.props.match.url}/dashboard`)   
  // //  }

  // }

  handleSidebarOpenClose = (isOpenState = null) => {
    this.setState((prevState) => ({
      sidenavopen: isOpenState !== null ? isOpenState : !prevState.sidenavopen,
    }));
  };

  updateShepherdTourData = (steps, tourOptions, autoStart = false) => {
    if (!isMobile()) {
      if (steps && tourOptions) {
        let shepherdTourData = {
          steps,
          tourOptions,
          autoStart,
        };
        this.setState({
          shepherdTourData,
        });
      } else {
        this.setState({
          shepherdTourData: {},
        });
      }
    }
  };

  showTourButtonHandler = (showTourButton) => {
    this.setState({
      showTourButton,
    });
  };


  render() {
    const {
      history, match
    } = this.props;
    const orgId = match?.params?.uuid;
    return (
      <>
        {!history.location.pathname.includes('start-new-embedded-process') ? <Toolbar
          clicked={this.handleSidebarOpenClose}
          hamburger={this.state.sidenavopen}
          shepherdTourData={this.state.shepherdTourData}
          showTourButton={this.state.showTourButton}
        /> : null}
        <div id="body_main_container" className="main_container">
          {/* <div className={this.state.sidenavopen ? "body_container active" : "body_container"}> */}
          <div className="body_container">
            <div
              id="right_side"
              role="presentation"
              onClick={() => (isMobile() && this.state.sidenavopen
                ? this.handleSidebarOpenClose()
                : null)
              }
            >
              <main>
                <Suspense fallback={<Spinner />}>
                  <Switch>
                    {/* <Redirect
                      exact
                      from={match.url}
                      to={this.props.isVendor ? `${match.url}/job`:`${match.url}/dashboard`}
                    /> */}
                    {/* <Redirect 
                      exact
                      from={`${match.url}/dashboard`}
                      to={this.props.isVendor ? `${match.url}/job`:`${match.url}/dashboard`}
                    /> */}
                    {/* <Redirect
                      exact
                      from={`${match.url}/config`}
                      to={`${match.url}/config/users`}
                    /> */}
                    {/* <Redirect
                      exact
                      from={`${match.url}/inventory`}
                      to={`${match.url}/inventory/stock`}
                    />
                    <Redirect
                      exact
                      from={`${match.url}/entity`}
                      to={`${match.url}/entity/${entityList?.[0]?.url}`}
                    /> */}
                    <AuthIndexRoute
                      exact
                      path={`${match.path}/`}
                      history={history}
                      orgId={orgId}
                    />
                    <AuthIndexRoute
                      exact
                      path={`${match.path}/login`}
                      history={history}
                      orgId={orgId}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      path={`${match.path}/logout`}
                      component={(props) => <Logout {...props} />}
                    />
                    <Route
                      exact
                      history={history}
                      path={routes.START_NEW_PROCESS.path}
                      render={(props) => (
                        <routes.START_NEW_PROCESS.component {...props} />
                      )}
                    />
                    <Route
                      exact
                      history={history}
                      path={routes.START_NEW_EMBEDDED_PROCESS.path}
                      render={(props) => (
                        <routes.START_NEW_EMBEDDED_PROCESS.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.PROCESS.path}
                      history={history}
                      render={(props) => (
                        <routes.PROCESS.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.ENTITY.path}
                      history={history}
                      render={(props) => (
                        <routes.ENTITY.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DRISHTI.path}
                      history={history}
                      render={(props) => (
                        <routes.DRISHTI.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.TASKS.path}
                      history={history}
                      render={(props) => <routes.TASKS.component {...props} />}
                    />
                    <PrivateRoute
                      exact
                      path={routes.TASK_DETAILS.path}
                      hasPermission
                      feature
                      history={history}
                      render={(props) => (
                        <routes.TASK_DETAILS.component
                          {...props}
                          handleSidebarOpenClose={this.handleSidebarOpenClose}
                        />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.USERS.path}
                      history={history}
                      render={(props) => <routes.USERS.component {...props} />}
                    /> */}
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.USER_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.USER_CREATE.component {...props} />
                      )}
                    /> */}
                    {/* <PrivateRoute
                      exact
                      path={routes.USER_EDIT.path}
                      hasPermission
                      feature
                      history={history}
                      render={(props) => (
                        <routes.USER_EDIT.component {...props} />
                      )}
                    />
                    {/* <Route
                      exact
                      path={routes.DASHBOARD.path}
                      history={history}
                      render={(props) => (
                        <routes.DASHBOARD.component
                          {...props}
                          updateShepherdTourData={this.updateShepherdTourData}
                          showTourButtonHandler={this.showTourButtonHandler}
                        />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.LOCATION_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.LOCATION_LIST.component {...props} />
                      )}
                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.LOCATION_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.LOCATION_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.LOCATION_EDIT.path}
                      history={history}
                      render={(props) => (
                        <routes.LOCATION_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.GROUP_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.GROUP_LIST.component {...props} />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.GROUP_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.GROUP_CREATE.component {...props} />
                      )}
                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.GROUP_EDIT.path}
                      history={history}
                      render={(props) => (
                        <routes.GROUP_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DEPARTMENT_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.DEPARTMENT_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DEPARTMENT_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.DEPARTMENT_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.PORTALS.path}
                      history={history}
                      render={(props) => (
                        <routes.PORTALS.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.PORTAL_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.PORTAL_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.CONTENTS_ID.path}
                      history={history}
                      render={(props) => (
                        <routes.CONTENTS_ID.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.CONTENTS.path}
                      history={history}
                      render={(props) => (
                        <routes.CONTENTS.component {...props} />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.SMTP_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.SMTP_CREATE.component {...props} />
                      )}
                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DEPARTMENT_EDIT.path}
                      history={history}
                      render={(props) => (
                        <routes.DEPARTMENT_EDIT.component {...props} />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.THEMES.path}
                      history={history}
                      render={(props) => <routes.THEMES.component {...props} />}
                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.PROFILE.path}
                      history={history}
                      render={(props) => (
                        <routes.PROFILE.component {...props} />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.MANAGEACCOUNT.path}
                      history={history}
                      render={(props) => (
                        <routes.MANAGEACCOUNT.component {...props} />
                      )}
                    /> */}
                    {/* <PrivateRoute
                      exact
                      path={routes.CONFIG_VIEW.path}
                      hasPermission
                      feature
                      history={history}
                      render={(props) => (
                        <routes.CONFIG_VIEW.component {...props} />
                      )}
                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.REPORT_SCHEDULE.path}
                      history={history}
                      render={(props) => (
                        <routes.REPORT_SCHEDULE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.REPORT.path}
                      history={history}
                      render={(props) => <routes.REPORT.component {...props} />}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.REPORT_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.REPORT_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.REPORT_EDIT.path}
                      history={history}
                      render={(props) => (
                        <routes.REPORT_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.FORM_BUILDER.path}
                      render={(props) => (
                        <routes.FORM_BUILDER.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.FORM_PREVIEW.path}
                      render={(props) => (
                        <routes.FORM_PREVIEW.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.FORM_EDIT.path}
                      render={(props) => (
                        <routes.FORM_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.ASSET_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.ASSET_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.ASSET_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.ASSET_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.ASSET_EDIT.path}
                      history={history}
                      render={(props) => (
                        <routes.ASSET_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.KIT_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.KIT_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.KIT_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.KIT_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.KIT_EDIT.path}
                      history={history}
                      render={(props) => (
                        <routes.KIT_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DISTRIBUTION_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.DISTRIBUTION_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DISTRIBUTION_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.DISTRIBUTION_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DISTRIBUTION_INTER_TRANSFER_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.DISTRIBUTION_INTER_TRANSFER_LIST.component
                          {...props}
                        />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DISTRIBUTION_OTHER_TRANSFER_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.DISTRIBUTION_OTHER_TRANSFER_LIST.component
                          {...props}
                        />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.DISTRIBUTION_INTER_TRANSFER_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.DISTRIBUTION_INTER_TRANSFER_CREATE.component
                          {...props}
                        />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.STOCK_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.STOCK_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.STOCK_ADJUST.path}
                      history={history}
                      render={(props) => (
                        <routes.STOCK_ADJUST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.STOCK_ADJUST_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.STOCK_ADJUST_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.SUPPLIER_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.SUPPLIER_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.SUPPLIER_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.SUPPLIER_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.SUPPLIER_EDIT.path}
                      history={history}
                      render={(props) => (
                        <routes.SUPPLIER_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.SUPPLY_LIST.path}
                      history={history}
                      render={(props) => (
                        <routes.SUPPLY_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.SUPPLY_CREATE.path}
                      history={history}
                      render={(props) => (
                        <routes.SUPPLY_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.SUPPLY_EDIT.path}
                      history={history}
                      render={(props) => (
                        <routes.SUPPLY_EDIT.component {...props} />
                      )}
                    />
                    {/* <PrivateRoute
                      hasPermission
                      feature
                      path={routes.MASTER.path}
                      render={(props) => <routes.MASTER.component {...props} />}
                    /> */}
                    <PrivateRoute
                      hasPermission
                      feature
                      path={routes.CUSTOM_DATA.path}
                      render={(props) => (
                        <routes.CUSTOM_DATA.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.LOCATION_HISTORY.path}
                      render={(props) => (
                        <routes.LOCATION_HISTORY.component
                          {...props}
                          entity={routes.LOCATION_HISTORY.entity}
                          breadCrumb={routes.LOCATION_HISTORY.breadCrumb}
                        />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.USER_HISTORY.path}
                      render={(props) => (
                        <routes.USER_HISTORY.component
                          {...props}
                          entity={routes.USER_HISTORY.entity}
                          breadCrumb={routes.USER_HISTORY.breadCrumb}
                        />
                      )}
                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.BULK_INITIATE_HISTORY.path}
                      render={(props) => (
                        <routes.BULK_INITIATE_HISTORY.component
                          {...props}
                          entity={routes.BULK_INITIATE_HISTORY.entity}
                          breadCrumb={routes.BULK_INITIATE_HISTORY.breadCrumb}
                        />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.ENTITY_LIST.path}
                      render={(props) => (
                        <routes.ENTITY_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.ENTITY_DETAILS.path}
                      render={(props) => (
                        <routes.ENTITY_DETAILS.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.POLICY_MANAGEMENT.path}
                      render={(props) => (
                        <routes.POLICY_MANAGEMENT.component {...props} />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.CUSTOM_ATTRIBUTES.path}
                      render={(props) => (
                        <routes.CUSTOM_ATTRIBUTES.component {...props} />
                      )}
                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.GROUP_HISTORY.path}
                      render={(props) => (
                        <routes.GROUP_HISTORY.component
                          {...props}
                          entity={routes.GROUP_HISTORY.entity}
                          breadCrumb={routes.GROUP_HISTORY.breadCrumb}
                        />
                      )}
                    />
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.CREATE_DASHBOARD.path}
                      render={(props) => (
                        <routes.CREATE_DASHBOARD.component {...props} />
                      )}
                    /> */}
                    {/* <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.EDIT_DASHBOARD.path}
                      render={(props) => (
                        <routes.EDIT_DASHBOARD.component {...props} />
                      )}
                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.BGV.path}
                      render={(props) => <routes.BGV.component {...props} />}
                    />
                    {/* <PrivateRoute 
                                        exact
                                        hasPermission
                                        feature
                                        path={routes.BGVDETAIL.path}
                                        render={(props) => (<routes.BGVDETAIL.component {...props} />)}
                                    /> */}
                    <PrivateRoute
                      exact
                      hasPermission // TODO: Edit
                      feature // TODO: Edit
                      history={history}
                      path={routes.HIRING.path}
                      render={(props) => <routes.HIRING.component {...props} />}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.JOB_CANDIDATE_HISTORY.path}
                      render={(props) => (
                        <routes.JOB_CANDIDATE_HISTORY.component
                          {...props}
                          entity={routes.JOB_CANDIDATE_HISTORY.entity}
                          breadCrumb={routes.JOB_CANDIDATE_HISTORY.breadCrumb}
                        />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      path={routes.JOB_HISTORY.path}
                      render={(props) => (
                        <routes.JOB_HISTORY.component
                          {...props}
                          entity={routes.JOB_HISTORY.entity}
                          breadCrumb={routes.JOB_HISTORY.breadCrumb}
                        />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.JOB_LIST.path}
                      render={(props) => (
                        <routes.JOB_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      hasPermission
                      feature
                      history={history}
                      path={routes.JOB_VIEW.path}
                      render={(props) => (
                        <routes.JOB_VIEW.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.HIRING_EVENT_LIST.path}
                      render={(props) => (
                        <routes.HIRING_EVENT_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.HEAD_COUNT.path}
                      render={(props) => (
                        <routes.HEAD_COUNT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.HEAD_COUNT_PLAN.path}
                      render={(props) => (
                        <routes.HEAD_COUNT_PLAN.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.REQUISITION.path}
                      render={(props) => (
                        <routes.REQUISITION.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.HIRING_EVENT_CREATE.path}
                      render={(props) => (
                        <routes.HIRING_EVENT_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.HIRING_EVENT_EDIT.path}
                      render={(props) => (
                        <routes.HIRING_EVENT_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.HIRING_PARTNER_LIST.path}
                      render={(props) => (
                        <routes.HIRING_PARTNER_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.HIRING_PARTNER_CREATE.path}
                      render={(props) => (
                        <routes.HIRING_PARTNER_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.HIRING_PARTNER_EDIT.path}
                      render={(props) => (
                        <routes.HIRING_PARTNER_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.JOB_ROLE_LIST.path}
                      render={(props) => (
                        <routes.JOB_ROLE_LIST.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.JOB_ROLE_CREATE.path}
                      render={(props) => (
                        <routes.JOB_ROLE_CREATE.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.JOB_ROLE_EDIT.path}
                      render={(props) => (
                        <routes.JOB_ROLE_EDIT.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.ADD_JOB_CHART_CONFIG.path}
                      render={(props) => (
                        <routes.ADD_JOB_CHART_CONFIG.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.EDIT_JOB_CHART_CONFIG.path}
                      render={(props) => (
                        <routes.EDIT_JOB_CHART_CONFIG.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.ADD_EVENT_CHART_CONFIG.path}
                      render={(props) => (
                        <routes.ADD_EVENT_CHART_CONFIG.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.EDIT_EVENT_CHART_CONFIG.path}
                      render={(props) => (
                        <routes.EDIT_EVENT_CHART_CONFIG.component {...props} />
                      )}
                    />
                    <PrivateRoute
                      exact
                      hasPermission
                      feature
                      history={history}
                      path={routes.SIGNATURE.path}
                      render={(props) => (
                        <routes.SIGNATURE.component {...props} />
                      )}
                    />
                    <Route
                      path="*"
                      component={ErrorPage}
                      history={history}
                    />
                  </Switch>
                </Suspense>
              </main>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default withPlatformData(withRouter(ModularRoutes));
