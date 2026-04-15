/* eslint-disable react-hooks/exhaustive-deps */

import React, {
    Fragment,
    useEffect,
    useCallback,
    useState,
    Suspense,
    lazy,
    useMemo
} from 'react'
import { useParams, useLocation } from 'react-router-dom'

import {
    ProcessCard,
    EmptyProcess,
} from './ProcessComponents'
import Notify from './ProcessView/Notify'
import { HistoryPushHandler } from './ProcessesList'
import { Button } from '../../components/UI/AppButton/AppButton'
import { AdvTable, tableOnChangeHandler } from '../../components/UI/AntDesignTable/AdvTable'
import Spinner from '../../components/UI/Spinner/Spinner'
import Axios from "axios";
import { getUrlVars } from '../utils'
import { DEFAULT_PAGE_SIZE } from '../../Data/constants'

const APP_URL = process.env.REACT_APP_APP_URL;
const LazyView = lazy(() => import('./ProcessView/PersonalDetail/ProcessView'))

const ProcessesOngoingList = (props) => {

    const {
        history,
        setLoader,
        clickCard,
        selectedId,
        processData,
        ongoingData,
        saveHandler,
        closeHandler,
        toBeNotified,
        viewProcessId,
        ongoingDataCount,
        handleMouseEnter,
        handleMouseLeave,
        selectedEmailIds,
        launchAppProcess,
        viewDetailsToggler,
        selectedPhoneNumbers,
        match,
        updateType,
        prevSearchData,
        isProcessAdded,
        isProcessDeleted,
        handlePageChange,
        locationSearchData,
        getDebugText,
        columns,
        handleExpand,
        expandedRowKeys
    } = props
    const { uuid: orgId } = useParams();
    const location = useLocation();

    const {
        size,
        appData,
        appName,
        taskUsers,
        searchData,
        process_key,
        processType,
        selectedOption,
        processStateFilter,
        selectedFormFields,
        selected_card_list,
        isAdvProcessFilterActive,
    } = processData

    const {
      id='',
      name='',
      process_key:appProcesskey='',
    }=appData||{}

    const currentPageSize = useMemo(() => {
        let urlData = getUrlVars()
        return urlData.size ? parseInt(urlData.size, 10) : DEFAULT_PAGE_SIZE
    }, [location]);

    const offset = useMemo(() => {
        let urlData = getUrlVars()
        return urlData.page ? parseInt(urlData.page, 10) : 1
    }, [location]);

    const StringifiedSearchData = JSON.stringify(searchData)
    const StringifiedPrevSearchData = JSON.stringify(prevSearchData)
    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(Number(offset) || 1);
    const [_, setCurrentPageSize] = useState(size);
    const [filterData, setFilterData] = useState();
    const [activeFilters, setActiveFilters] = useState();
    const [sorterData, setSorterData] = useState();
    const [activeSorter, setActiveSorter] = useState();

    let selected_process = selected_card_list.filter((e) => e.id === id)
    let selected_cards_id = null;
    selected_cards_id = selected_process.length ? selected_process[0].id : null
    let selected_class = "completed_process_details_cont process_parent_notify"
    let isProcessOverlayPage = false
    let isProcessOverlayClass = ""
    if (id === viewProcessId) {
        selected_class += " active_process"
        isProcessOverlayClass = "processOverlayPage in"
        isProcessOverlayPage = true

    } else if (selected_cards_id === id) {
        selected_class += " selected_card_notify"
    }

    // This function will be executed either one of the items from the deps array get changed
    const fetchData = useCallback(() => {
        const searchDataParsed = JSON.parse(StringifiedSearchData)
        const lastPage = Math.ceil(ongoingDataCount / locationSearchData.size)
        let processKey = process_key;
        let urlData = getUrlVars()
        if(!processKey)
            processKey = urlData.process_key || ''
        if (searchDataParsed)
            props.searchProcess(StringifiedSearchData !== StringifiedPrevSearchData, appData.id, processType, searchDataParsed, locationSearchData.page, currentPageSize || 5, selectedOption, orgId) // Search
        else if (!searchDataParsed) {
            if (prevSearchData) {
                props.onAppSelect({
                    orgId,
                    processType,
                    name:name,
                    id: id,
                    processKey:appProcesskey,
                    selectedFormFields,
                    pageSize: currentPageSize,
                    selectedState: processStateFilter
                    }) // Clearing the search
                props.getProcessOngoing(locationSearchData.page, processKey, currentPageSize, selectedOption, processStateFilter, orgId) // Get only ongoing data
            }
            else if (locationSearchData.page > lastPage && lastPage)
                HistoryPushHandler(orgId, history, processKey, processType, lastPage, currentPageSize, getDebugText) // Invalid page number fallback to last page
            else
                props.getProcessOngoing(locationSearchData.page, processKey, currentPageSize, selectedOption, processStateFilter, orgId) // Get only ongoing data
        }
    }, [locationSearchData.page, currentPageSize, updateType.time, StringifiedSearchData, process_key])

    // This useEffect will be executed either one of the items from the deps array get changed
    useEffect(() => {
        // If page number changes
        // If new process addition (updateType.time && isProcessAdded)
        // If any process withdrawn (updateType.time && isProcessDeleted)
        // If searchData changes
        // fetchData function will be called

        // In the continuous addition/withdrawn of the process, isProcessAdded/isProcessDeleted variable will always be true.
        // We can find the change only by updateType.time variable because it gives time of process addition/withdrawn @ each update.
        const searchDataParsed = JSON.parse(StringifiedSearchData)
        if (locationSearchData.page || (updateType.time && isProcessAdded) || (updateType.time && isProcessDeleted) || searchDataParsed)
            fetchData()
    }, [
        fetchData,
        isProcessAdded,
        updateType.time,
        isProcessDeleted,
        StringifiedSearchData,
        locationSearchData.page,
        
    ])
    useEffect(() => {
        if (ongoingData.length) {
            const initiaterIds = [];
            const newData = ongoingData?.map(item => {
                const variables = item?.variables?.map(entity => ({
                    [entity.name]: entity?.value
                }))
                const resultObject = variables.reduce((acc, obj) => {
                    const [key, value] = Object.entries(obj)[0];
                    acc[key] = value;
                    if(key === "initiator"){
                        initiaterIds.push(value);
                    }
                    return acc;
                }, {});
                return {
                    ...resultObject,
                    ...item
                }
            })
            if(initiaterIds?.length){
                Axios.post(`${APP_URL}/${orgId}/users/org_users/transform_userid`, initiaterIds)
                .then((res) => {
                  setTableData(
                    newData?.map((d) => {
                        const initiatorValues = res?.data?.data;
                        if(initiatorValues[d["initiator"]]){
                            d["initiator"] = initiatorValues[d["initiator"]];
                        }

                        return d;
                    })
                  )
                })
                .catch(() => {
                    setTableData(newData)
                })
            } else {
                setTableData(newData)
            }
        }
    }, [ongoingData])

    const handleTableChange = (pagination, filters, sorter) => {
        const data = {
            columns,
            setCurrentPage,
            setCurrentPageSize,
            setFilterData,
            setActiveFilters,
            setSorterData,
            setActiveSorter,
            initialSortData: "startTime",
            firstColumnKey: columns[0].key,
        };
        handlePageChange(pagination?.current, pagination?.pageSize)
        tableOnChangeHandler(pagination, filters, sorter, "process", data);
    };

    if (!ongoingDataCount) {
        return (
            <EmptyProcess
                message={`Looks like you don't have any ongoing processes. Let us launch a new`}
            >
                <Button
                    variant='link'
                    onClick={launchAppProcess}
                >
                    {appName}
                </Button>
                process!
            </EmptyProcess>
        )
    }

    else if (!columns?.length) {
        return (
            <EmptyProcess
                message={`Looks like you don't have any column configured`}
            >
            </EmptyProcess>
        )
    }

    return (
        <Fragment>
                <Notify
                    save={saveHandler}
                    close={closeHandler}
                    notify_me={toBeNotified}
                    selected_email={selectedEmailIds}
                    selected_phone={selectedPhoneNumbers}
                    selected_cards={selected_card_list}
                />
            {ongoingData
                && Array.isArray(ongoingData)
                && <AdvTable
                    loading={false}
                    columns={columns}
                    dataSource={tableData}
                    pagination={{
                        total: ongoingDataCount,
                        current: Number(offset),
                        pageSize: currentPageSize,
                    }}
                    rowKey={(record) => record.id}
                    expandable={{
                        expandedRowRender: (record) => {
                            return (
                                <Suspense fallback={<Spinner />}>
                                    <LazyView
                                        data={record}
                                        key={record.endTime}
                                        processKey={process_key}
                                        setLoader={setLoader}
                                        typeofprocess="false"
                                        isProcessFinished={false}
                                    />
                                </Suspense>
                            )
                        },
                        expandedRowKeys,
                        onExpand: (expanded, record) => {
                            if (expanded) {
                                handleExpand(record.id);
                            }
                        },
                        expandIcon: () => null,
                    }}
                    onChange={handleTableChange}
                />}
        </Fragment>
    )
}

export default ProcessesOngoingList
