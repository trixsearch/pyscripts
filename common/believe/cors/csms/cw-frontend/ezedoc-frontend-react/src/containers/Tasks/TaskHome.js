import React, { useEffect } from 'react';
import TaskWorkflowItem from './TaskWorkflowItem';
import { useSelector } from 'react-redux';
import Spinner from '../../components/UI/Spinner/Spinner';
import { EmptyProcess } from '../Process/ProcessComponents';
import { useDispatch } from 'react-redux';
import { toggleTaskHomeScreen } from '../../store/actions';

const getAppsBySearch = (workflows, search) => {
    return (
        search ? 
        workflows?.filter((item) => {
            return item?.name?.toLowerCase()?.includes(search?.toLowerCase());
        }) : 
        workflows
    )
}


const TaskHome = ({ onWorkflowSelect, search, handleFallback }) => {
    const workflows = useSelector(state => state.task.apps);
    const loading = useSelector(state => state?.task?.appLoading);
    const dispatch = useDispatch();

    useEffect(() => {
        if(!loading && workflows?.length <= 0){
            dispatch(toggleTaskHomeScreen(false));
            handleFallback()
        }
    }, [workflows, loading, dispatch])

    return (
        <div className='task-workflow-list-container' style={{
            justifyContent: (!loading && workflows?.length <= 0) && "center"
        }}>
            {loading && <Spinner />}
            {(!loading && workflows?.length <= 0) &&
                 <EmptyProcess
                    message={`You don't have permission to view any workflows. Please contact system administrator.`}
                />
            }
            {!!(workflows && workflows?.length) &&
                getAppsBySearch(workflows, search)?.map((workflow) => {
                    return (
                        <TaskWorkflowItem 
                            key={workflow.id}
                            name={workflow.name}
                            processKey={workflow?.process_key}
                            data={workflow}
                            onItemClick={onWorkflowSelect}
                        />
                    )
                })
            }
        </div>
    )
}


export default React.memo(TaskHome);
