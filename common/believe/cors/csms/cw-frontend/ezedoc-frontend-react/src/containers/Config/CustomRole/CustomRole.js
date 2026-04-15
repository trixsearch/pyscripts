import React, { Component } from "react";
import { connect } from "react-redux";
import Axios from "axios";

import Spinner from "../../../components/UI/Spinner/Spinner";
import FilterDropdown from "../../../components/UI/FilterDropdown/FilterDropdown";
// import { SYSTEM_ROLES } from "../../../Data/constants";
import WorkflowPermission from "./WorkflowPermission/WorkflowPermission";

// import EntityPermission from "./EntityPermission/EntityPermission";
import {getCheckedValue} from "./utils"
import { addToast } from '../../../components/Toast/actions';
import {TabList} from './components'

import "../../Tasks/task.css";
import "./CustomRole.css";
import { HasAccess } from "../../../platformDataStoreContext";
import UnauthorizedPage from "../../UnauthorizedPage";
import { CW_SERVICE_POLICY_UPDATE, CW_SERVICE_POLICY_VIEW } from "../../../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

class CustomRole extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePolicy: {},
      soloActive: "worklfow_permission",
      loader: true,
      policies: [],
      workflows: [],
      creationType: "",
      showWarning: false,
      editDisabled: false,
      apps: {
        disabled: true,
        data: {
        }
      }
      // entity_data: [],
    };
  }

  fetchAllWorkflowsWithoutAccess = () => {
    Axios.get(`${APP_URL}/${this.props.match?.params?.uuid}/apps/?access=get-all&is_global=true&page_count=100`)
      .then((response) => {
        this.setState({
          workflows: response?.data?.data
        })
      })
      .catch(error => {
        this.props.addToast('error', 'Error', error.response.data.message)
      })
  }

  componentDidMount() {
    this.fetchAllWorkflowsWithoutAccess()
    Axios.get(`${APP_URL}/${this.props.match?.params?.uuid}/users/org_users/platform_policies`)
      .then(response => {
        this.setState({
          policies: response?.data?.data,
          activePolicy: response?.data?.data[0]
        }, () => {
         if(response?.data?.data[0]){
           this.updateAppsData(response?.data?.data[0]?.id)
         }
        });
      })
      .catch(error => {
        this.props.addToast('error', 'Error', error.response.data.message)
        this.setState({
          loader: false
        })
      });
  }

  handleTabNav = value => {
    this.setState({
      soloActive: value
    });
  };

  // updatePermission = (entities) => {
  //   this.setState({
  //     loader: true
  //   });
  //   let entity_data = entities.data.filter(entity => entity.permissions.changed === true);
  //   let payload = entity_data.map(entity => {
  //     return {
  //       entity: entity.id,
  //       role: this.state.roleId,
  //       "entity_permissions": { View: entity.permissions.View,BulkUpdate: entity.permissions.BulkUpdate}
  //     };
  //   });

  //   Axios.post(`/api/permissions/org_entity_permissions/bulk_update_permissions`, payload)
  //   .then(response => {
  //     this.props.addToast('success', 'Success', response.data.message)
  //     // eslint-disable-next-line no-shadow
  //     let entity_data = entities
  //     entity_data.disabled = true
  //     this.setState({
  //       entity_data
  //     })
  //   })
  //   .catch(error => {
  //     this.props.addToast('error', 'Error', error.response.data.message)   
  //   })
  //   .finally(() => {
  //     this.setState({
  //       loader: false
  //     });
  //   });

  // };

  updateWorkflowPermission = () => {
    this.setState({
      loader: true
    });
    const orgId = this.props.match?.params?.uuid;
    let {apps} = this.state;
    let worklfow_permission = Object.keys(apps.data).filter((e)=> apps.data[e].changed=== true)
    let payload = worklfow_permission.map(workflow => {
      return apps.data[workflow].workflow_permission
    });
    if(payload.length) {
      Axios.post(`${APP_URL}/${orgId}/apps/workflow_access`, payload)
      .then(response => {
        this.props.addToast('success', 'Success', response.data.message);
        this.updateAppsData(this.state?.activePolicy?.id);
      })
      .catch(error => {
        this.props.addToast('error', 'Error', error.response.data.message)   
      })
      .finally(() => {
        this.setState({
          loader: false
        });
      });
    }else {
      this.setState({
        loader: false
      });
    }
  
  };

  // updateEntity = (event,index) => {
  //   let {entity_data} = this.state
  //   entity_data.disabled = false
  //   entity_data.data[index].permissions = {
  //     ...entity_data.data[index].permissions,
  //     [event.target.name] : event.target.checked,
  //     "changed": true  
  //   }
  //   this.setState({
  //       entity_data : entity_data
  //   })
  // }

  checked = (event, appId) => {
    let {apps} = this.state
    apps.disabled = false;
    let permission = apps.data[appId].workflow_permission
    permission[event.target.name] =event.target.checked
    apps.data[appId] = {
        ...apps.data[appId],
       "workflow_permission":getCheckedValue(permission),
       changed : true
    }
    this.setState(() => ({
       apps
    }))
  }

  componentDidUpdate(preProps, prevState) {
    if(prevState?.workflows?.length !== this.state.workflows?.length && this.state?.activePolicy?.id){
      this.updateAppsData(this.state?.activePolicy?.id);
    }
  }

  updateAppsData = (policy_id) => {
    const orgId = this.props.match?.params?.uuid;
    this.setState({
      loader: true
    })
    Axios.get(`${APP_URL}/${orgId}/apps/workflow_access?policy__id=${policy_id}`)
      .then(result => {
        const response = result?.data;
        const appsData = {}
        this.state.workflows?.forEach((workflow) => {
          const workflowAccess = response?.data?.find(access => access?.app_id === workflow?.id);
          if(workflowAccess){
            appsData[workflow?.id] = {
              appId: workflow?.id,
              name: workflow?.name,
              "workflow_permission": {
                ...workflowAccess
              }
            }
          } else {
            appsData[workflow?.id] = {
              appId: workflow?.id,
              name: workflow?.name,
              "workflow_permission": {
                "view": false,
                "reassign": false,
                "withdraw": false,
                "bulk_initiate": false,
                "initiate": false,
                "upload": false,
                "policy_id": policy_id,
                "app_id": workflow?.id,
                "filter_on_task": false
              }
            }
          }
        })
    
        this.setState({
          apps: {
            disabled: true,
            data: appsData
          },
          loader: false
        })
      }).catch(error => {
        this.props.addToast('error', 'Error', error.response.data.message);
        this.setState({
          loader: false
        })
      })
  }

  handlePolicyChange = (item_id) => {
    if(this.state.activePolicy?.id !== item_id)
      this.setState({
        activePolicy: this.state.policies?.find(policy => policy.id === item_id)
      }, () => {
        this.updateAppsData(item_id);
      })
  }

  updateEditDisabled = (val) => {
    if(val !== this.state.editDisabled)
      this.setState({
        editDisabled: val
      })

    return <></>
  }

  render() {
    const {
      loader,
      soloActive,
      policies,
      activePolicy,
      editDisabled,
      // entity_data,
      apps
    } = this.state;

    let Workflow = null;
    if (soloActive === "worklfow_permission") {
      Workflow = (
        <WorkflowPermission
          rolePermission={{
            view: true
          }}
          updateWorkflowPermission={this.updateWorkflowPermission}
          apps={apps}
          checked={this.checked}
          editDisabled={editDisabled}
        />
      );
    }

    // let Entities = null;
    // if (soloActive === "entity_permission") {
    //   Entities = (
    //     <EntityPermission
    //       loader={loader}
    //       updateEntity={this.updateEntity}
    //       key={roleId+soloActive}
    //       entity_data={entity_data}
    //       editDisabled={editDisabled}
    //       roleId={roleId}
    //       updatePermission={this.updatePermission}
    //       activeRole={activeRole}
    //     />
    //   );
    // }

    let content = null;
    if (loader) {
      content = <Spinner />;
    } else {
      content = (
        <React.Fragment>
          {soloActive === "worklfow_permission" && Workflow}
          {/* {soloActive === "entity_permission" && Entities} */}
        </React.Fragment>
      );
    }

    return (
      <div className="roleListPage">
        <HasAccess
            permissions={[CW_SERVICE_POLICY_UPDATE]}
            yes={() => this.updateEditDisabled(false)}
            no={() => this.updateEditDisabled(true)}
        />
        <HasAccess
          permissions={[CW_SERVICE_POLICY_VIEW]}
          yes={() => {
            return (
              <div className="main_changable_container">
                <div className="config_add_group_form" style={{ marginTop: 15 }}>
                  <div className="task-navbar">
                    <ul
                      className="nav nav-tabs process_tab_ongoing_comp_ul task-navItem"
                      role="tablist"
                    >
                      {/* {roleWorkflowPermission.view && showWorkflowPerm? ( */}
                        <TabList
                          onClick={() => this.handleTabNav("worklfow_permission")}
                          className={
                            soloActive === "worklfow_permission"
                              ? "nav-item active"
                              : "nav-item"
                          }
                          name="Workflow Permissions"
                        />
                      {/* ): null} */}
                      {/* <TabList
                        onClick={() => this.handleTabNav("entity_permission")}
                        className={
                          soloActive === "entity_permission"
                            ? "nav-item active"
                            : "nav-item"
                        }
                        name="Entity Permissions"
                      /> */}
                      <div className="app_buttons" style={{ position: "absolute", right: "0px"}}>
                        <div>Permissions for</div>
                        <div className="custom-role-side-button">
                          <FilterDropdown
                            list={policies}
                            disableComponent={loader}
                            selectedItem={activePolicy.name}
                            onItemClickHandler={this.handlePolicyChange}
                            classes='roles_filter_dropdown'
                          />
                        </div>
                      </div>
                    </ul>
                  </div>
                  {content}
                </div>
              </div>
            )
          }}
          no={() => {
            return <UnauthorizedPage />
          }}

        />
      </div>
    );
  }
}

export default connect(null, { addToast })(CustomRole);
