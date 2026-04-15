import React, { Component, Fragment } from "react";
import { connect } from "react-redux";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { dashboardSteps, dashboardTourOptions } from 'containers/Shepherd/DashboardSteps'

import "./Dashboard.css"
import * as actions from '../../store/actions/index';
import * as constants from '../../Data/constants'

import { isMobile } from '../utils';
import BulkImport from "../../components/UI/DocumentUpload/BulkImport";
import { Button } from "../../components/UI/AppButton/AppButton";
import Spinner from "../../components/UI/Spinner/Spinner";
import { addToast } from "../../components/Toast/actions";
// import FilterDropdown from "../../components/UI/FilterDropdown/FilterDropdown";
import DashboardConfigWidgets from '../Config/View/DashboardConfig/DashboardConfigWidgets';
import ProcessContainer from "./ProcessContainer/ProcessContainer"
import './WorkflowFloatingDropdown.css';
import routes from "../../urls";
import { HasAccess } from "../../platformDataStoreContext";
import HasWorkflowPermission from "../../components/UI/HasWorkflowPermission";
import UnauthorizedPage from "../UnauthorizedPage";
import { EmptyProcess } from "../Process/ProcessComponents";

const APP_URL = process.env.REACT_APP_APP_URL;

// const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultGrid = [{
    grid: {
        x: 0, y: 0, w: 12, h: 5, isDraggable: false, isResizable: false
    },
    type: "processCount"
},
{
    grid: {
        x: 0, y: 5, w: 6, h: 1, isDraggable: false, isResizable: false
    },
    type: "myTaskCount"
},
{
    grid: {
        x: 6, y: 5, w: 6, h: 1, isDraggable: false, isResizable: false
    },
    type: "groupTaskCount"
}]

class Dashboard extends Component {
    state = {
        bulk_intitiate_modal: false,
        bulk_process: {
            id: null,
            name: ""
        }
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;

        let isNewUserAutoStart = false;
        if (window.location.pathname.includes('/dashboard')) {
            isNewUserAutoStart = window.location.search.includes('newUser=true')
        }
        this.props.updateShepherdTourData(
            dashboardSteps,
            dashboardTourOptions,
            isNewUserAutoStart
        )
        this.props.showTourButtonHandler(true);
        this.props.onDashboardLoad(orgId)
    }

    componentWillUnmount() {
        this.props.unMountWidgetData()
    }
    
    StartANewProcess = () => {
      const orgId = this.props.match?.params?.uuid;
      if(this.props?.appData?.is_admin_initiable) {
          if(this.props.appData.is_process_initiable_from_app_context) {
              this.props.addToast('error', 'Error', 'This process can not be initiated from this view.')
          } else{
              this.props.history.push({
                  pathname: routes.START_NEW_PROCESS.to(orgId, this.props.appData.id),
                  state: {
                      redirectTo: `${this.props.location.pathname}${this.props.location.search}`,
                      returnBackTo: `${this.props.location.pathname}${this.props.location.search}`
                  }
              });
          }
      } else {
          props.addToast('error', 'Error', 'Sorry! This process can only be initiated by an external user by clicking on the web link or scanning the QR code.')
      }  
  }

    showChartData = (startMonth, startYear, endMonth, endYear, id) => {
        const orgId = this.props.match?.params?.uuid;
        if (id) {
            this.props.onChartFilter(orgId, startMonth, startYear, endMonth, endYear, id);
        }
    }

    handleBulkModal = (value, bulk_process = {}) => {
        this.setState({
            bulk_intitiate_modal: value,
            bulk_process
        })
    }

