import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { isMobile } from '../../utils';
import Chart from "../Chart/chart";
import ProcessCount from "../Process/ProcessApp"
import FilterDropdown from "../../../components/UI/FilterDropdown/FilterDropdown";
import { useDispatch, useSelector } from 'react-redux';
import { dashboardAppFilter, dashboardCountFilter } from '../../../store/actions';
import { CW_SERVICE_TASKS_VIEW, DASHBOARD_CURRENT_APP_FILTER_NAME, DASHBOARD_UPDATE_VARIABLE, SELECTED_DASHBOARD_APP, WORKFLOW_INITIATE, WORKFLOW_VIEW } from '../../../Data/constants';
import HasWorkflowPermission from '../../../components/UI/HasWorkflowPermission';
import { EmptyProcess } from '../../Process/ProcessComponents';
import { HasAccess } from '../../../platformDataStoreContext';

const ProcessContainer = ({
    chartError,
    showChartData,
    chartContentLoader,
    chart
  }) => {
    const dispatch = useDispatch();
    const processCount = useSelector(state =>  state.dashboard.processCount);
    const processCountLoader =  useSelector(state => state.dashboard.processCountLoader);
    const allApps =  useSelector(state => state.dashboard.apps);
    const currentActiveApp =  useSelector(state => state.dashboard.app);
    const updateType =  useSelector(state => state.websocket.updateType);
    const { uuid: orgId } = useParams();

    const selectedApp = (name, process_key, id, force = false) => {
        if (currentActiveApp.name === name && !force) {
            return;
        }
        dispatch(dashboardCountFilter(orgId, id, process_key));
        dispatch(dashboardAppFilter(orgId, id, process_key));
        localStorage.setItem(SELECTED_DASHBOARD_APP, JSON.stringify(name));
    }

    const handleAppChange = (id) => {
        let activeApp = allApps.filter(
            (item) => item.id === id
        )[0];
        if (activeApp) {
            selectedApp(activeApp.name, activeApp.process_key, activeApp?.id)
        }
    }

    useEffect(() => {
        if(currentActiveApp?.id && updateType?.type && DASHBOARD_UPDATE_VARIABLE.includes(updateType?.type)){
            selectedApp(currentActiveApp?.name, currentActiveApp?.process_key, currentActiveApp?.id)
        }
    }, [currentActiveApp,updateType])

    useEffect(() => {
        if(allApps?.length){
            let process = null;
            try {
                process = JSON.parse(localStorage.getItem(DASHBOARD_CURRENT_APP_FILTER_NAME));
            } catch {
                // local storage does not have data
            }
            let activeApp = allApps[0];
            if(process?.id && allApps?.find(app => app.id === process?.id)){
                activeApp = allApps?.find(app => app.id === process?.id);
            }
            selectedApp(activeApp.name, activeApp.process_key, activeApp?.id, true)
        }
    }, [allApps])

    return (
        <>
            
            {!!allApps?.length &&
                <FilterDropdown
                    list={allApps}
                    classes='config_view_role_dropdown'
                    selectedItem={currentActiveApp?.name}
                    onItemClickHandler={handleAppChange}
                    showSearch
                />
            }
            <HasWorkflowPermission
                permissions={[WORKFLOW_VIEW]}
                workflowId={currentActiveApp?.id}
                yes={() => {
                    return (
                        <>
                        {processCount && !processCountLoader
                            ? (
                                <>
                                    <ProcessCount
                                        key={`${processCount.ongoing}-${processCount.completed}-${processCount.withdrawn}`}
                                        data={processCount}
                                        processKey={currentActiveApp?.process_key}
                                        processCountLoader={false}
                                    />
                                </>
                            )
                            : <ProcessCount processCountLoader />
                        }
                        </>
                    )
                }}
                no={() => {
                    return (
                        <HasAccess
                            permissions={[CW_SERVICE_TASKS_VIEW]}
                            no={() => (
                                <EmptyProcess message="There is nothing here for you to view!"  />
                            )}
                        />
                    )
                }}
            />
            {!isMobile()
                && !chartError && (
                    <HasWorkflowPermission
                        permissions={[WORKFLOW_VIEW]}
                        workflowId={currentActiveApp?.id}
                        yes={() => (
                            <Chart
                                updateType={updateType}
                                id={currentActiveApp?.id}
                                showChartData={showChartData}
                                chartContentLoader={chartContentLoader}
                                data={chart || null}
                            />
                        )}
                    />
                )}
        </>
    )
}

export default ProcessContainer