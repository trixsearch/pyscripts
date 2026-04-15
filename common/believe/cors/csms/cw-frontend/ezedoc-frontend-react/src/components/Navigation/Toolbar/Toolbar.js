/* eslint-disable react/prefer-stateless-function */
import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { withRouter } from 'react-router-dom';

// import userImage from '../../../assets/images/svg/userprofile.svg';
import Notification from '../../Notification/notification';
// import WebsocketComp from '../../../containers/Websocket/Websocket';
// import SearchBar from './searchBar';
// import Hamburger from '../../UI/Hamburger/Hamburger';
// import { isMobile } from '../../../containers/utils';

import "./Toolbar.css";
import Navbar from "../Navbar/Navbar";
import BreadCrumbs from "../../UI/BreadCrumbs/BreadCrumbs";
// import routes from "../../../urls";
import { withPlatformData } from '../../../platformDataStoreContext';
import BackArrow from '../../../assets/images/svg/back_arrow.svg';
import { toggleTaskHomeScreen } from "../../../store/actions";
import { CURRENT_TASK_SIZE } from "../../../containers/Tasks/TaskConstants";

const navRoutes=[
    { name: "Business Flow", path: ""},
    // { name: "", path: "/dashboard" },
    { name: "Tasks", path: "/tasks" },
    // { name: "Hiring", path: "/hiring" },
    { name: "Requests", path: "/job" },
    { name: "Applicants", path: "/job/:id/applicants" },
    { name: "Slots", path: "/job/:id/slots" },
    { name: "Events", path: "/event" },
    { name: "Head Count", path: "/hiring/headcount" },
    { name: "Background Verification", path: "/bgv" },
    { name: "Processes", path: "/process" },
    { name: "Config", path: "/config" },
    { name: "Vendors", path: "/partner" },
    { name: "Job Roles", path: "/config/jobrole" },
    { name: "Users", path: "/config/users" },
    { name: "Groups", path: "/config/groups" },
    { name: "Departments", path: "/config/department" },
    { name: "Locations", path: "/config/location" },
    { name: "Email Settings", path: "/config/smtp" },
    { name: "Themes", path: "/config/themes" },
    { name: "View", path: "/config/view" },
    { name: "Lists", path: "/config/lists" },
    { name: "Roles", path: "/config/role" },
    { name: "Portals", path: "/config/portals" },
    { name: "Custom Attributes", path: "/config/custom-attributes" },
    { name: "Workflows", path: "/config/workflows" },
    { name: "Master", path: "/master" },
    { name: "Reports", path: "/reports" },
    { name: "Inventory", path: "/inventory" },
    { name: "Stocks", path: "/inventory/stock" },
    { name: "Supplies", path: "/inventory/supply" },
    { name: "Distributions", path: "/inventory/distribution" },
    { name: "Inter-Location Stock Transfers", path: "/inventory/distribution/inter" },
    { name: "Assets", path: "/inventory/asset" },
    { name: "Kits", path: "/inventory/kit" },
    { name: "Suppliers", path: "/inventory/supplier" },

]

