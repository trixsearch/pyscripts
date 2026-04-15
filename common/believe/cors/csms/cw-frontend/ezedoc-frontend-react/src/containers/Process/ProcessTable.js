/* eslint-disable react-hooks/exhaustive-deps */

import React, {
    Fragment,
    useEffect,
    useState,
    Suspense,
    lazy,
    useMemo
} from 'react'
import { useParams, useLocation } from 'react-router-dom'

import {
    EmptyProcess,
} from './ProcessComponents'
// import Notify from './ProcessView/Notify'
import { Button } from '../../components/UI/AppButton/AppButton'
import { AdvTable, tableOnChangeHandler } from '../../components/UI/AntDesignTable/AdvTable'
import Spinner from '../../components/UI/Spinner/Spinner'
import Axios from "axios";
import { getUrlVars } from '../utils'
import { DATE_FORMAT, DEFAULT_PAGE_SIZE, ONGOING_PROCESS, WITHDRAWN_PROCESS } from '../../Data/constants'
import { useSelector } from 'react-redux'
import moment from 'moment'

const APP_URL = process.env.REACT_APP_APP_URL;
const LazyView = lazy(() => import('./ProcessView/PersonalDetail/ProcessView'))

const ProcessTable = (props) => {

    const {
        setLoader,
        viewProcessId,
        launchAppProcess,
        handlePageChange,
        columns,
        handleExpand,
        expandedRowKeys,
    } = props
    const processData = useSelector(state => state.process);
    const { uuid: orgId } = useParams();
    const location = useLocation();

    const {
        size,
        appData,
        appName,
        process_key,
        selected_card_list,
        loader
    } = processData

    const {
        data,
        count,
    } = useMemo(() => {
        if(processData?.processType === ONGOING_PROCESS){
            return {
                data: processData?.ongoingProcess || [],
                count: processData?.ongoingCount || 0
            }
        }
        if(processData?.processType === WITHDRAWN_PROCESS){
            return {
                data: processData?.withdrawn || [],
                count: processData?.withdrawnCount || 0
            }
        }
        return {
            data: processData?.completedProcess || [],
            count: processData?.completedCount || 0
        }
    }, [
        appData, 
        process_key, 
        processData?.processType,
        processData?.ongoingProcess,
        processData?.ongoingCount,
        processData?.completedProcess,
        processData?.completedCount,
        processData?.withdrawn,
        processData?.withdrawnCount
    ])

    const {
      id='',
    }=appData||{}

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
    const [_, setCurrentPageSize] = useState(size);
    const [filterData, setFilterData] = useState();
    const [activeFilters, setActiveFilters] = useState();
    const [sorterData, setSorterData] = useState();
    const [activeSorter, setActiveSorter] = useState();

    let selected_process = selected_card_list.filter((e) => e.id === id)
    let selected_cards_id = null;
    selected_cards_id = selected_process.length ? selected_process[0].id : null
    let selected_class = "completed_process_details_cont process_parent_notify"
    if (id === viewProcessId) {
        selected_class += " active_process"
    } else if (selected_cards_id === id) {
        selected_class += " selected_card_notify"
    }
    
    const setDateFormat = (data) => {
        if (data) {
            if (data.length > 0) {
                data.forEach(processDataItem => {
                    let processVars = [...processDataItem.variables]
                    processVars.forEach(processVar => {
                        if (processVar.type === 'date') {
                            let dateStr = moment(processVar.value).format(DATE_FORMAT)
                            let processVariable = { ...processVar }
                            processVariable.value = dateStr
                        }
                    })
                })
            }
        }
    }

    useEffect(() => {
        if(loader){
            return;
        }
        if (data.length) {
            const initiaterIds = [];
            setDateFormat(data);
            const newData = data?.map(item => {
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
        } else {
            setTableData([]);
        }
    }, [data, loader])

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

    if (!count) {
        let currentProcessTypeText = processData?.processType === ONGOING_PROCESS ? "ongoing" :
        processData?.processType === WITHDRAWN_PROCESS ?
            'withdrawn' : 'completed'
        return (
            <EmptyProcess
                message={`Looks like you don't have any ${currentProcessTypeText} processes. Let us launch a new`}
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
                {/* <Notify
                    save={saveHandler}
                    close={closeHandler}
                    notify_me={toBeNotified}
                    selected_email={selectedEmailIds}
                    selected_phone={selectedPhoneNumbers}
                    selected_cards={selected_card_list}
                /> */}
            {data
                && Array.isArray(data)
                && <AdvTable
                    loading={false}
                    columns={columns}
                    dataSource={tableData}
                    pagination={{
                        total: count,
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
                                        processKey={appData?.process_key}
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
                    pageSizeOptions={[5, 10, 20]}
                />}
        </Fragment>
    )
}

export default ProcessTable
