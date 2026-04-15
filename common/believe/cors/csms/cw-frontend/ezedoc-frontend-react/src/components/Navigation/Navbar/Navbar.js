import React from "react";
import { withRouter } from "react-router-dom";
import { isMobile } from "containers/utils";
import iconDashboard from "assets/tabIcons/icon-dashboard.svg";
// import iconRequests from "assets/tabIcons/icon-requests.svg";
import iconTasks from "assets/tabIcons/icon-tasks.svg";
import iconConfig from "assets/tabIcons/icon-config.svg";
import iconUsers from "assets/tabIcons/icon-users.svg";
import iconGroups from "assets/tabIcons/icon-groups.svg";
// import iconDepartments from "assets/tabIcons/icon-departments.svg";
// import iconLocations from "assets/tabIcons/icon-locations.svg";
import iconLists from "assets/tabIcons/icon-lists.svg";
import iconPortals from "assets/tabIcons/icon-portals.svg";
import iconPolicyManagement from "assets/tabIcons/icon-policy-config.svg";
// import iconCustomAttributes from "assets/tabIcons/icon-customattr.svg";
// import iconJobRoles from "assets/tabIcons/icon-jobroles.svg";
// import iconReports from "assets/tabIcons/icon-reports.svg";
import iconEntities from "assets/tabIcons/icon-entities.svg";
import iconProcess from "assets/tabIcons/icon-process.svg";
import iconReports from "assets/tabIcons/icon-workflow-reports.svg";
import iconViews from "assets/tabIcons/icon-view.svg";
import iconCustomAttributes from "assets/tabIcons/icon-customAttributes.svg";


import Tabs, { TabPane } from "../../Tabs/Tabs";
import { concatToUrl } from "../../../utils/misc";
import styles from "./Navbar.module.css";
import { checkPermission, withPlatformData } from "../../../platformDataStoreContext";
import {
  CW_SERVICE_POLICY_VIEW,
  CW_SERVICE_DASHBOARD_VIEW,
  CW_SERVICE_GROUP_VIEW,
  CW_SERVICE_LIST_VIEW,
  CW_SERVICE_PORTAL_VIEW,
  CW_SERVICE_PROCESSES_VIEW,
  CW_SERVICE_REPORTS_VIEW,
  CW_SERVICE_TASKS_VIEW,
  CW_SERVICE_USER_VIEW,
  CW_SERVICE_CONTENT_VIEW,
  CW_SERVICE_DRISHTI_VIEW
} from "../../../Data/constants";
import { connect } from "react-redux";
import { getAuthUserById } from "../../../store/actions/signIn/Login";

