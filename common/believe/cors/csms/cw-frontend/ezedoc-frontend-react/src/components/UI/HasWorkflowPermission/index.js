import React from 'react'
import { useSelector } from 'react-redux';
import { WORKFLOW_BULKINITIATE, WORKFLOW_INITIATE, WORKFLOW_REASSIGN, WORKFLOW_UPLOAD, WORKFLOW_VIEW, WORKFLOW_WITHDRAW } from '../../../Data/constants';

export const checkWorkflowPermissions = (workflow_permissions, permissions, workflowId) => {
    const currentPermission = workflow_permissions[workflowId];
    let permission = false;
    if(currentPermission && Array.isArray(permissions)){
        for(let i = 0; i < permissions?.length; i++){
            if(permission){
                continue;
            }
            switch(permissions[i]){
                case WORKFLOW_VIEW:{
                    permission = currentPermission?.view;
                    break;
                }
                case WORKFLOW_INITIATE:{
                    permission = currentPermission?.initiate;
                    break;
                }
                case WORKFLOW_BULKINITIATE:{
                    permission = currentPermission?.bulk_initiate;
                    break;
                }
                case WORKFLOW_REASSIGN:{
                    permission = currentPermission?.reassign;
                    break;
                }
                case WORKFLOW_UPLOAD:{
                    permission = currentPermission?.upload;
                    break;
                }
                case WORKFLOW_WITHDRAW:{
                    permission = currentPermission?.withdraw;
                    break;
                }
                default: permission = false;
            }
        }
    }

    return permission;
}


const HasWorkflowPermission = ({
    workflowId,
    permissions,
    yes = () => null,
    no = () => null
}) => {
    const permission = useSelector((state) => checkWorkflowPermissions(state?.auth?.workflow_permissions, permissions, workflowId));

    if(permission){
        return  yes();
    }

    return no();

}

export default HasWorkflowPermission;