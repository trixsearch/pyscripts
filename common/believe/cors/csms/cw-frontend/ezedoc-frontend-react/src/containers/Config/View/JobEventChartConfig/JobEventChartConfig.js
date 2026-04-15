/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useState,
    useEffect
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { DeleteOutlined } from '@ant-design/icons'
import moment from 'moment'

import routes from 'urls'
import { PROCESS_DATETIME_FORMAT, CONFIG_VIEW_JOB, ITEMS_PER_PAGE } from 'Data/constants'
import { parseQueryString, Item } from 'containers/utils'
import DeleteModal from 'components/UI/DeleteModel/DeleteModal'
import {
    AdvTable,
    clearFiltersHandler,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'

import {
    deleteJobEventChartConfig,
    getJobEventChartConfigList,
} from 'store/actions/index'

const JobEventChartConfig = props => {
    const {
        loader,
        history,
        pageType,
        setLoader,
        totalCount,
        renderPage,
        deleteConfig,
        storedSorter,
        getConfigList,
        jobConfigList,
        storedSorter2,
        storedFilters,
        storedFilters2,
        storedPageSize,
        storedPageSize2,
        eventConfigList,
        storedActiveSorter,
        storedActiveSorter2,
        storedActiveFilters,
        storedActiveFilters2,
    } = props

    const locationInfo = useLocation()
    const { page = 1 } = parseQueryString(locationInfo.search)
    const { uuid: orgId } = useParams();

    const [filterData, setFilterData] = useState({})
    const [activeFilters, setActiveFilters] = useState([])
    const [sorterData, setSorterData] = useState('name')
    const [activeSorter, setActiveSorter] = useState({})
    const [currentPage, setCurrentPage] = useState(Number(page) || 1)
    const [currentPageSize, setCurrentPageSize] = useState(ITEMS_PER_PAGE)
    const [showWarning, setShowWarning] = useState(false)
    const [jobEventConfigId, setJobEventConfigId] = useState('')
    const [jobConfigName, setJobConfigName] = useState('')

    const showWarningModal = (id, name) => {
        setShowWarning(true)
        setJobEventConfigId(id)
        setJobConfigName(name)
    }

    const handleDelete = () => {
        deleteConfig(orgId, pageType, jobEventConfigId, totalCount, currentPageSize, currentPage, renderPage)
        setShowWarning(false)
    }

    const columns = [
        {
            title: () => (
                <div className='adv-table-total-items-parent'>
                    Name
                    <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            backendKey: 'name',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'name', 'name'),
            render: (text, record) => (
                <Item
                    data={text}
                    type='navlink'
                    id={record.id}
                    name='job-config-name-navlink'
                    path={pageType === CONFIG_VIEW_JOB ? routes.EDIT_JOB_CHART_CONFIG.to(orgId, pageType, record.id, currentPage) : routes.EDIT_EVENT_CHART_CONFIG.to(orgId, pageType, record.id, currentPage)}
                />
            ),
            sortOrder: activeSorter.columnKey === 'name' ? activeSorter.order : false,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            backendKey: 'description',
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='job-config-description' /> : ''),
        },
        {
            title: 'Role',
            dataIndex: 'role_name',
            key: 'role',
            backendKey: 'role__name',
            sorter: true,
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='job-config-role' /> : ''),
            ...getColumnSearchProps(filterData, 'role__name', 'role name'),
            sortOrder: activeSorter.columnKey === 'role' ? activeSorter.order : false,
        },
        {
            title: 'Last Updated On',
            dataIndex: 'updated_at',
            key: 'updatedAt',
            backendKey: 'updated_at',
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={moment(text).format(PROCESS_DATETIME_FORMAT)} id={record.id} name='job-config-updated-on' /> : ''),
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            width: '7%',
            align: 'center',
            render: (text, record) => (
                <Item
                    type='icon'
                    data='Delete'
                    id={record.id}
                    name='job-config-delete-icon'
                >
                    <DeleteOutlined
                        data-tip
                        data-for={`job-config-delete-icon-${record.id}`}
                        onClick={() => showWarningModal(record.id, record.name)}
                    />
                </Item>
            )
        },
    ]

    useEffect(() => {
        setLoader(false)
    }, [])

    useEffect(() => {
        if (pageType === CONFIG_VIEW_JOB) {
            setFilterData(storedFilters)
            setActiveFilters(storedActiveFilters)
            setSorterData(storedSorter)
            setActiveSorter(storedActiveSorter)
            setCurrentPage(1)
            setCurrentPageSize(storedPageSize)
        } else {
            setFilterData(storedFilters2)
            setActiveFilters(storedActiveFilters2)
            setSorterData(storedSorter2)
            setActiveSorter(storedActiveSorter2)
            setCurrentPage(1)
            setCurrentPageSize(storedPageSize2)
        }
    }, [pageType])

    useEffect(() => {
        setCurrentPage(Number(page) || 1)
    }, [page])

    useEffect(() => {
        history.replace({
            pathname: '',
            search: `?view=${pageType.toLowerCase()}&page=${currentPage}`
        })
    }, [currentPage])

    useEffect(() => {
        getConfigList(orgId, pageType, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
    }, [
        orgId,
        pageType,
        filterData,
        sorterData,
        renderPage,
        currentPage,
        currentPageSize,
        getConfigList,
    ])

    const handleTableChange = (pagination, filters, sorter) => {
        const data = {
            columns,
            setFilterData,
            setSorterData,
            setCurrentPage,
            setActiveSorter,
            setActiveFilters,
            setCurrentPageSize,
            initialSortData: 'name',
            firstColumnKey: columns[0].key,
            firstColumnCustomTitle: 'Name',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'jobEventConfig', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    return (
        <div className='job-chart-config-view'>
            <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist' style={{ marginBottom: 0 }}>
                <li className='process_tab_last_li'>
                    <div className='process_details_btn_cont' style={{ bottom: 12, right: -9 }}>
                        <NavLink to={pageType === CONFIG_VIEW_JOB ? routes.ADD_JOB_CHART_CONFIG.to(orgId, pageType, page) : routes.ADD_EVENT_CHART_CONFIG.to(orgId, pageType, page)}>
                            <button
                                type='button'
                                className='fancy_btn active'
                            >
                                {pageType === CONFIG_VIEW_JOB ? 'Add Job Chart Config' : 'Add Event Chart Config'}
                            </button>
                        </NavLink>
                    </div>
                </li>
            </ul>
            <DeleteModal
                show={showWarning}
                itemName={jobConfigName}
                handleDelete={handleDelete}
                hideWarning={() => setShowWarning(false)}
            />
            <AdvTable
                loading={loader}
                columns={columns}
                dataSource={pageType === CONFIG_VIEW_JOB ? jobConfigList : eventConfigList}
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
        </div>
    )
}

// TODO: change params
const mapStateToProps = ({ view }) => ({
    loader: view.loader,
    totalCount: view.total2,
    renderPage: view.renderPage2,
    jobConfigList: view.jobConfigList,
    storedPageSize: view.size,
    storedFilters: view.filters,
    storedSorter: view.sorter,
    storedActiveSorter: view.activeSorter,
    storedActiveFilters: view.activeFilters,
    eventConfigList: view.eventConfigList,
    storedPageSize2: view.size2,
    storedFilters2: view.filters2,
    storedSorter2: view.sorter2,
    storedActiveSorter2: view.activeSorter2,
    storedActiveFilters2: view.activeFilters2,
})

const mapDispatchToProps = {
    getConfigList: getJobEventChartConfigList,
    deleteConfig: deleteJobEventChartConfig,
}

export default connect(mapStateToProps, mapDispatchToProps)(JobEventChartConfig)
