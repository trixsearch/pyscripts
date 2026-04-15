import { useQuery } from "react-query"

const APP_URL = process.env.REACT_APP_APP_URL;

export const useWorkflowMyTaskCount = (orgId, name) => {
    if(!orgId || !name){
        return {
            isLoading: true,
            data: null
        }
    }

    return useQuery(
        ['workflow-my-task-count'+name, orgId, name],
        () => axios.post(`${APP_URL}/${orgId}/apps/search_task?task_type=tasks&processDefinitionKey=${name}`, {}),
        {
            select: (response) => {
                return response?.data?.data?.total;
            },
            const: true,
        }
    )
}
export const useWorkflowGroupTaskCount = (orgId, name) => {
    if(!orgId || !name){
        return {
            isLoading: true,
            data: null
        }
    }

    return useQuery(
        ['workflow-group-task-count'+name, orgId, name],
        () => axios.post(`${APP_URL}/${orgId}/apps/search_task?task_type=group_tasks&processDefinitionKey=${name}`, {}),
        {
            select: (response) => {
                return response?.data?.data?.total;
            },
            const: true,
        }
    )
}