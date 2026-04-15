/* eslint-disable react-hooks/exhaustive-deps */

import React, {
    useState,
    useEffect,
    useCallback,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { useParams, useHistory } from 'react-router-dom'

import {
 getUrlVars, parseQueryString, getDebugText
} from 'containers/utils'
import usePrevious from '../../CustomHooks/usePrevious'
import * as actions from '../../store/actions/index'
import { EntityPhoto, ProcessTab } from './ProcessComponents'
import Spinner from '../../components/UI/Spinner/Spinner'
import ProcessTable from './ProcessTable'
import UserAvatar from "../../assets/images/svg/userprofile.svg";
import Configure from '../../assets/images/svg/configure.svg'
import { getTaskUserByUserId } from '../../containers/Config/Utils/ConfigUtils';

import {
    DEFAULT_PAGE_SIZE,

    ONGOING_PROCESS,
    WITHDRAWN_PROCESS,

    UPDATE_ONGOING_PROCESS,
    UPDATE_WITHDRAWN_PROCESS,
    PROCESS_DATETIME_FORMAT,
    WORKFLOW_REASSIGN,
    WORKFLOW_UPLOAD,
    WORKFLOW_WITHDRAW,
    COMPLETED_PROCESS,
    WORKFLOW_BULKINITIATE,
} from '../../Data/constants'
import WithdrawProcess from './ProcessView/WithdrawProcess'
import UserReassign from './ProcessView/UserReassign'
import DocUpload from './ProcessView/DocUpload'
import DrishtiButton from '../../components/UI/DrishtiButton/DrishtiButton'
import WithdrawReason from './ProcessView/WithdrawReason'
import { Popover, Select } from 'antd'
import HasWorkflowPermission from '../../components/UI/HasWorkflowPermission'
import FilterDropdown from '../../components/UI/FilterDropdown/FilterDropdown'
import { isCompletedWithdrawnActive } from '../utils'
import BulkImport from '../../components/UI/DocumentUpload/BulkImport'

export function HistoryPushHandler(orgId, history, ProcessKey, ProcessType, PageNumber, PageSize, getDebugString) {
    if(!ProcessKey){
        return;
    }
    history.replace({
        pathname: `/custom-workflow/org/${orgId}/process`,
        search: `?process_key=${ProcessKey}&processType=${ProcessType}&page=${PageNumber}&size=${PageSize}${getDebugString()}`
    })
}

const ProcessesList = (props) => {
    const [loader, setLoader] = useState(false)
    const [viewProcessId, setViewProcessId] = useState('')
    const [columns, setColumns] = useState([])
    const [bulkInitiateModal, setBulkInitiateModal] = useState({
        open: false,
        process: {}
    })
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);
    const [currentTask, setCurentTask] = useState([]);
    const [columnsList, setColumnsList] = useState([]);
    const { uuid: orgId, } = useParams();
    const history = useHistory()
    const APP_URL = process.env.REACT_APP_APP_URL;
    const updateType = useSelector(state => state.websocket.updateType);
    const processFilter = useSelector(state => state.auth.processFilter);
    const dispatch = useDispatch();

    const {
        selectedVendor,
        setSelectedVendor,
        vendorList,
        launchAppProcess
    } = props
    const processData = useSelector(state => state.process)

    const {
        size,
        searchData,
        process_key,
        processType,
        appData,
        offset,
        selectedOption,
        processStateFilter,
    } = processData;

    useEffect(() => {
        if (Array.isArray(appData?.process_view_column) && appData?.process_view_column.length) setColumnsList(appData?.process_view_column?.slice(0, 6))
        else setColumnsList(
            [
                { "key": "entity_name", "title": "Name", "dataIndex": "entity_name" },
                { "key": "initiator", "title": "Started by", "dataIndex": "initiator" },
                { "key": "startTime", "title": "Started at", "dataIndex": "startTime", "type": "date" }]
        )
    }, [appData?.process_view_column])

    const handleColumnSelectChange = selectedColumns => {
        const filteredColumns = Array.isArray(appData?.process_view_column) && appData?.process_view_column?.filter(col => selectedColumns?.includes(col.key));
        setColumnsList(filteredColumns)

    };
    const handleExpand = (key) => {
        // Check if the row is already expanded and toggle its state
        const isRowExpanded = expandedRowKeys.includes(key);
        if (isRowExpanded) {
            setExpandedRowKeys((prevKeys) => prevKeys.filter((k) => k !== key));
        } else {
            setExpandedRowKeys((prevKeys) => [key]);
        }
    };

    const stepProgress = (processDefinitionId, processInstanceId) => {
        setLoader(true)
        let url = `${APP_URL}/${orgId}/apps/step_progress?processDefinitionId=${processDefinitionId}&processInstanceId=${processInstanceId}&processDefinitionKey=${appData?.process_key}`;
        axios.get(
            url
        )
            .then(response => {
                let taskList = response.data.data.current.filter(task => task.assignee);
                const allTaskAssigneeEmail = taskList?.map(task => getTaskUserByUserId(orgId, task.assignee));
                let currentTasks = [];
                Promise.all(allTaskAssigneeEmail).then(
                    res => {
                        res?.forEach((data) => {
                            if(data?.userId){
                                let currentTask = taskList.find(task => task.assignee === data?.userId);
                                if(currentTask){
                                    currentTask.assignee = data?.email;
                                    currentTasks?.push(currentTask);
                                }
                            }
                        })
                        if(currentTasks?.length === 0 && currentTasks?.length !== taskList?.length){
                            setCurentTask(taskList);
                        } else {
                            setCurentTask(currentTasks);
                        }
                    }
                ).catch(() => {
                    setCurentTask(taskList);
                })
                .finally(() => setLoader(false))
            })
            .catch(() => setLoader(false))
    }

    useEffect(() => {
        const dataCol = columnsList?.map(item => {
            return {
                ...item,
                ellipsis: true,
                defaultSortOrder: "ascend",
                width: item?.width || 150,
                render: (text, record) => {
                    if (item?.dataIndex === 'firstName' || item?.dataIndex === 'entity_name') {
                        if (item?.showImage === true) {
                            return (
                                <div className='process_td_photo'>
                                    <EntityPhoto url={item?.entity_photo ? item?.entity_photo : UserAvatar}>
                                        {text}
                                    </EntityPhoto>
                                </div>
                            )
                        } else return text || '-'
                    } else if (item?.type === "date" || item?.type === 'time') {
                        return item?.format ? 
                        moment(text, item?.format).format(item?.displayFormat || PROCESS_DATETIME_FORMAT) : 
                        moment(text).format(item?.displayFormat || PROCESS_DATETIME_FORMAT)
                    }
                    return text || '-';

                },
            }
        })
        const list = dataCol?.length ? [
            ...dataCol,
            {
                // This column will contain the button to expand the row
                title: 'Actions',
                key: 'actions',
                align: "end",
                className: 'process-action-col',
                width: 200,
                fixed: 'right',
                ellipsis: true,
                render: (_, record) => (
                    <div className="btn-group" role="group">
                        <div className='dristhi-container'>
                            <DrishtiButton processId={record?.id} tenantId={orgId} />
                        </div>
                        <div
                            className="btn-group process_details_text user_button"
                            style={{ display: record?.deleteReason ? 'flex' : null, flexDirection: record?.deleteReason ? 'column' : 'row' }}
                        >
                            <button
                                type="button"
                                className="fancy-btn active"
                                onClick={(event) => {
                                    ViewDetailsToggler(event, record?.id)
                                    handleExpand(record.id)
                                }
                                }
                            >
                                {viewProcessId === record.id ? 'Hide Details' : 'Show Details'}
                            </button>
                            {!record?.deleteReason && (
                                <div role="group" className='process-actions'
                                >
                                    <HasWorkflowPermission
                                        permissions={
                                            processData.processType === ONGOING_PROCESS ?
                                            [WORKFLOW_REASSIGN, WORKFLOW_UPLOAD, WORKFLOW_WITHDRAW] :
                                            processData.processType !== WITHDRAWN_PROCESS ?
                                            [WORKFLOW_UPLOAD] : []
                                        }
                                        workflowId={appData?.id}
                                        yes={() => (
                                            <Popover placement="bottomRight" content={
                                                <ul className="actions-list process-actions-list">
                                                    {processData.processType === ONGOING_PROCESS &&
                                                        <>
                                                            <HasWorkflowPermission
                                                                permissions={[WORKFLOW_WITHDRAW]}
                                                                workflowId={appData?.id}
                                                                yes={() => (
                                                                    <li>
                                                                        <WithdrawProcess
                                                                            id={record?.id}
                                                                            page={offset}
                                                                            pageSize={size}
                                                                            processKey={appData?.process_key}
                                                                        />
                                                                    </li>
                                                                )}
                                                            />
                                                            <HasWorkflowPermission
                                                                permissions={[WORKFLOW_REASSIGN]}
                                                                workflowId={appData?.id}
                                                                yes={() => (
                                                                    <li>
                                                                        <UserReassign
                                                                            processInstanceId={record?.id}
                                                                            currentTask={currentTask}
                                                                            taskUsers={processData?.taskUsers}
                                                                            stepProgress={() => stepProgress(record?.processDefinitionId, record?.id)}
                                                                            setLoader={setLoader}
                                                                            loader={loader}
                                                                            orgId={orgId}
                                                                        />
                                                                    </li>
                                                                )}
                                                            />
                                                            
                                                        </>
                                                    }
                                                    {processData.processType !== WITHDRAWN_PROCESS &&
                                                        <HasWorkflowPermission
                                                            permissions={[WORKFLOW_UPLOAD]}
                                                            workflowId={appData?.id}
                                                            yes={() => (
                                                                <li>
                                                                    <DocUpload id={record?.id} setLoader={setLoader} />
                                                                </li>
                                                            )}
                                                        />
                                                    }
                                                </ul>
                                            } trigger="click" >
                                                <button
                                                    type="button"
                                                    style={{ fontSize: "12px" }}
                                                    className="btn btn-default dropdown-toggle actions"
                                                    aria-haspopup="true"
                                                    aria-expanded="false"
                                                >
                                                    <span className="caret actions-caret" />
                                                </button>
                                            </Popover>
                                        )}
                                    />
                                </div>
                            )}
                            {record?.deleteReason ? (
                                <div className="withdraw-reason">
                                    <WithdrawReason deleteReason={record?.deleteReason} />
                                </div>
                            ) : <div />
                            }
                        </div>
                    </div>
                ),
            }
        ] : []
        setColumns(list)

    }, [columnsList, viewProcessId, processType, loader])

    const isProcessAdded = updateType.type ? updateType.type.includes(UPDATE_ONGOING_PROCESS) : false
    const isProcessDeleted = updateType.type ? updateType.type.includes(UPDATE_WITHDRAWN_PROCESS) : false

    const prevSearchData = usePrevious(searchData)

    const fetchData = useCallback((newProcessType) => {
        const stringifiedSearchData = JSON.stringify(searchData)
        const stringifiedPrevSearchData = JSON.stringify(prevSearchData)
        let urlData = getUrlVars();
        const currentProcessType = newProcessType || processType;
        const processKey = urlData.process_key || appData?.process_key || ''

        if(processData?.loader){
            return;
        }

        if(searchData){
            dispatch(
                actions.searchProcess(
                    isCompletedWithdrawnActive(), 
                    appData.id, 
                    currentProcessType, 
                    searchData, 
                    urlData?.page, 
                    urlData?.size, 
                    selectedOption, 
                    orgId
                )
            ) // Search
        } else {
            if(
                (processData?.loadAgain || 
                urlData?.page == 1 ||
                !process_key || 
                stringifiedPrevSearchData !== stringifiedSearchData || 
                process_key !== processKey)
                && 
                isCompletedWithdrawnActive()
            ){
                dispatch(actions.getFilterProcess({
                    orgId,
                    processType: currentProcessType || ONGOING_PROCESS,
                    name:appData?.name,
                    id: appData?.id,
                    processKey: processKey,
                    pageSize:urlData?.size,
                    filters:processFilter,
                    selectedFilter:null,
                    vTenantId: selectedVendor?.id
                }))
            } else if(currentProcessType === ONGOING_PROCESS){
                dispatch(actions.getProcessOngoing(
                    urlData?.page,
                    processKey,
                    urlData?.size,
                    selectedOption,
                    processStateFilter,
                    orgId,
                    selectedVendor?.id
                ))
            } else if(currentProcessType === WITHDRAWN_PROCESS) {
                dispatch(actions.getProcessWithdrawn(
                    urlData?.page,
                    processKey,
                    urlData?.size,
                    selectedOption,
                    orgId,
                    selectedVendor?.id
                ))
            } else if(currentProcessType === COMPLETED_PROCESS){
                dispatch(actions.getProcessCompleted(
                    urlData?.page,
                    processKey,
                    urlData?.size,
                    selectedOption,
                    orgId,
                    selectedVendor?.id
                ))
            }
            
        }
    }, [
        searchData,
        prevSearchData,
        processType,
        updateType.time,
        appData, 
        orgId,
        selectedVendor,
        selectedOption,
        processStateFilter,
        processFilter,
        processData?.loader,
        processData?.loadAgain
    ])


    // Pagination page change handler
    const handlePageChange = (pageNumber, pageSize = 5) => {
        let urlData = getUrlVars()
        const prevPageSize = urlData.size ? parseInt(urlData.size, 10) : DEFAULT_PAGE_SIZE
        if(prevPageSize !== pageSize){
            HistoryPushHandler(orgId, history, appData?.process_key, processType, 1, pageSize, getDebugText)
        } else {
            HistoryPushHandler(orgId, history, appData?.process_key, processType, pageNumber, pageSize, getDebugText)
        }
        fetchData();
    }

    // Switch nav tab handler (ongoing / completed / withdraw)
    const ProcessTypeToggler = (processNavType) => {
        const urlData = getUrlVars()
        HistoryPushHandler(orgId, history, appData?.process_key, processNavType, 1, urlData?.size || 5, getDebugText)
        dispatch(actions.selectedProcess(processNavType))
        fetchData(processNavType);
    }

    const ViewDetailsToggler = (event, data) => {
        event.preventDefault()
        if (viewProcessId !== data && data) setViewProcessId(data)
        else setViewProcessId('')
    }
    const handleBulkModal = (value, bulk_process = {}) => {
        setBulkInitiateModal({
            open: value,
            process: bulk_process
        })
    }

    useEffect(() => {
        if(!selectedVendor?.loading){
            fetchData();
        }
    }, [searchData, selectedVendor, isProcessAdded, isProcessDeleted, appData?.process_key, processData?.withdrawnId])

    return (
        <div className='process_details_tab_cont'>
            {loader && (<Spinner />)}
            <BulkImport
                show={bulkInitiateModal?.open}
                handleShow={handleBulkModal}
                url={`${APP_URL}/${orgId}/apps/${bulkInitiateModal?.process?.id}/bulk_initiate`}
                title={`Bulk Initiate ${bulkInitiateModal?.process?.name} Process.`}
                history={history}
                redirectUrl={`/custom-workflow/org/${orgId}/process/import-history`}
            />
            <div className='process_tab_head_selector'>
            <ul className='nav nav-tabs process_tab_ongoing_comp_ul process_tab_nav_ul' role='tablist'>
                <ProcessTab process='Ongoing process' type={processData.processType} selectProcess={ProcessTypeToggler} count={columnsList?.length ? processData?.ongoingCount : 0} />
                {isCompletedWithdrawnActive() &&
                    <>
                        <ProcessTab process='Completed process' type={processData.processType} selectProcess={ProcessTypeToggler} count={columnsList?.length ? processData?.completedCount : 0} />
                        <ProcessTab process='Withdrawn process' type={processData.processType} selectProcess={ProcessTypeToggler} count={columnsList?.length ? processData?.withdrawnCount : 0} />
                    </>
                }
            </ul>
            {(appData?.custom_default_filter?.vendor) && (!!vendorList?.length && !selectedVendor?.loading) &&
                <div style={{ marginRight: "10px"}}>
                    <FilterDropdown
                        list={vendorList}
                        selectedItem={selectedVendor?.name}
                        onItemClickHandler={value => {
                            setSelectedVendor({...vendorList?.find(v => v.id === value)})
                        }}
                        classes='filter_by_value_dropdown mobile_half_filter_dropdown2'
                    />
                </div>
            }
            
                <HasWorkflowPermission
                    permissions={[WORKFLOW_BULKINITIATE]}
                    workflowId={appData?.id}
                    yes={() => (
                        <div>
                             <button
                                type='button'
                                className='fancy_btn active  process_btn'
                                onClick={() => handleBulkModal(true, {
                                    id: appData?.id,
                                    name: appData?.name
                                })}
                            >
                                Start Bulk
                            </button>
                        </div>
                    )}
                />
                <div className='process_select_div'>
                    <div className='column_config'>
                        <img src={Configure} />
                        <span className='column_config_label'>Columns </span>
                        <span className='caret' />
                    </div>
                    <Select
                        mode="multiple"
                        defaultValue={columnsList?.map(item => item?.key)}
                        onChange={handleColumnSelectChange}
                        maxTagCount='responsive'
                        value={columnsList?.map(item => item?.key)}
                        getPopupContainer={trigger => trigger.parentNode}
                    >
                        {Array.isArray(appData?.process_view_column) && appData?.process_view_column.length && appData?.process_view_column?.map((col, pInd) => (
                            <Option key={col.key+"_"+pInd} value={col.key}>
                                <input
                                    type="checkbox"
                                    checked={!!columnsList?.filter(item => item.key === col.key).length}
                                />
                                <span className='col_select_label'>{col.title}</span>
                            </Option>
                        ))}
                    </Select>
                </div>
            </div>
            <div className='tab-content process-tab-content'>
                <ProcessTable
                    viewProcessId={viewProcessId}
                    handlePageChange={handlePageChange}
                    viewDetailsToggler={ViewDetailsToggler}
                    columns={columns}
                    handleExpand={handleExpand}
                    expandedRowKeys={expandedRowKeys}
                    selectedVendor={selectedVendor}
                    launchAppProcess={launchAppProcess}
                    setLoader={setLoader}
                />
            </div>
        </div>
    )
}

export default ProcessesList