class Toolbar extends Component {   
    handleBackAction = () => {
        const { dispatch } = this.props;
        const pathname = location.pathname;
        const search = location.search;
        const isOnProcessHome = pathname.includes("/process") && search.includes("process_key");
        const isOnTaskTab = pathname.includes("/tasks")
        const isOnReportsHome = pathname.endsWith("/reports");
        const isOnEntityHome = pathname.endsWith("/entity");
        const isOnConfigListHome = pathname.endsWith("/config/lists") && search.includes("page=");
        if (isOnTaskTab) {
            const taskPathMatch = pathname.match(/\/tasks(\/[^/?]+)?/); 
            const hasTaskId = taskPathMatch && taskPathMatch[1]; 
            if(hasTaskId){
                this.props.history.push({ pathname: `/custom-workflow/org/${this.props.match?.params?.uuid}/tasks?taskType=tasks&page=1&size=${localStorage.getItem(CURRENT_TASK_SIZE)}` })
                dispatch(toggleTaskHomeScreen(false));
            }else if (pathname.includes('/tasks') && !this.props.showHome ) {
                dispatch(toggleTaskHomeScreen(true));
            }else {
                this.props.history.push({ pathname: `/customer-mgmt/org/${this.props.match?.params?.uuid}/profile` })
            }
        }else if (pathname===`/custom-workflow/org/${this.props.match?.params?.uuid}/config/lists/advanced`) {
            this.props.history.push({ pathname: `/customer-mgmt/org/${this.props.match?.params?.uuid}/profile` })
        }else if (isOnProcessHome || isOnReportsHome || isOnEntityHome || isOnConfigListHome) {
            this.props.history.push({ pathname: `/customer-mgmt/org/${this.props.match?.params?.uuid}/profile` })
        } else {
            this.props.history.goBack()
        }
    }
    render() {
        let { 
            location, 
            notificationSupport, 
            showEntitySearchBar,
            shepherdTourData,
            showTourButton,
            ...props 
        } = this.props;
        const orgId = props.match?.params?.uuid;
        const orgData = props.platformData?.orgMgmt?.staticData?.orgData;
        const clientName = orgData?.name;
        // let searchRoutes = ["/process", "/tasks", "/bgv"]
        
        // let showSearchBar = false;
        // if(searchRoutes.includes(location.pathname)) {
        //     showSearchBar = true;
        // }

        // if(location.pathname.startsWith("/entity") && !showEntitySearchBar) {
        //     showSearchBar = false;
        // }

        let createOrglogo = null;
        let oranameVar = null;
        let characterZero = null
        if (props.orgName) {
            oranameVar = props.orgName
            characterZero = oranameVar.charAt(0)

        }
        let websocketAndNotification = null;
        if(notificationSupport) {
            websocketAndNotification = (
                <React.Fragment>
                    {/* <WebsocketComp /> */}
                    <Notification />
                </React.Fragment>
            )
        }
        if (!props.orgLogo) {
            let brandOrgName = (props.orgName && props.orgName.length > 16) ? 'brand_logo with-no-image brandOrgText' : 'brand_logo with-no-image brandOrgTextinitial';
            createOrglogo = (
                <>
                    <span className={brandOrgName}>
                        {/* <a href="javascript:void(0)"> */}
                            <div className="nologo-text-wrapper">
                                <span className="noLogo-class">{characterZero}</span>
                                <span className="noLogo-orgName">{props.orgName}</span>
                            </div>
                        {/* </a> */}
                    </span>
                </>
            )
        } else if (props.orgLogo && !props.showOrgName) {
            createOrglogo = (
                <> 
                <span className="brand_logo">
                    {/* <a href="javascript:void(0)"> */}
                        <img src={props.orgLogo} alt="" />
                    {/* </a> */}
                </span>

                </>
            )
        } else if (props.orgLogo && props.showOrgName) {
            // eslint-disable-next-line no-unused-vars
            createOrglogo = (
                <>
                    <span className="brand_logo text-change brand_logo_cont">
                        {/* <a href="javascript:void(0)"> */}
                            <img src={props.orgLogo} alt="" />
                            <span className="brand_logo_and_text">
                                {props.orgName}
                            </span>
                        {/* </a> */}
                    </span>
                </>
            )
        }
        return (
            <Fragment>
                <div id="Header_container" className="Header_container">
                    <div className="clientDetailWrapper w-100 d-flex flex-row justify-content-between align-items-center">
                        <div className="d-flex flex-row align-items-center clientDetailHeading" onClick={() => this.handleBackAction()}>
                            <img className="headBackArrow" src={BackArrow} alt='back-arrow' />
                        <div className="clientOrg">Business Flow</div>
                        <div>{ clientName && <div className="clientName" title={clientName}>{clientName}</div> }</div>
                        </div>
                    <div>
                    <div className="rightdiv w-100">
                    <div className="notification">{websocketAndNotification}</div>
                    </div>
                    </div> 
                    
                    </div>
                    <Navbar/>
                </div>
            </Fragment>
        )
    }
}


const mapsStateToProps = state => ({
    orgLogo: state.orgLogo.logo,
    orgName: state.orgLogo.name,
    showOrgName: state.orgLogo.showOrgName,
    notificationSupport : state.auth.notificationSupport,
    showEntitySearchBar: state.entity.showSearchBar,
    showHome: state.task.showHome
})

export default withPlatformData(withRouter(connect(mapsStateToProps)(Toolbar)));
