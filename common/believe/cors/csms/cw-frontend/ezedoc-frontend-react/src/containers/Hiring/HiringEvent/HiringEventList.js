/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment,
    useState,
    useEffect
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
// import { Switch } from 'antd'
import {
    DeleteOutlined,
    EditOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import axios from 'axios'

import routes from 'urls'
import { DATE_FORMAT } from 'Data/constants'
import Empty from 'components/Empty'
import { parseQueryString, Item, isMobile } from 'containers/utils'
import {
    getHiringEvent,
    deleteHiringEvent,
} from 'store/actions/index'
import DeleteModal from 'components/UI/DeleteModel/DeleteModal'
import {
    AdvTable,
    clearFiltersHandler,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'
import Spinner from 'components/UI/Spinner/Spinner'
import { addToast } from 'components/Toast/actions'
import { DefaultChartComponents } from 'containers/Config/View/JobEventChartConfig/constants'

import { CardComponent } from '../utils'
import Chart, { Charts } from '../Charts'
import OverlayFilter from '../OverlayFilter/OverlayFilter'

import '../hiring-routes-common.css'
import './HiringEvent.css'
import './HiringEventList.css'

const APP_URL = process.env.REACT_APP_APP_URL;

const HiringEventList = props => {
    const {
        loader,
        feature,
        history,
        addToaster,
        totalCount,
        renderPage,
        deleteEvent,
        authUserRole,
        storedSorter,
        storedFilters,
        addPermission,
        editPermission,
        storedPageSize,
        hiringEventList,
        deletePermission,
        getHiringEventList,
        storedActiveSorter,
        storedActiveFilters,
        partnerName,
    } = props

    const locationInfo = useLocation()
    const { page = 1 } = parseQueryString(locationInfo.search)
    const { uuid: orgId } = useParams();
    
    const [filterData, setFilterData] = useState(storedFilters)
    const [activeFilters, setActiveFilters] = useState(storedActiveFilters)
    const [sorterData, setSorterData] = useState(storedSorter)
    const [activeSorter, setActiveSorter] = useState(storedActiveSorter)
    const [currentPage, setCurrentPage] = useState(Number(page) || 1)
    const [currentPageSize, setCurrentPageSize] = useState(storedPageSize)
    const [showWarning, setShowWarning] = useState(false)
    const [hiringEventId, setHiringEventId] = useState('')
    const [hiringEventTitle, setHiringEventTitle] = useState('')
    const [totalEvent, setTotalEvent] = useState(0)
    const [totalApplicant, setTotalApplicant] = useState(0)
    // const [isChartView, setChartView] = useState(false)
    const [dynamicCharts, setDynamicCharts] = useState([])
    const [stateLoader, setStateLoader] = useState(false)
    const [showFilter, setShowFilter] = useState(false)
    const [dynamicChartFilters, setDynamicChartFilters] = useState({})
    // const [disabled, setDisabled] = useState(false)

    const fetchTotalEvent = () => {
        let time = moment().toDate();
        let currentDate = time.toISOString()
        axios
            .get(`${APP_URL}/${orgId}/jobs/hiring_event?event_end_date__gte=${currentDate}`)
            .then(res => setTotalEvent(res.data.pagination_data.total_count))
    }

    const fetchTotalApplicant = () => {
        axios
            .get(`${APP_URL}/${orgId}/jobs/candidate/total_applicant_in_active_event`)
            .then(res => setTotalApplicant(res.data.data))
    }

    useEffect(() => {
        fetchTotalEvent()
        fetchTotalApplicant()
    }, [])

    const showWarningModal = (id, name) => {
        setShowWarning(true)
        setHiringEventId(id)
        setHiringEventTitle(name)
    }

    const handleDelete = () => {
        deleteEvent(orgId, hiringEventId, totalCount, currentPageSize, currentPage, renderPage)
        setShowWarning(false)
    }

    const columns = [
        {
            title: () => (
                <div className='adv-table-total-items-parent'>
                    Event Id
                    <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
                </div>
            ),
            dataIndex: 'event_id',
            key: 'eventId',
            backendKey: 'event_id',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'event_id' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'event_id', 'event id'),
            render: (text, record) => {
                let eventEndDate = moment(record.event_end_date)
                let currentDate = moment()
                let profileButton = eventEndDate.isAfter(currentDate) ? 'show' : 'hide'
                return deletePermission
                    ? <Item type='navlink' data={text} path={routes.JOB_LIST.eventTo(orgId, record.event_id, profileButton, currentPage)} id={record.id} name='event-id-navlink' />
                    : <Item type='text' data={text} id={record.id} name='event-id' />
            },
            sortOrder: activeSorter.columnKey === 'eventId' ? activeSorter.order : false,
        },
        {
            title: 'Event Title',
            dataIndex: 'title',
            key: 'eventTitle',
            backendKey: 'title',
            sorter: true,
            ellipsis: true,
            render: (text, record) => text ? <Item type='text' data={text} id={record.id} name='event-title' /> : '',
            ...getColumnSearchProps(filterData, 'title', 'hiring event title'),
            sortOrder: activeSorter.columnKey === 'eventTitle' ? activeSorter.order : false,
        },
        {
            title: 'Start Date',
            dataIndex: 'event_start_date',
            key: 'startDate',
            backendKey: 'event_start_date',
            sorter: true,
            ellipsis: true,
            render: (event_start_date, record) => event_start_date ? <Item type='text' data={moment(event_start_date).local().format(DATE_FORMAT)} id={record.id} name='event-start-date' /> : '',
            sortOrder: activeSorter.columnKey === 'startDate' ? activeSorter.order : false,
        },
        {
            title: 'End Date',
            dataIndex: 'event_end_date',
            key: 'endDate',
            backendKey: 'event_end_date',
            sorter: true,
            ellipsis: true,
            render: (event_end_date, record) => event_end_date ? <Item type='text' data={moment(event_end_date).local().format(DATE_FORMAT)} id={record.id} name='event-end-date' /> : '',
            sortOrder: activeSorter.columnKey === 'endDate' ? activeSorter.order : false,
        },
        {
            title: 'Location',
            dataIndex: 'interview_location',
            key: 'interviewLocation',
            backendKey: 'interview_location',
            sorter: true,
            ellipsis: true,
            render: (text, record) => text ? <Item type='text' data={text} id={record.id} name='location' /> : '',
            ...getColumnSearchProps(filterData, 'interview_location', 'location'),
            sortOrder: activeSorter.columnKey === 'interviewLocation' ? activeSorter.order : false,
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            width: '7%',
            align: 'center',
            render: (text, record) => {
                let content1 = null;
                let content2 = null;
                
                if (editPermission) content1 = (
                    <Item
                        type='icon'
                        data='Edit'
                        id={record.id}
                        name='job-edit-icon'
                    >
                        <NavLink
                            to={routes.HIRING_EVENT_EDIT.to(orgId, record.id, page)}
                        >
                            <EditOutlined
                                data-tip
                                data-for={`job-edit-icon-${record.id}`}
                            />
                        </NavLink>
                    </Item>
                )
                if (deletePermission) content2 = (
                    <>
                        <Item
                            type='icon'
                            data='Delete'
                            id={record.id}
                            name='event-delete-icon'
                        >
                            <DeleteOutlined
                                data-tip
                                data-for={`event-delete-icon-${record.id}`}
                                onClick={() => showWarningModal(record.id, record.event_id)}
                            />
                        </Item>
                    </>
                )
                return (
                    <Fragment>
                        {content1 || null}
                        {content1 && content2 ? <span>&nbsp;&nbsp;&nbsp;</span> : null}
                        {content2 || null}
                    </Fragment>
                )
            }
        },
    ]

    useEffect(() => {
        function fetchDynamicCharts() {
            const url = `${APP_URL}/${orgId}/config/event_config`
            setStateLoader(true)
            axios.get(url)
                .then(res => {
                    const data = res.data.data
                    const selectedRecord = data
                        && Array.isArray(data)
                        && data.length > 0
                        && data.filter(item => item.role_name === authUserRole)
                    if (selectedRecord && selectedRecord.length !== 0) setDynamicCharts(selectedRecord[0].grid_data)
                })
                .catch(err => {
                    if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                    else addToaster('error', 'Error', 'Something went wrong')
                })
                .finally(() => setStateLoader(false))
        }

        if (isChartView) fetchDynamicCharts()
    }, [orgId, isChartView])

    useEffect(() => {
        setCurrentPage(Number(page) || 1)
    }, [page])

    useEffect(() => {
        history.replace({
            pathname: '',
            search: `?page=${currentPage}`
        })
    }, [currentPage])

    useEffect(() => {
        if (feature) getHiringEventList(orgId, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
    }, [
        orgId,
        feature,
        filterData,
        sorterData,
        renderPage,
        getHiringEventList,
        currentPage,
        currentPageSize,
    ])

    useEffect(() => {
        if (hiringEventList.length === 0) setDisabled(true)
        else setDisabled(false)
    })

    const handleTableChange = (pagination, filters, sorter) => {
        const data = {
            columns,
            setFilterData,
            setSorterData,
            setCurrentPage,
            setActiveSorter,
            setActiveFilters,
            setCurrentPageSize,
            initialSortData: 'event_id',
            firstColumnKey: columns[0].key,
            firstColumnCustomTitle: 'Event Id',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'hiringevent', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    // const toggleHandler = checked => {
    //     if (checked) setChartView(true)
    //     else setChartView(false)
    // }

    let chartFilters = { ...dynamicChartFilters }
    if(partnerName) chartFilters.sourcing_partner__name = [partnerName]

    return (
        <Fragment>
            {stateLoader && <Spinner />}
            <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
                <div className='process_details_tab_cont hiring-event'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
                        <li className='process_tab_last_li'>
                            <div className='process_details_btn_cont'>
                                {
                                    addPermission && !isChartView ? (
                                        <NavLink to={routes.HIRING_EVENT_CREATE.to(orgId, page)}>
                                            <button
                                                type='button'
                                                className='process_fancy_btn fancy_btn active'
                                            >
                                                Create Event
                                            </button>
                                        </NavLink>
                                    ) : null
                                }
                                {
                                    isChartView
                                        ? (
                                            <button
                                                type='button'
                                                className='process_fancy_btn fancy_btn active'
                                                onClick={() => setShowFilter(true)}
                                            >
                                                Filter
                                            </button>
                                        ) : null
                                }
                            </div>
                            {/* <div className='process_details_btn_cont2'>
                                <Switch
                                    disabled={disabled}
                                    checkedChildren='Chart'
                                    unCheckedChildren='List'
                                    onChange={toggleHandler}
                                />
                            </div> */}
                        </li>
                    </ul>
                    <DeleteModal
                        show={showWarning}
                        itemName={hiringEventTitle}
                        handleDelete={handleDelete}
                        hideWarning={() => setShowWarning(false)}
                    />
                    {
                        isChartView
                            ? (
                                <OverlayFilter
                                    showFilter={showFilter}
                                    filterData={dynamicChartFilters}
                                    filterDataHandler={setDynamicChartFilters}
                                    onCloseHandler={() => setShowFilter(false)}
                                />
                            ) : null
                    }
                    {
                        isChartView
                            ? (
                                <Charts
                                    style={{
                                        height: 'calc(100vh - 170px)',
                                    }}
                                >
                                    {
                                        DefaultChartComponents
                                        && Array.isArray(DefaultChartComponents)
                                        && DefaultChartComponents.length > 0
                                        && DefaultChartComponents.map((item, index) => (
                                            <Chart
                                                key={`default-chart-${index + 1}`}
                                                title={item.title}
                                                type={item.chartType.id}
                                                api={`${APP_URL}/${orgId}/jobs/chart`}
                                                queryParams={{
                                                    chartName: item.chartContent.id,
                                                }}
                                                postData={chartFilters}
                                            />
                                        ))
                                    }
                                    {
                                        dynamicCharts
                                        && Array.isArray(dynamicCharts)
                                        && dynamicCharts.length > 0
                                        && dynamicCharts.map((item, index) => (
                                            <Chart
                                                key={`dynamic-chart-${index + 1}`}
                                                title={item.title}
                                                type={item.chartType.id}
                                                api={`${APP_URL}/${orgId}/jobs/chart`}
                                                queryParams={{
                                                    chartName: item.chartContent.id,
                                                }}
                                                postData={chartFilters}
                                            />
                                        ))
                                    }
                                </Charts>
                            ) : (
                                <Fragment>
                                    <div className='event-small-cards small-cards'>
                                        <CardComponent
                                            count={totalEvent}
                                            name='Active Events'
                                            customClassNameForCount='stat-blue'
                                        />
                                        <CardComponent
                                            count={totalApplicant}
                                            name='Total Applicants in Active Events'
                                            customClassNameForCount='stat-green'
                                        />
                                    </div>

                                    {hiringEventList.length===0 && isMobile() ? <Empty/>
                                    :(
<AdvTable
                                        loading={loader}
                                        columns={columns}
                                        dataSource={hiringEventList}
                                        pagination={{
                                            total: totalCount,
                                            current: currentPage,
                                            pageSize: currentPageSize,
                                        }}
                                        rowKey={record => record.id}
                                        onChange={handleTableChange}
                                        activeFilters={activeFilters}
                                        handleClearFilters={handleClearFilters}
/>
)
                                    }
                                </Fragment>
                            )
                    }
                </div>
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ hiringEvent, auth }) => ({
    hiringEventList: hiringEvent.data,
    loader: hiringEvent.loader,
    totalCount: hiringEvent.total,
    renderPage: hiringEvent.renderPage,
    storedPageSize: hiringEvent.size,
    storedFilters: hiringEvent.filters,
    storedSorter: hiringEvent.sorter,
    storedActiveSorter: hiringEvent.activeSorter,
    storedActiveFilters: hiringEvent.activeFilters,

    feature: auth.uiFeatures.hiringevent.view,
    partnerName: auth.partner?.name,
    addPermission: auth.uiPermissions.hiringevent.add,
    editPermission: auth.uiPermissions.hiringevent.change,
    deletePermission: auth.uiPermissions.hiringevent.delete,
    authUserRole: auth.groupName,
})

const mapDispatchToProps = {
    addToaster: addToast,
    getHiringEventList: getHiringEvent,
    deleteEvent: deleteHiringEvent
}

export default connect(mapStateToProps, mapDispatchToProps)(HiringEventList)
