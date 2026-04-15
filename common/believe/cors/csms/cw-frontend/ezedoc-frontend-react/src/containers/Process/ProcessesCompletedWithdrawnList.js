/* eslint-disable react-hooks/exhaustive-deps */

import React, {
    Fragment,
    useEffect,
    useCallback,
    Suspense,
    lazy,
    useState,
    useMemo
} from 'react'
import { useParams, useLocation } from 'react-router-dom'

import {
    ProcessCard,
    EmptyProcess,
} from './ProcessComponents'
import { HistoryPushHandler } from './ProcessesList'
import { AdvTable, tableOnChangeHandler } from '../../components/UI/AntDesignTable/AdvTable'
import Spinner from '../../components/UI/Spinner/Spinner'
import Axios from "axios";
import { getUrlVars } from '../utils'
import { DEFAULT_PAGE_SIZE } from '../../Data/constants'

const APP_URL = process.env.REACT_APP_APP_URL;
const LazyView = lazy(() => import('./ProcessView/PersonalDetail/ProcessView'))

const ProcessesCompletedWithdrawnList = (props) => {

    const {
        history,
        setLoader,
        processData,
        isWithdrawn,
        completedData,
        withdrawnData,
        viewProcessId,
        completedDataCount,
        withdrawnDataCount,
        viewDetailsToggler,
        prevSearchData,
        handlePageChange,
        locationSearchData,
        getDebugText,
        columns,
        handleExpand,
        expandedRowKeys
    } = props

    const {
        size,
        appData,
        searchData,
        process_key,
        processType,
        selectedOption,
        processStateFilter,
        selectedFormFields,
        isAdvProcessFilterActive,
    } = processData

    const { uuid: orgId } = useParams();
    const location = useLocation();

    const currentPageSize = useMemo(() => {
        let urlData = getUrlVars()
        return urlData.size ? parseInt(urlData.size, 10) : DEFAULT_PAGE_SIZE
    }, [location]);

    const offset = useMemo(() => {
        let urlData = getUrlVars()
        return urlData.page ? parseInt(urlData.page, 10) : 1
    }, [location]);
    
    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(Number(offset) || 1);
    const [_, setCurrentPageSize] = useState(processData?.size);
    const [filterData, setFilterData] = useState();
    const [activeFilters, setActiveFilters] = useState();
    const [sorterData, setSorterData] = useState();
    const [activeSorter, setActiveSorter] = useState();



    const dataArr = isWithdrawn ? withdrawnData : completedData
    const dataCount = isWithdrawn ? withdrawnDataCount : completedDataCount

    const StringifiedSearchData = JSON.stringify(searchData)
    const StringifiedPrevSearchData = JSON.stringify(prevSearchData)

    // This function will be executed either one of the items from the deps array get changed
    const fetchData = useCallback(() => {
        const searchDataParsed = JSON.parse(StringifiedSearchData)
        const lastPage = Math.ceil(dataCount / locationSearchData.size)
        let processKey = process_key;
        let urlData = getUrlVars()
        if(!processKey)
            processKey = urlData.process_key || ''
        if (searchDataParsed)
            props.searchProcess(StringifiedSearchData !== StringifiedPrevSearchData, appData.id, processType, searchDataParsed, locationSearchData.page, currentPageSize || 5, selectedOption, orgId) // Search
        else if (!searchDataParsed) {
            if (prevSearchData)
                props.onAppSelect({
                    orgId,
                    processType,
                    name:appData.name,
                    id: appData.id,
                    processKey:appData.process_key,
                    selectedFormFields,
                    pageSize: currentPageSize,
                    selectedState: processStateFilter
                }) // Clearing the search
            else if (locationSearchData.page > lastPage && lastPage)
                HistoryPushHandler(orgId, history, processKey, processType, lastPage, currentPageSize, getDebugText) // Invalid page number fallback to last page
            if (isWithdrawn)
                props.getProcessWithdrawn(locationSearchData.page, processKey, currentPageSize, selectedOption, processStateFilter, orgId) // Get only withdrawn data
            else
                props.getProcessCompleted(locationSearchData.page, processKey, currentPageSize, selectedOption, processStateFilter, orgId) // Get only completed data
        }
    }, [locationSearchData.page, currentPageSize, isWithdrawn, StringifiedSearchData])

    useEffect(() => {
        if (dataArr.length) {
            const initiaterIds = [];
            const newData = dataArr?.map(item => {
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
    }, [dataArr])

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
    // This useEffect will be executed either one of the items from the deps array get changed
    useEffect(() => {
        // If page number changes
        // If processType changes
        // If searchData changes
        // fetchData function will be called
        const searchDataParsed = JSON.parse(StringifiedSearchData)
        if (locationSearchData.page || processType || searchDataParsed)
            fetchData()
    }, [
        fetchData,
        processType,
        StringifiedSearchData,
        locationSearchData.page,
    ])

    if (!dataCount) {
        let currentProcessTypeText = isWithdrawn ? 'withdrawn' : 'completed'
        return (
            <EmptyProcess
                message={`Looks like you don't have any ${currentProcessTypeText} processes.`}
            />
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
            {dataArr
                && Array.isArray(dataArr)
                && <AdvTable
                    loading={false}
                    columns={columns}
                    dataSource={tableData}
                    pagination={{
                        total: dataCount,
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
                                        typeofprocess="true"
                                        isProcessFinished
                                    />
                                </Suspense>
                            )
                        },

                        rowExpandable: record => record,
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

export default ProcessesCompletedWithdrawnList