    render() {
        const orgId = this.props.match?.params?.uuid;

        let configDashboard = []
        if (this.props.dashboardView) {
            if (this.props.dashboardView.grid_data) {
                configDashboard = this.props.dashboardView.grid_data
            } else {
                configDashboard = defaultGrid
            }
        }

        let dashboard = null;
        let showDashDetails = null;

        let dashboardGrid = []
        configDashboard.map((item) => {
            let newGrid = item
            newGrid.grid.isResizable = false
            newGrid.grid.isDraggable = false
            if (isMobile()) {
                if (item.type === "processCount") {
                    newGrid.grid = {
                        x: 0, y: 0, w: 7, h: 3.5, minH: 3, minW: 5, isDraggable: false, isResizable: false
                    }
                    dashboardGrid.push(newGrid)
                }
                if (item.type === "myTaskCount" || item.type === "groupTaskCount") {
                    dashboardGrid.push(newGrid)
                }
            } else {
                dashboardGrid.push(newGrid)
            }
            return newGrid
        })

        showDashDetails = (
            <div className="main_changable_container dashboard_container" style={isMobile() ? { 'paddingTop': 0, 'height': window.innerHeight - 59 } : { minHeight: "500px" }}>
                {!this.props.dashboardView ? <Spinner /> : null}

                {/* <ResponsiveGridLayout
                    className="layout responsive-main-container"
                    rowHeight={100}
                    breakpoints={{
                        lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0
                    }}
                    cols={{
                        lg: 12, md: 12, sm: 6, xs: 4, xxs: 2
                    }}
                    margin={[0, 0]}
                > */}
                    {dashboardGrid.map((item, index) => {

                        return (
                            <div
                                className="responsive-containers"
                                key={`${index + 1}__`}
                                data-grid={item.grid}
                            >
                                {item.type === "processCount"
                                    ? (
                                        <ProcessContainer
                                            chartError={this.props.chartError}
                                            showChartData={this.showChartData}
                                            chartContentLoader={this.props.chartContentLoader}
                                            chart={this.props.chart}
                                        />
                                    ) : (
                                      <div className="config_widgets_container">
                                        <DashboardConfigWidgets
                                            item={item}
                                            index={index}
                                            navlink="true"
                                            orgId={this.props.match?.params?.uuid}
                                        />
                                      </div>
                                    )}
                            </div>
                        )
                    })}
                {/* </ResponsiveGridLayout> */}
            </div>
        )

        dashboard = (

          // code commented on the bulk and start new button sourabh
            <>
                <div className={isMobile() ? 'dashboard_top_nav_btn body_nav_button_mobile' : 'dashboard_top_nav_btn body_nav_button'} style={{ 'display': 'flex' }} >
                    {!isMobile()&& (
                      this?.props?.allApps?.length!==0 && (
                      <>
                        <HasWorkflowPermission
                            permissions={[constants.WORKFLOW_BULKINITIATE]}
                            workflowId={this.props.appData?.id}
                            yes={() => (
                                <Button
                                    variant="secondary"
                                    onClick={() => this.handleBulkModal(true, {
                                        id: this.props.appData?.id,
                                        name: this.props.appData?.name
                                    })}
                                >
                                    Start Bulk
                                </Button>
                            )}
                        />
                      </>
                    )
                        )}
                    {(this.props.allApps && this.props.allApps.length)
                        ? (
                            <HasWorkflowPermission
                                permissions={[constants.WORKFLOW_INITIATE]}
                                workflowId={this.props.appData?.id}
                                yes={() => (
                                    <button
                                        type="button"
                                        onClick={this.StartANewProcess}
                                        className="fancy_btn active pull-right"
                                        style={{marginLeft: 10}}
                                    >
                                        Start New
                                    </button>
                                )}
                            />
                        )
                        : null}
                </div>
                {showDashDetails}
            </>
        )


        return (

            <Fragment>
                <BulkImport
                    show={this.state.bulk_intitiate_modal}
                    handleShow={this.handleBulkModal}
                    url={`${APP_URL}/${this.props.match?.params?.uuid}/apps/${this.state.bulk_process.id}/bulk_initiate`}
                    title={`Bulk Initiate ${this.state.bulk_process.name} Process.`}
                    history={this.props.history}
                    redirectUrl={`/custom-workflow/org/${orgId}/process/import-history`}
                />
                    <HasAccess
                        permissions={[constants.CW_SERVICE_DASHBOARD_VIEW]}
                        yes={() => (
                            <div>
                                {dashboard}
                            </div>
                        )}
                        no={() => (
                            <UnauthorizedPage />
                        )}
                    />
                    {!!(this.props.dashboardView && this.props.allApps?.length <= 0) &&
                        <HasAccess
                            permissions={[constants.CW_SERVICE_TASKS_VIEW]}
                            no={() => (
                                <EmptyProcess message="There is nothing here for you!"  />
                            )}
                        />
                    }
            </Fragment>
        );
    }
}

const mapStateToProps = state => {
    return {
        allApps: state.dashboard.apps,
        appData: state.dashboard.app,
        chart: state.chart.data,
        chartError: state.chart.error,
        chartContentLoader: state.chart.chartContentLoader,
        updateType: state.websocket.updateType,
        dashboardView: state.auth.dashboardView,
        workflow_permissions: state?.auth?.workflow_permissions
    }
}

const mapDispatchToProps = (dispatch) => ({
    onDashboardLoad: (orgId) => dispatch(actions.dashboardDetails(orgId)),
    onChart: (orgId, startMonth, startYear, endMonth, endYear) => dispatch(actions.Chart(orgId, startMonth, startYear, endMonth, endYear)),
    onChartFilter: (orgId, startMonth, startYear, endMonth, endYear, id) => dispatch(actions.filterChart(orgId, startMonth, startYear, endMonth, endYear, id)),
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration)),
    unMountWidgetData: () => dispatch(actions.unmountWidgetData())
})

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
