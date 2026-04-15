/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */
import React, {
    Fragment,
    useState,
    useEffect
} from 'react'
import { connect } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import { Switch } from 'antd'
import moment from 'moment'
import axios from 'axios'

import routes from 'urls'
import { DATE_FORMAT, ITEMS_PER_PAGE } from 'Data/constants'
import Empty from 'components/Empty'
import { parseQueryString, Item, isMobile } from 'containers/utils'
import DeleteModal from 'components/UI/DeleteModel/DeleteModal'
import BulkImport from 'components/UI/DocumentUpload/BulkImport'
// import DropDownButton from 'components/UI/AppButton/DropDownButton'
import { Button } from 'components/UI/AppButton/AppButton'
import Spinner from 'components/UI/Spinner/Spinner'
import {
    AdvTable,
    clearFiltersHandler,
    getFilteredValueProp,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'
import { DefaultChartComponents } from 'containers/Config/View/JobEventChartConfig/constants'
import { addToast } from 'components/Toast/actions'

import {
    getJobs,
    deleteJob,
    getEventJobs,
} from 'store/actions/index'

// import { BULK_JOBS_TITLE } from '../utils'
import Chart, { Charts } from '../Charts'
import OverlayFilter from '../OverlayFilter/OverlayFilter'
import menuIcon from '../../../assets/images/svg/ellipsis-vertical.svg'
import DrawerFilter from '../DrawerFilter/DrawerFilter'

import './jobList.css'
import '../../Dashboard/WorkflowFloatingDropdown.css';
import { isVendor } from '../../../platformDataStoreContext'

const APP_URL = process.env.REACT_APP_APP_URL;

const JobList = props => {
    const {
        loader,
        feature,
        history,
        jobList,
        addToaster,
        totalCount,
        renderPage,
        getJobList,
        authUserRole,
        storedSorter,
        storedFilters,
        addPermission,
        storedSorter2,
        // editPermission,
        viewPermission,
        storedPageSize,
        storedFilters2,
        deleteSingleJob,
        getEventJobList,
        storedPageSize2,
        deletePermission,
        storedActiveSorter,
        storedActiveFilters,
        storedActiveSorter2,
        storedActiveFilters2,
        partnerName,
    } = props

    const locationInfo = useLocation()
    const {
        page = 1,
        next = 1,
        eventId = null,
        profileButton = 'show',
        vendorId 
    } = parseQueryString(locationInfo.search)
    const { uuid: orgId } = useParams();

    const [filterData, setFilterData] = useState(eventId ? storedFilters2 : storedFilters)
    const [activeFilters, setActiveFilters] = useState(eventId ? storedActiveFilters2 : storedActiveFilters)
    const [sorterData, setSorterData] = useState(eventId ? storedSorter2 : storedSorter)
    const [activeSorter, setActiveSorter] = useState(eventId ? storedActiveSorter2 : storedActiveSorter)
    const [currentPage, setCurrentPage] = useState(Number(page) || 1)
    const [currentPageSize, setCurrentPageSize] = useState(eventId ? storedPageSize2 : storedPageSize)
    const [showWarning, setShowWarning] = useState(false)
    const [jobId, setJobId] = useState('')
    const [customJobId, setCustomJobId] = useState('')
    const [isOpenImportModal, setIsOpenImportModal] = useState(false)
    const [isChartView, setChartView] = useState(false)
    const [dynamicCharts, setDynamicCharts] = useState([])
    const [stateLoader, setStateLoader] = useState(false)
    const [showFilter, setShowFilter] = useState(false)
    const [dynamicChartFilters, setDynamicChartFilters] = useState({})
    const [jobContextApps, setJobContectApps] = useState();
    const [disabled, setDisabled] = useState(false)
    const [primaryApps, setPrimaryApps] = useState([]);
    const [allApps, setAllApps] = useState([])
    const [bulkProcess, setBulkProcess] = useState();
    const isVendorFlag = isVendor();
    const [showSideFilter, setShowSideFilter] = useState(false);
    const [filters, setFilters] = useState({});
    const [drawerFilters, setDrawerFilters] = useState({});

    const [stat, setStat] = useState('All');
    const [stages, setStages] = useState([]);

    const tabs = ['All', 'Active', 'Inactive', 'Draft', 'Paused'];
    const Icon = ({ type, ...rest }) => {
        const icons = require(`@ant-design/icons`);
        const Component = icons[type];
        return <Component {...rest} />
    }

    const showWarningModal = (id, name) => {
        setShowWarning(true)
        setJobId(id)
        setCustomJobId(name)
    }

    const handleDelete = () => {
        deleteSingleJob(orgId, jobId, totalCount, currentPageSize, currentPage, renderPage)
        setShowWarning(false)
    }


    const renderAppIcon = (app, record) => {
        if (app.icon_class = 'edit') {
            return <EditOutlined
                data-tip
                data-for={`job-${app.icon_class}-icon-${record.id}`}
                onClick={() => onStartWorkflow(app, record)}
            />
        }
        if (app.icon_class = 'clone') {
            return <EditOutlined
                data-tip
                data-for={`job-${app.icon_class}-icon-${record.id}`}
                onClick={() => onStartWorkflow(app, record)}
            />
        }
    }

    const columns = [
        {
            title: () => (
                <div className='adv-table-total-items-parent'>
                    ID
                    <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
                </div>
            ),
            dataIndex: 'job_id',
            key: 'jobId',
            backendKey: 'job_id',
            width:'20%',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === '-job_id' ? ['ascend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'job_id', 'job id'),
            // render: (text, record) => {
            //     return editPermission
            //         ? <Item type='navlink' data={text} path={routes.JOB_EDIT.to(record.id, currentPage)} id={record.id} name='job-id-navlink' />
            //         : <Item type='text' data={text} id={record.id} name='job-id' />
            // },
            render: (text, record) => {
                return viewPermission ? (
                    <Item
                        type="navlink"
                        data={text}
                        id={record.id}
                        name="job-id-navlink"
                        onClick={()=>{
                            window.sendEvent("Hire_Clicks_on_hiring_request_list",{
                            HR_ID:record.job_id,
                            JobRole:record.role_name
                        })}}
                        path={
                            eventId
                                ? routes.JOB_VIEW.eventTo(orgId, record.id, eventId, profileButton, currentPage, vendorId)
                                : routes.JOB_VIEW.to(orgId, record.id, currentPage, vendorId)
                        }
                    />
                ) : (
                    <Item type="text" data={text} id={record.id} name="job-id" />
                )
            },
            sortOrder: activeSorter.columnKey === 'jobId' ? activeSorter.order : false,
        },
        {
            title: 'Name',
            dataIndex: 'job_title',
            key: 'job_title',
            backendKey: 'job_title',
            sorter: true,
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='job-role' /> : ''),
            ...getColumnSearchProps(filterData, 'job_title', 'name'),
            sortOrder: activeSorter.columnKey === 'job_title' ? activeSorter.order : false,
        },
        {
            title: 'Role',
            dataIndex: 'role_name',
            key: 'jobRole',
            backendKey: 'role__name',
            sorter: true,
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='job-role' /> : ''),
            ...getColumnSearchProps(filterData, 'role__name', 'job role'),
            sortOrder: activeSorter.columnKey === 'jobRole' ? activeSorter.order : false,
        },
        {
            title: 'City',
            dataIndex: 'work_city',
            key: 'work_city',
            backendKey: 'work_city',
            sorter: true,
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='job-work-location' /> : ''),
            ...getColumnSearchProps(filterData, 'work_city', 'city'),
            sortOrder: activeSorter.columnKey === 'work_city' ? activeSorter.order : false,
        },
        {
            title: 'Locality',
            dataIndex: 'work_locality',
            key: 'work_locality',
            backendKey: 'work_locality',
            sorter: true,
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={text.map(location=>location.locality.name).join(',')} id={record.id} name='job-work-location' /> : ''),
            ...getColumnSearchProps(filterData, 'work_locality', 'work locality'),
            sortOrder: activeSorter.columnKey === 'work_locality' ? activeSorter.order : false,
        },
        {
            title: 'Available Positions',
            dataIndex: 'positions',
            key: 'positions',
            backendKey: 'available_positions',
            sorter: true,
            ellipsis: true,
            render: (text, record) => (record.total_positions && record.available_positions ? <Item type='text' data={`${record.available_positions}/${record.total_positions}`} id={record.id} name='job-positions' /> : <Item type='text' data="NA" id={record.id} name='job-positions' />),
            // ...getColumnSearchProps(filterData, 'available_positions', 'positions', 'number'),
            sortOrder: activeSorter.columnKey === 'positions' ? activeSorter.order : false,
        },
        {
            title: 'Target Date',
            dataIndex: 'target_date_to_finish_hiring',
            key: 'targetDate',
            backendKey: 'target_date_to_finish_hiring',
            sorter: true,
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={moment(text).local().format(DATE_FORMAT)} id={record.id} name='job-target-date' /> : ''),
            ...getColumnSearchProps(filterData, 'target_date_to_finish_hiring', 'target date', 'date'),
            sortOrder: activeSorter.columnKey === 'targetDate' ? activeSorter.order : false,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            backendKey: 'status',
            filters: [
                { text: 'Active', value: 'Active' },
                { text: 'Inactive', value: 'Inactive' },
                { text: 'Achieved', value: 'Achieved' },
                { text: 'Draft', value: 'Draft' },
                { text: 'Closed', value: 'Closed' },
                { text: 'Sourcing Paused', value: 'Sourcing Paused' },
                { text: 'Hiring Paused', value: 'Hiring Paused' },
            ],
            filterMultiple: false,
            render: (text, record) => <Item type='text' data={text} id={record.id} name='job-status' />,
            ...getFilteredValueProp(filterData, 'status'),
        },
    ]
    if(!isVendorFlag){
        columns.push( {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            // width: '20%',
            // align: 'center',
            render: (text, record) => {
                let content = (<>
                    {/* <Item
                        type='icon'
                        data='Delete'
                        id={record.id}
                        name='job-delete-icon'
                    >
                        <DeleteOutlined
                            data-tip
                            data-for={`job-delete-icon-${record.id}`}
                            onClick={() => showWarningModal(record.id, record.job_id)}
                        />
                    </Item> */}
                    {jobContextApps?.map((app) => <Item
                        type='icon'
                        data={app.name}
                        id={app.id}
                        className="action-btn"
                        name={`job-${app.id}-icon`}
                    >
                        <Icon
                            data-tip
                            type={app.icon_class}
                            data-for={`job-edit-icon-${app.id}`}
                            onClick={() => {
                            window.sendEvent("Hire_Edit_hiring_request",{
                                HR_ID:record.id,
                                Job_Role:record.role_name,
                                Job_Location_City:record.work_city
                                })
                                    onStartWorkflow(app, record)
                            }}
                        />
                    </Item>)}
                </>
                )
                return (
                    <Fragment>
                        {content || null}
                    </Fragment>
                )
            }
        })
    }
    useEffect(() => {
        function fetchDynamicCharts() {
            const url = `${APP_URL}/${orgId}/config/job_config`
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

    const pathReplacer = pageNum => {
        const search = `?${eventId ? `eventId=${eventId}&` : ''}${eventId ? `profileButton=${profileButton}&` : ''}${vendorId ? `vendorId=${vendorId}&` : ''}${next ? `next=${next}&` : ''}page=${pageNum}`
        history.replace({
            pathname: '',
            search,
        })
    }

    useEffect(() => pathReplacer(currentPage), [currentPage])

    useEffect(() => {
        if (eventId) {
            setCurrentPage(1)
            setSorterData('-job_id')
            setFilterData({})
            setCurrentPageSize(ITEMS_PER_PAGE)
            setActiveSorter({})
            setActiveFilters([])
        } else {
            setSorterData(storedSorter)
            setFilterData(storedFilters)
            setCurrentPageSize(storedPageSize)
            setActiveSorter(storedActiveSorter)
            setActiveFilters(storedActiveFilters)
            setCurrentPage(1)
            pathReplacer(currentPage)
        }
    }, [eventId])

    useEffect(() => {
        if(filterData['candidate_preferences__documents']){
            let items = filterData['candidate_preferences__documents'].split(',');
            items.forEach((item)=>filterData['candidate_preferences__documents__'+item] = true)
            delete filterData['candidate_preferences__documents']
        }
        if(filterData['candidate_preferences__assets']){
            let items = filterData['candidate_preferences__assets'].split(',');
            items.forEach((item)=>filterData['candidate__entity_data__doYouHave'+item] = true)
            delete filterData['candidate_preferences__assets']
        }
        let extraQueryParams = `${vendorId ? `vendor_work_location__vendor__id=${vendorId}` : ''}`;
        if(localStorage.getItem('filterData') && !activeFilters.length) return; //Avoid unecessary api call
        extraQueryParams += `${stat !== 'All' ? `status=${stat}` : ''}`;
        if (feature) {
            if (eventId) {
                extraQueryParams = `hiring_event=${eventId}`;
                getEventJobList(orgId, eventId, extraQueryParams, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
            }
            else getJobList(orgId, extraQueryParams, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
        }
    }, [
        feature,
        eventId,
        filterData,
        sorterData,
        renderPage,
        getJobList,
        currentPage,
        currentPageSize,
    ])

    useEffect(() => {
        if (jobList) {
            let stages = [];
            let filterParams='';
            Object.keys(filterData).map(item => {
                if (item === 'status') filterParams += `&${item}=${filterData[item]}`
                else if(item.includes('__gte')||item.includes('__lte')) { filterParams += `&${item}=${filterData[item]}`}
                else if(typeof filterData[item] === 'string' && filterData[item]?.split(',')?.length>1) {filterParams += `&${item}__icontains=${filterData[item]}`}
                else if(item === 'candidate_preferences__gender') filterParams += `&${item}__iexact=${filterData[item]}`
                else filterParams += `&${item}__icontains=${filterData[item]}`
                return null
            })
            let requests = tabs?.map((a) => axios.get(a == 'All' ? `${APP_URL}/${orgId}/jobs/?${filterParams}&page=1&page_count=0` : `${APP_URL}/${orgId}/jobs/?${filterParams}&status=${a}&page=${currentPage}&page_count=${currentPageSize}`));
            if (vendorId) {
                requests = tabs?.map((a) => axios.get(a == 'All' ? `${APP_URL}/${orgId}/jobs/?&vendor_work_location__vendor__id=${vendorId}${filterParams}&page=1&page_count=0` : `${APP_URL}/${orgId}/jobs/?&vendor_work_location__vendor__id=${vendorId}${filterParams}&status=${a}&page=1&page_count=0`));
            }
            if (eventId) {
                requests = tabs?.map((a) => axios.get(a == 'All' ? `${APP_URL}/${orgId}/jobs/hiringevent?&hiring_event=${eventId}${filterParams}&page=1&page_count=0` : `${APP_URL}/${orgId}/jobs/hiringevent?&hiring_event=${eventId}${filterParams}&status=${a}&page=1&page_count=0`));
            }

            Promise.allSettled(requests).then((responses) => {
                for (let i = 0; i < requests.length; i++) {
                    stages.push({ label: tabs[i], count: responses[i]?.value?.data?.pagination_data?.total_count })
                }
                setStages([...stages]);
            });
        }


    }, [jobList, vendorId, eventId,filterData])

    const fetchStateJobs = (state) => {
        setStat(state);
        let extraQueryParams = '';
        if (vendorId) {
            extraQueryParams = `${vendorId ? `vendor_work_location__vendor__id=${vendorId}` : ''}`;
            if (state !== 'All') extraQueryParams += `${state ? `&status=${state}` : ''}`;
            getJobList(orgId, extraQueryParams, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
        }
        else if (eventId) {
            extraQueryParams = `hiring_event=${eventId}`;
            if (state !== 'All') extraQueryParams += `${state ? `&status=${state}` : ''}`;
            getEventJobList(orgId, eventId, extraQueryParams, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
        }
        else {
            if (state !== 'All') extraQueryParams += `${state ? `&status=${state}` : ''}`;
            getJobList(orgId, extraQueryParams, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
        }
    }

    useEffect(() => {
        function getApps() {
            axios.get(`${APP_URL}/${orgId}/apps/?workflow_type=JOB`)
                .then(res => {
                    let apps = res.data?.data ?? [];
                    if (apps.length > 1 && !apps[0]?.bulk_support && !apps[1]?.bulk_support) {
                        setPrimaryApps(apps.splice(0, 2));
                        setAllApps(apps);
                    } else {
                        setPrimaryApps(apps.splice(0, 1));
                        setAllApps(apps);
                    }
                })
                .catch(err => {
                    addToaster('error', 'Error', err.response?.data?.message ?? 'Something went wrong')
                })
        }
        if (orgId) getApps();
    }, [orgId])
    useEffect(() => {
        function getApps() {
            axios.get(`${APP_URL}/${orgId}/apps/?workflow_type=JOB_CONTEXT`)
                .then(res => {
                    let apps = res.data?.data ?? [];
                    setJobContectApps(apps);
                })
                .catch(err => {
                    addToaster('error', 'Error', err.response?.data?.message ?? 'Something went wrong')
                })
        }
        if (orgId) getApps();
    }, [orgId])


    useEffect(() => {
        if (jobList.length === 0) setDisabled(true)
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
            initialSortData: '-job_id',
            firstColumnKey: columns[0].key,
            firstColumnCustomTitle: 'Job ID',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'jobs', data)
    }
    let filterColumns = [...columns, { title: 'Job Type', key: 'jobType', backendKey: 'jobType' },
    { title: 'Compulsory Document', key: 'documents', backendKey: 'candidate_preferences__documents' },
    { title: 'Assets Required', key: 'assets', backendKey: 'candidate_preferences__assets' },
    { title: 'Language', key: 'language', backendKey: 'candidate_preferences__language' },
    { title: 'Gender', key: 'gender', backendKey: 'candidate_preferences__gender' },
    { title: 'Vendor', key: 'vendor', backendKey: 'vendor_work_location__vendor__name' },
    { title: 'Teams', key: 'teams', backendKey: 'teams' },
    { title: 'Age Preference', key: 'age', backendKey: 'age' },
    { title: 'Min Salary', key: 'MinSalary', backendKey: 'MinSalary__gte' },
    { title: 'Max Salary', key: 'MaxSalary', backendKey: 'MaxSalary__lte' },
    { title: 'Min Exp', key: 'MinExp', backendKey: 'candidate_preferences__workExperience__gte' },
    { title: 'Max Exp', key: 'MaxExp', backendKey: 'candidate_preferences__workExperience__lte' },
    { title: 'Total Openings (more than)', key: 'openings', backendKey: 'extra_fields__total_positions__gte' },
    { title: 'Shift Start', key: 'shiftStart', backendKey: 'workStartTime' },
    { title: 'Shift End', key: 'shiftEnd', backendKey: 'workEndTime' },
    { title: 'Created at from', key: 'created_at_start', backendKey: 'created_at__gte' },
    { title: 'Created at to', key: 'created_at_end', backendKey: 'created_at__lte' },
    { title: 'Expiry Date start', key: 'target_date_to_finish_hiring_start', backendKey: 'target_date_to_finish_hiring__gte' },
    { title: 'Expiry Date end', key: 'target_date_to_finish_hiring_end', backendKey: 'target_date_to_finish_hiring__lte' }
    ];
    let mappedFields = {};
    filterColumns?.forEach(item => {
        if(item['key'] === 'status' ) return;
        mappedFields[item['key']] = { label: item['title'], options: item['filters'] }
    });

    useEffect(()=>{    
        const data = {
            columns: filterColumns,
            setFilterData,
            setSorterData,
            setCurrentPage,
            setDrawerFilters,
            setActiveSorter,
            setActiveFilters,
            setCurrentPageSize,
            initialSortData: '-job_id',
            firstColumnKey: columns[0].key,
            firstColumnCustomTitle: 'Job ID',
        }
        tableOnChangeHandler({
            total: totalCount,
            current: currentPage,
            pageSize: currentPageSize,
        }, filters, {}, 'jobs', data)
    },[filters]);

    const handleClearFilters = () => {
        setDrawerFilters({});
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    const toggleHandler = checked => {
        if (checked) setChartView(true)
        else setChartView(false)

        window.sendEvent("Hire_Actions_on_hiring_list_page",{
            Clicks_on_toggle:true,
            Clicks_on_Jobstatusestab:false
        })
    }

    const onStartWorkflow = (app, data = {}) => {
        data.target_date_to_finish_hiring = moment(data.target_date_to_finish_hiring).format('DD MMM YYYY');
        data.benefits = data?.extra_fields?.benefits;
        history.push({
            pathname: routes.START_NEW_PROCESS.to(orgId, app.id),
            state: {
                appName: app.name,
                data,
                returnBackTo: routes.JOB_LIST.to(orgId, currentPage),
                redirectTo: routes.JOB_LIST.to(orgId, currentPage),
            }
        })
    }

    const onStartBulkUpload = (app) => {
        setBulkProcess(app);
        setIsOpenImportModal(true);
    }

    let chartFilters = { ...dynamicChartFilters }
    if (eventId) chartFilters.event_id = eventId
    if (partnerName) chartFilters.sourcing_partner__name = [partnerName]
    return (
        <Fragment>
            {stateLoader && <Spinner />}
            <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
                <div className='process_details_tab_cont job-list'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>

                        <li className='process_tab_last_li job_tab_li  '>

                            <div className='process_details_btn_cont2'>
                                {!isVendorFlag && !vendorId && !eventId && <Switch
                                    disabled={disabled}
                                    checkedChildren='Chart'
                                    unCheckedChildren='List'
                                    onChange={toggleHandler}
                                />}

                            </div>
                            <div className='process_details_btn_cont'>
                                {/* {orgList.length ? (
                                    <Select
                                        style={{ minWidth: 160, textAlign: 'left' }}
                                        size="large"
                                        value={selectedOrg}
                                        onChange={setSelectedOrg}
                                    >
                                        {orgList.map((item) => (
                                            <Select.Option value={item.value}>{item.label}</Select.Option>
                                        ))}
                                    </Select>
                                ) : null} */}
                                {
                                    addPermission && !eventId && !isChartView ? (
                                        <Fragment>
                                            {primaryApps.map(app => (
                                                <>
                                                    {app?.bulk_support ? (
                                                        <button
                                                            type='button'
                                                            className='process_fancy_btn fancy_btn active'
                                                            onClick={() => onStartBulkUpload(app)}
                                                        >
                                                            {`${app.name} Bulk`}
                                                        </button>
                                                        // <DropDownButton
                                                        //     defaultButtonCondition
                                                        //     defaultButtonName='Create Bulk Hiring Requests'
                                                        //     handleClick={() => setIsOpenImportModal(true)}
                                                        // >
                                                        //     <li style={{ padding: '2px 0' }}>
                                                        //         <NavLink to={routes.JOB_HISTORY.to(orgId)}>
                                                        //             History
                                                        //         </NavLink>
                                                        //     </li>
                                                        // </DropDownButton>
                                                    ) : null}
                                                    {!isVendorFlag && <button
                                                        type='button'
                                                        className='process_fancy_btn fancy_btn active'
                                                        onClick={() => {
                                                            // window.sendEvent("Hire_Create_hiring_request")
                                                            window.sendEvent(`Hire_Click_${app.name}`)
                                                            onStartWorkflow(app)
                                                        }}
                                                    >
                                                        {app.name}
                                                    </button>}
                                                </>
                                            ))}
                                            {allApps?.length ? (
                                                <div className="menu_container">
                                                    <div className="menu_btn dropdown-toggle" data-toggle="dropdown" type="button">
                                                        <img src={menuIcon} alt="language" />
                                                    </div>
                                                    <div className="dropdown-menu">
                                                        {allApps.map((app) => (
                                                            <div key={app.id} className="start-new-process-item">
                                                                <div
                                                                    role="presentation"
                                                                    onClick={() => onStartWorkflow(app)}
                                                                    className="startNewProcessMenuItem"
                                                                >
                                                                    <div className="menuItemTextContainer">
                                                                        <p className="headerRow">{app.name}</p>
                                                                        <p className="descriptionRow">{app.description}</p>
                                                                    </div>
                                                                </div>
                                                                {app.bulk_support && !isMobile() && (
                                                                    <button
                                                                        type="button"
                                                                        className="bulk-init-button-container"
                                                                        onClick={() => onStartBulkUpload(app)}
                                                                    >
                                                                        <span className="icon-bulktasks bulk-init-icon" />
                                                                        <span className="bulk-init-text">Start Bulk</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}
                                            <Button
                                                variant='fancy_btn active ml-2'
                                                onClick={() => setShowSideFilter(true)}
                                            >
                                                Filter
                                            </Button>
                                        </Fragment>
                                    ) : null
                                }
                                {
                                    isChartView
                                        ? (
                                            <button
                                                type='button'
                                                className='process_fancy_btn fancy_btn active'
                                                disabled
                                                onClick={() => setShowFilter(true)}
                                            >
                                                Filter
                                            </button>
                                        ) : null
                                }
                            </div>
                        </li>
                    </ul>

                    <div className="lists_pages ">
                        {!isChartView ? (
                        <ul className="nav nav-tabs process_tab_ongoing_comp_ul document_details_tabs job_tab_ul" role="tablist">
                           {stages?.map((item)=>(
                            <li
                                role="presentation"
                                className={ stat == item.label ? "nav-item active left-border " : "nav-item left-border"}
                            >
                                <a
                                    className="nav-link"
                                    onClick={()=>{
                                       window.sendEvent("Hire_Actions_of_hiring_list_page",{
                                           Clicks_on_toggle:false,
                                           Clicks_on_Jobstatusestab:true
                                       })

                                        window.sendEvent("Hire_Hiring_status_change",{
                                            Hiring_status:item.label
                                        })
                                        fetchStateJobs(item.label)
                                    }}
                                >
                                        {item.label}({item.count})
                                    </a>
                                </li>
                            ))}
                        </ul> 
                        ) : null}
                    </div>
                    <DeleteModal
                        show={showWarning}
                        itemName={customJobId}
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
                                        && DefaultChartComponents.slice(0, -1)?.map((item, index) => (
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
                            ) : (jobList.length === 0 && isMobile() ? <Empty />

                                : (
                                    <AdvTable
                                        loading={loader}
                                        columns={columns}
                                        dataSource={jobList}
                                        pagination={{
                                            total: totalCount,
                                            current: currentPage,
                                            pageSize: currentPageSize,
                                        }}
                                        rowKey={record => record.id}
                                        onChange={handleTableChange}
                                        activeFilters={activeFilters}
                                        handleClearFilters={handleClearFilters}
                                        scroll={{x:'max-content'}}
                                    />
                                )
                            )
                    }
                    <BulkImport
                        history={history}
                        show={isOpenImportModal}
                        // title={BULK_JOBS_TITLE}
                        // url={routes.JOB_HISTORY.api(orgId)}
                        // redirectUrl={routes.JOB_HISTORY.to(orgId)}
                        title={`Bulk Initiate ${bulkProcess?.name} Process.`}
                        url={`${APP_URL}/${orgId}/apps/${bulkProcess?.id}/bulk_initiate`}
                        redirectUrl={routes.JOB_LIST.to(orgId, currentPage)}
                        handleShow={value => setIsOpenImportModal(value)}
                    />
                    <DrawerFilter showFilter={showSideFilter}
                        onCloseHandler={() => setShowSideFilter(false)}
                        filters={drawerFilters}
                        mappedFields={mappedFields}
                        type={'hiring-list'}
                        setFilters={setDrawerFilters}
                        applyFilter={(filterData)=>setFilters(filterData)}
                    />
                </div>
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ job, auth }) => ({
    jobList: job.jobs,
    loader: job.loader,
    totalCount: job.total,
    renderPage: job.renderPage,
    storedPageSize: job.size,
    storedFilters: job.filters,
    storedSorter: job.sorter,
    storedActiveSorter: job.activeSorter,
    storedActiveFilters: job.activeFilters,
    storedPageSize2: job.size2,
    storedFilters2: job.filters2,
    storedSorter2: job.sorter2,
    storedActiveSorter2: job.activeSorter2,
    storedActiveFilters2: job.activeFilters2,

    partnerName: auth.partner?.name,
    feature: auth.uiFeatures.job.view,
    addPermission: auth.uiPermissions.job.add,
    editPermission: auth.uiPermissions.job.change,
    deletePermission: auth.uiPermissions.job.delete,
    viewPermission: auth.uiPermissions.jobcandidate.view,
    authUserRole: auth.groupName,
})

const mapDispatchToProps = {
    getJobList: getJobs,
    addToaster: addToast,
    deleteSingleJob: deleteJob,
    getEventJobList: getEventJobs,
}

export default connect(mapStateToProps, mapDispatchToProps)(JobList)