const ROUTES = [
  // {
  //   displayName: "dashboard",
  //   url: "dashboard",
  //   id: "dashboard",
  //   appClass: "icon-dashboard",
  //   icon: iconDashboard,
  //   show: true,
  //   feature: true,
  //   permissions: [CW_SERVICE_DASHBOARD_VIEW]
  // },

  {
    displayName: "processes",
    url: "process",
    id: "processes",
    appClass: "icon-process",
    icon: iconProcess,
    show: true,
    feature: true,
    permissions: [CW_SERVICE_PROCESSES_VIEW]
  },
  {
    displayName: "tasks",
    url: "tasks",
    id: "tasks",
    // appClass: "icon-task",
    icon: iconTasks,
    show: true,
    feature: true,
    vendor: true,
    permissions: [CW_SERVICE_TASKS_VIEW]
  },
  // {
  //   displayName: "pool",
  //   url: "entity",
  //   id: "entity",
  //   // appClass: "icon-card",
  //   icon: iconEntities,
  //   children: entity_list,
  //   feature: true,
  //   vendor: true,
  //   permissions: ['']
  // },
  // {
  //   displayName: "BGV",
  //   url: "bgv",
  //   id: "bgv",
  //   appClass: "icon-employee",
  //   show: props.uiPermissions.bgv?.manage,
  //   feature: true,
  // },

  {
    displayName: "config",
    url: "config",
    id: "config",
    // appClass: "icon-config",
    icon: iconConfig,
    feature: true,
    vendor: false,
    permissions: [CW_SERVICE_USER_VIEW, CW_SERVICE_GROUP_VIEW, CW_SERVICE_LIST_VIEW, CW_SERVICE_PORTAL_VIEW, CW_SERVICE_POLICY_VIEW],
    children: [
      // {
      //   displayName: "users",
      //   url: "users",
      //   id: "organisationuser",
      //   // appClass: "icon-user",
      //   icon: iconUsers,
      //   show: true,
      //   feature: true,
      //   permissions: [CW_SERVICE_USER_VIEW]
      // },
      // {
      //   displayName: "dashboard",
      //   url: "dashboard",
      //   id: "dashboard",
      //   appClass: "icon-dashboard",
      //   icon: iconDashboard,
      //   show: true,
      //   feature: true,
      //   permissions: [CW_SERVICE_DASHBOARD_VIEW]
      // },

      {
        displayName: "lists",
        url: "lists",
        id: "lists",
        // appClass: "icon-lists",
        icon: iconLists,
        show: true,
        feature: true,
        permissions: [CW_SERVICE_LIST_VIEW]
      },
      {
        displayName: "portals",
        url: "portals",
        id: "portals",
        // appClass: "icon-portals",
        icon: iconPortals,
        show: true,
        feature: true,
        permissions: [CW_SERVICE_PORTAL_VIEW],
        children2: [
          {
            displayName: "contents",
            url: "/contents",
            id: "content",
            appClass: "icon-content",
            show: true,
            feature: true,
            permissions: [CW_SERVICE_CONTENT_VIEW]
          },
        ],
      },
      {
        displayName: "Policy Management",
        url: "policy-management",
        id: "policy-management",
        appClass: "icon-apps",
        show: true,
        feature: true,
        icon: iconPolicyManagement,
        permissions: [CW_SERVICE_POLICY_VIEW]
      },
    ],
  },
  {
    displayName: "Reports",
    url: "reports",
    id: "reports",
    appClass: "icon-reports",
    icon: iconReports,
    show: true,
    feature: true,
    vendor: false,
    permissions: [CW_SERVICE_REPORTS_VIEW]
  },
  {
    displayName: "Entity",
    url: "entity",
    id: "entity",
    appClass: "",
    icon: "",
    show: true,
    feature: true,
    vendor: false,
    permissions: [CW_SERVICE_PROCESSES_VIEW]
  },
  {
    displayName: "Drishti",
    url: "drishti",
    id: "drishti",
    appClass: "",
    icon: "",
    show: true,
    feature: true,
    vendor: false,
    permissions: [CW_SERVICE_DRISHTI_VIEW]
  }
];

class Navbar extends React.Component {
  state = {
    routes: []
  }
  shouldComponentUpdate(nextProps) {
    if (
      nextProps.location.pathname !== location ||
      nextProps.platformData !== this.props.platformData
    )
      return true;
    return false;
  }

