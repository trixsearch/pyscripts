import React from 'react';
import { WorkflowTaskCountContentLoader } from 'components/UI/ContentLoaders/ContentLoaders';
import { useParams } from 'react-router-dom';
import { useWorkflowMyTaskCount, useWorkflowGroupTaskCount } from './queryHooks/useWorkflowTaskCount';
// import Dots from '../../components/UI/DotsLoader/Dots';


const TaskWorkflowItem = ({
    name,
    processKey,
    data,
    onItemClick
}) => {
    const orgId = useParams()?.uuid;
    const { 
        // isFetching: fetchingMyTask, 
        isLoading: loadinMyTask, 
        error: myTaskError, 
        data: myTaskCount, 
        refetch: myTaskRefetch 
    } = useWorkflowMyTaskCount(orgId, processKey);
    const { 
        // isFetching: fetchingGroupTask, 
        isLoading: loadingGroupTask, 
        data: groupTaskCount, 
        refetch: groupTaskRefetch,
        error: groupTaskError, 
    } = useWorkflowGroupTaskCount(orgId, processKey);

    return (
        <div className='task-workflow-list-item' onClick={() => onItemClick(data)}>
            <div className='task-workflow-label-container'>
                <span className='task-workflow-card-header'>
                    {name}
                </span>
                {(loadinMyTask || loadingGroupTask) ?
                    <WorkflowTaskCountContentLoader />:
                    <div className='task-workflow-count-container'>
                        <span className='task-workflow-text'>
                            No. of tasks : 
                        </span>
                        <span 
                            title={myTaskError} 
                            className='task-workflow-card-header' 
                            data-error={!!(myTaskError || groupTaskError)}
                            style={{
                                cursor: !!(myTaskError || groupTaskError) && "pointer" 
                            }}
                            onClick={(evt) => {
                                if(myTaskError || groupTaskError){
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    myTaskRefetch();
                                    groupTaskRefetch();
                                }
                            }} 
                        >
                            {myTaskError ? "Error (Retry)" : (myTaskCount+groupTaskCount)}
                        </span>
                        {/* {(fetchingGroupTask || fetchingMyTask) &&
                            <Dots width="5px" height="5px" />
                        } */}
                    </div>
                }
            </div>
            <div className='task-workflow-icon-container'>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.3672 11.4328L11.5125 3.74766C11.4445 3.68906 11.3578 3.65625 11.2664 3.65625H9.19219C9.01875 3.65625 8.93906 3.87187 9.07031 3.98438L17.2781 11.1094H3.5625C3.45937 11.1094 3.375 11.1937 3.375 11.2969V12.7031C3.375 12.8062 3.45937 12.8906 3.5625 12.8906H17.2758L9.06797 20.0156C8.93672 20.1305 9.01641 20.3438 9.18984 20.3438H11.3344C11.3789 20.3438 11.4234 20.3273 11.4562 20.2969L20.3672 12.5672C20.4483 12.4966 20.5134 12.4095 20.558 12.3116C20.6025 12.2138 20.6256 12.1075 20.6256 12C20.6256 11.8925 20.6025 11.7862 20.558 11.6884C20.5134 11.5905 20.4483 11.5034 20.3672 11.4328Z" fill="#585F66"/>
                </svg>
            </div>
        </div>
    )
}


export default React.memo(TaskWorkflowItem, (oldProps, newProps) => {
    return oldProps.name === newProps.name && oldProps.processKey === newProps.processKey;
});
