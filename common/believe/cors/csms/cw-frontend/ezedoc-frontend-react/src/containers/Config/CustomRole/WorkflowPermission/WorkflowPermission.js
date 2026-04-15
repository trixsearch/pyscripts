import React from "react";
import {
  MainContainer,
  HeaderComponent,
  HeaderItem,
  BodyComponent,
  Save,
  ContainerBox,
  CheckBox
} from "../components";

import Spinner from "../../../../components/UI/Spinner/Spinner";

import "../../../Tasks/task.css";
import "../CustomRole.css";
import { HasAccess } from "../../../../platformDataStoreContext";
import { CW_SERVICE_POLICY_UPDATE, CW_SERVICE_POLICY_VIEW } from "../../../../Data/constants";
import { useDispatch } from "react-redux";
import { addToast } from "../../../../components/Toast/actions";

const WorkflowPermission = props => {
  const { loader, apps, editDisabled } = props;
  const dispatch = useDispatch();

  return (
    <div className="workflowPermissionPage">
      {loader && <Spinner />}
      <HasAccess
        permissions={[CW_SERVICE_POLICY_VIEW]}
        yes={() => {
          return (
            <div>
              <MainContainer>
                <HeaderComponent>
                  <HeaderItem name="Workflow" />
                  <HeaderItem name="Task View" />
                  <HeaderItem name="Process View" />
                  <HeaderItem name="Reassign" />
                  <HeaderItem name="Withdraw" />
                  <HeaderItem name="Upload" />
                  <HeaderItem name="Initiate" />
                  <HeaderItem name="Bulk Initiate" />
                </HeaderComponent>
                <BodyComponent>
                  {apps.data &&
                    Object.keys(apps.data).map(app => {
                      let permissions = apps.data[app].workflow_permission;
                      let id = apps.data[app].appId
                      return (
                        <ContainerBox entity={apps.data[app]}>
                          <CheckBox
                            name="filter_on_task"
                            key="Task View"
                            checked={permissions.filter_on_task}
                            clicked={e => props.checked(e, id)}
                            disabled={editDisabled}
                          />
                          <CheckBox
                            name="view"
                            key="Process_View"
                            checked={permissions.view}
                            clicked={e => {
                              if(permissions.view){
                                if(permissions.reassign || permissions.upload || permissions.withdraw) {
                                  dispatch(addToast("error", "Error", "Please uncheck other dependent permission!"))
                                }
                              }
                              props.checked(e, id)}
                            }
                            disabled={editDisabled}
                          />
                          <CheckBox
                            name="reassign"
                            key="Reassign"
                            checked={permissions.reassign}
                            clicked={e => props.checked(e, id)}
                            disabled={editDisabled}
                          />
                          <CheckBox
                            name="withdraw"
                            key="Withdraw"
                            checked={permissions.withdraw}
                            clicked={e => props.checked(e, id)}
                            disabled={editDisabled}
                          />
                          <CheckBox
                            name="upload"
                            key="UploadDocument"
                            checked={permissions.upload}
                            clicked={e => props.checked(e, id)}
                            disabled={editDisabled}
                          />
                          <CheckBox
                            name="initiate"
                            key="Initiate"
                            checked={permissions.initiate}
                            clicked={e => props.checked(e, id)}
                            disabled={editDisabled}
                          />
                          <CheckBox
                            name="bulk_initiate"
                            key="BulkInitiate"
                            checked={permissions.bulk_initiate}
                            clicked={e => props.checked(e, id)}
                            disabled={editDisabled}
                          />
                        </ContainerBox>
                      );
                    })}
                </BodyComponent>
              </MainContainer>
              <HasAccess
                permissions={[CW_SERVICE_POLICY_UPDATE]}
                yes={() => {
                  return <Save
                          updatePermission={props.updateWorkflowPermission}
                          editDisabled={apps['disabled']}
                      />
                }}
              />
            </div>
          )
        }}
      />
    </div>
  );
};

export default WorkflowPermission;