  checkPermissionAndSetRoutes() {
    const { platformData, dispatch } = this.props;
    const orgId = this.props.match?.params?.uuid;
    const permittedRoutes = []
    const routesResult = ROUTES.filter((item) => {
      if (item !== null) {
        if (this.props?.isVendor === true) {
          return item?.vendor
        } else {
          return true
        }
      }
      return false;
    }).map(async (route) => {
      const hasPermission = await checkPermission({ rState: platformData, permissions: route.permissions, orgId: orgId, dispatch });
      if (hasPermission) {
        if (route?.children?.length) {
          const permittedChildren = [];
          await Promise.all(route?.children.map(async (childRoute) => {
            const childHasPermission = await checkPermission({ rState: platformData, permissions: childRoute.permissions, orgId: orgId, dispatch });
            if (childHasPermission) {
              if (childRoute?.children2?.length) {
                const permittedChildren2 = [];
                await Promise.all(childRoute?.children2.map(async (childRoute2) => {
                  const child2HasPermission = await checkPermission({ rState: platformData, permissions: childRoute2.permissions, orgId: orgId, dispatch });
                  if (child2HasPermission) {
                    permittedChildren2.push(childRoute2);
                  }
                }))
                childRoute.children2 = permittedChildren2;
                permittedChildren.push(childRoute)
              } else {
                permittedChildren.push(childRoute)
              }
            }
          }))
          route.children = permittedChildren;
          permittedRoutes.push(route)
        } else {
          permittedRoutes.push(route)
        }
      }
    })
    Promise.all(routesResult).then(() => {
      const location = this.props.location.pathname;
      if (permittedRoutes?.length && (ROUTES?.find(route => location === this.props.match.url + "/" + route.url) || location?.includes("/dashboard"))) {
        if (!permittedRoutes?.find(route => location?.includes(this.props.match.url + "/" + route.url))) {
          const route = permittedRoutes[0];
          if (route?.children) {
            if (route?.children?.length) {
              const childRoute = route.children[0];
              if (childRoute?.children2) {
                if (childRoute?.children2?.length) {
                  const childRoute2 = childRoute?.children2[0];
                  this.props?.history?.push(this.props.match.url + "/" + route?.url + "/" + childRoute?.url + "/" + childRoute2?.url);
                }
              }
              this.props?.history?.push(this.props.match.url + "/" + route?.url + "/" + childRoute?.url);
            }
          } else {
            this.props?.history?.push(this.props.match.url + "/" + route?.url);
          }
          if (route.url === "dashboard" || route.url === "tasks" || route.url === "process") {
            if (!this.props.dashboardView && !this.props.orgUserLoading && platformData?.auth?.user?.userId) {
              this.props.getAuthUserById(orgId, platformData?.auth?.user?.userId)
            }
          }
        } else if (location?.includes("/dashboard") || location?.includes("/process") || location?.includes("/tasks")) {
          if (!this.props.dashboardView && !this.props.orgUserLoading && platformData?.auth?.user?.userId) {
            this.props.getAuthUserById(orgId, platformData?.auth?.user?.userId)
          }
        }
      } else if (location?.includes("/dashboard") || location?.includes("/process") || location?.includes("/tasks")) {
        if (!this.props.dashboardView && !this.props.orgUserLoading && platformData?.auth?.user?.userId) {
          this.props.getAuthUserById(orgId, platformData?.auth?.user?.userId)
        }
      }
      this.setState({
        routes: JSON.parse(JSON.stringify(permittedRoutes))
      })
    })
  }



  componentDidMount() {
    this.checkPermissionAndSetRoutes()
  }

  componentDidUpdate(prevProps) {
    const orgId = this.props.match?.params?.uuid;
    if (prevProps?.platformData !== this.props?.platformData) {
      this.checkPermissionAndSetRoutes()
    }
    /* 
    This below fix is for second time workflow menu click.
    */
    if (prevProps.location.pathname !== this.props.location.pathname && this.props.location.pathname === this.props.match.url + "/" + "dashboard") {
      this.checkPermissionAndSetRoutes()
    }
    if (prevProps.location.pathname !== this.props.location.pathname && !this.props.dashboardView && !this.props.orgUserLoading) {
      if (
        this.props.location.pathname?.includes("/dashboard") ||
        this.props.location.pathname?.includes("/process") ||
        this.props.location.pathname?.includes("/tasks")
      ) {
        this.props.getAuthUserById(orgId, this.props?.platformData?.auth?.user?.userId)
      }
    }

  }

  render() {
    let {
      location,
      match,
      ...props
    } = this.props;
    const {
      routes
    } = this.state;
    const orgId = match?.params?.uuid;

    let filteredRoutes = routes.map((item) => {
      const id = item.id;
      if (id === "config" && !isMobile()) {
        const configChild = item.children.filter((subItem) => subItem.show);
        // if (configChild.length > 0) {
        //   const firstChildUrl = configChild[0].url;
        //   return {
        //     displayName: "config",
        //     url: firstChildUrl,
        //     id: "config",
        //     appClass: "icon-config",
        //     children: configChild,
        //     feature: item.feature,
        //   };
        // }
        if (configChild.length > 0) {
          return {
            ...item,
            children: configChild,
          };
        }
      } else if (id === "inventory" && !isMobile()) {
        const inventoryChild = item.children.filter((subItem) => subItem.show);
        // if (inventoryChild.length > 0) {
        //   const firstChildUrl = inventoryChild[0].url;
        //   return {
        //     displayName: "Inventory",
        //     url: firstChildUrl,
        //     id: "inventory",
        //     appClass: "icon-inventory",
        //     children: inventoryChild,
        //     feature: item.feature,
        //   };
        // }
        if (inventoryChild.length > 0) {
          return {
            ...item,
            children: inventoryChild,
          };
        }
      } else if (id === "inventory" && isMobile()) {
        const inventoryChild = item.children.filter((subItem) => subItem.show);
        if (inventoryChild.length > 0) {
          const firstChildUrl = inventoryChild[0].url;
          return {
            displayName: "Inventory",
            url: firstChildUrl,
            id: "inventory",
            appClass: "icon-inventory",
            children: inventoryChild,
            feature: item.feature,
          };
        }
        //  else if (id === "hiring" && !isMobile()) {
        //   const hiringChildren = item.children.filter((subItem) => subItem.show);
        //   if (hiringChildren.length > 0) {
        //     return {
        //       ...item,
        //       children: hiringChildren,
        //     };
        //   }
        // }
      } else if (id === "hiring" && isMobile()) {
        const hiringChildren = item.children.filter((subItem) => {
          if (subItem.displayName !== "head count") {
            return subItem.show;
          }
          return false;
        });
        if (hiringChildren.length > 0) {
          return {
            ...item,
            children: hiringChildren,
          };
        }
      }
      // else if (id === "entity" && !isMobile()) {
      //   const entitychild = item.children && item.children.filter((subItem) => subItem.show);
      //   if (entitychild && entitychild.length > 0) {
      //     return {
      //       ...item,
      //       children: entitychild,
      //     };
      //   }
      // } 
      else if (item.show) {
        if (["master", "reports"].includes(item.id)) {
          if (!isMobile()) {
            return item;
          }
        } else {
          return item;
        }
      }
      return null;
    });


    filteredRoutes = filteredRoutes.filter((item) => {
      if (item !== null) {
        if (this.props?.isVendor === true) {
          return item?.vendor
        } else {
          return true
        }
      }
      return false;
    });

    return (
      <div>
        <div className={styles.navbarCss}>
          <Tabs
            baseUrlPath={this.props.match.url}
            className={styles.tabs}
            paneClassName={styles.tabPaneClassName}
          >
            {filteredRoutes.map((item) => (
              <TabPane
                urlPath={item.url}
                title={item.displayName}
                iconLeft={item.icon}
                permissions={item.permissions}
                orgId={orgId}
              >
                {item.children && item.children.length ? (
                  <Tabs
                    showSelectBackground
                    baseUrlPath={concatToUrl(this.props.match.url, item.url)}
                    tabClassName={styles.nestedTabClassName}
                    className={styles.tabs}
                  >
                    {item.children.map((childrenItem) => (
                      <TabPane
                        urlPath={childrenItem.url}
                        title={childrenItem.displayName}
                        iconLeft={childrenItem.icon}
                        permissions={childrenItem.permissions}
                        orgId={orgId}
                      />
                    ))}
                  </Tabs>
                ) : null}
              </TabPane>
            ))}
          </Tabs>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  dashboardView: state?.auth?.dashboardView,
  orgUserLoading: state?.auth?.loading
})

const mapDispatchToProps = dispatch => ({
  getAuthUserById: (orgId, userId) => dispatch(getAuthUserById(orgId, userId))
})

export default withPlatformData(withRouter(connect(mapStateToProps, mapDispatchToProps)(Navbar)));
