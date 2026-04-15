/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment,
    useState,
    useEffect
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import moment from 'moment'

import routes from 'urls'
import { parseQueryString, Item } from 'containers/utils'
import BulkImport from 'components/UI/DocumentUpload/BulkImport'
import DropDownButton from 'components/UI/AppButton/DropDownButton'
import FilterDropdown from 'components/UI/FilterDropdown/FilterDropdown'
import {
    AdvTable,
    clearFiltersHandler,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'

import {
    getHeadCountPlans,
} from 'store/actions/index'

import {
    BULK_JOBS_TITLE,
} from '../utils'

import './HeadCount.css'

const Requisition = props => {

    const {
        loader,
        feature,
        history,
        totalCount,
        addPermission,
        storedPageSize,
        headCountPlanList,
        storedActiveSorter,
        storedActiveFilters,
        getHeadCountPlanList,
        storedSorter,
        storedFilters,
    } = props

    const locationInfo = useLocation()
    const { page = 1, next = 1 } = parseQueryString(locationInfo.search)
    const { uuid: orgId } = useParams();

    const [filterData, setFilterData] = useState(storedFilters)
    const [activeFilters, setActiveFilters] = useState(storedActiveFilters)
    const [sorterData, setSorterData] = useState(storedSorter)
    const [activeSorter, setActiveSorter] = useState(storedActiveSorter)
    const [currentPage, setCurrentPage] = useState(Number(page) || 1)
    const [currentPageSize, setCurrentPageSize] = useState(storedPageSize)
    const [selectedKeys, setSelectedKeys] = useState([])
    const [isOpenImportModal, setIsOpenImportModal] = useState(false)

    const month = moment().format('MMMM')
    const year = moment().format('YYYY')
    const month2 = moment().add(1, 'month').format('MMMM')
    const year2 = moment().add(1, 'month').format('YYYY')

    const monthYearDropdown = [{
        id: `${month} ${year}`,
        name: `${month} ${year}`,
        year: year,
        month: month,
    }, {
        id: `${month2} ${year2}`,
        name: `${month2} ${year2}`,
        year: year2,
        month: month2,
    }]

    const [selectedMonth, setSelectedMonth] = useState(monthYearDropdown[0])

    const rowSelection = {
        selectedRowKeys: [...selectedKeys],
        onChange: selectedRowKeys => setSelectedKeys([...selectedRowKeys]),
        getCheckboxProps: record => ({
            disabled: record[year] ? !record[year][month]?.gap : true,
        }),
    }

    const columns = [
        {
            title: () => (
                <div className='adv-table-total-items-parent'>
                    Role
                    <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
                </div>
            ),
            dataIndex: 'role_name',
            key: 'role',
            backendKey: 'role__name',
            sorter: true,
            ellipsis: true,
            editable: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'role__name' ? ['descend'] : ['ascend', 'descend'],
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='headcount-role' /> : ''),
            sortOrder: activeSorter.columnKey === 'role' ? activeSorter.order : false,
        },
        {
            title: 'Location',
            dataIndex: 'location_name',
            key: 'location',
            backendKey: 'location__name',
            sorter: true,
            ellipsis: true,
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='headcount-location' /> : ''),
            sortOrder: activeSorter.columnKey === 'location' ? activeSorter.order : false,
        },
        {
            title: `${selectedMonth.month} ${selectedMonth.year} Gap Count`,
            dataIndex: `${selectedMonth.year}`,
            key: `${selectedMonth.year}-${selectedMonth.month}`,
            inputType: 'number',
            render: (text, record) => (text ? <Item type='text' data={record[selectedMonth.year] ? record[selectedMonth.year][selectedMonth.month] ? record[selectedMonth.year][selectedMonth.month].gap : '-' : '-'} id={record.id} name={`headcount-${selectedMonth.year}-${selectedMonth.month}-gap`} /> : '-'),
        }
    ]

    useEffect(() => {
        setCurrentPage(Number(page) || 1)
    }, [page])

    useEffect(() => {
        const search = `?${next ? `next=${next}&` : ''}page=${currentPage}`
        history.replace({
            pathname: '',
            search,
        })
    }, [currentPage])

    useEffect(() => {
        if (feature) getHeadCountPlanList(orgId, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
    }, [
        orgId,
        feature,
        filterData,
        sorterData,
        currentPage,
        currentPageSize,
        getHeadCountPlanList,
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
            initialSortData: 'role__name',
            firstColumnKey: columns[0].key,
            firstColumnCustomTitle: 'Role',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'requisition', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    const handleMonthYearChange = value => {
        setSelectedMonth(monthYearDropdown.filter(item => item.id === value)[0])
        setCurrentPage(1)
    }

    const selectedRecords = selectedKeys.map(key => headCountPlanList.filter(item => item.id === key)).flat()
    let search = ''
    if (selectedRecords.length > 0) {
        search += `?role=${selectedRecords[0].role_name}`
        search += `&workLocation=${selectedRecords[0].location_name}`
        search += `&gap=${selectedRecords[0][selectedMonth.year][selectedMonth.month]?.gap || 0}`
        search += `&formOpenSource=head_count_gap`
    }

    return (
        <Fragment>
            <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
                <div className='process_details_tab_cont headcount-requisition'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
                        <li className='process_tab_last_li'>
                            <div className='process_details_btn_cont'>
                                {
                                    addPermission ? (
                                        <Fragment>
                                            <FilterDropdown
                                                show
                                                list={monthYearDropdown}
                                                selectedItem={selectedMonth.name}
                                                classes='month-year-filter-dropdown'
                                                onItemClickHandler={handleMonthYearChange}
                                            />
                                            <DropDownButton
                                                defaultButtonCondition
                                                defaultButtonName='Create Bulk Jobs'
                                                handleClick={() => setIsOpenImportModal(true)}
                                            >
                                                <li style={{ padding: '2px 0' }}>
                                                    <NavLink to={routes.JOB_HISTORY.to(orgId)}>
                                                        History
                                                    </NavLink>
                                                </li>
                                            </DropDownButton>
                                            <button
                                                type='button'
                                                className='process_fancy_btn fancy_btn active'
                                                disabled={selectedKeys.length === 0 || selectedKeys.length > 1}
                                                onClick={() => history.push({
                                                    pathname: routes.START_NEW_PROCESS.to(orgId, routes.JOB_HISTORY.app_key),
                                                    search: search,
                                                    state: {
                                                        returnBackTo: routes.REQUISITION.to(orgId),
                                                        redirectTo: `/custom-workflow/org/${orgId}/process?process_key=${routes.JOB_HISTORY.app_key}&processType=Ongoing process&page=1&size=5`,
                                                    }
                                                })}
                                            >
                                                Create Job
                                            </button>
                                        </Fragment>
                                    ) : null
                                }
                            </div>
                        </li>
                    </ul>
                    <AdvTable
                        loading={loader}
                        columns={columns}
                        rowSelection={rowSelection}
                        dataSource={headCountPlanList}
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
                    <BulkImport
                        history={history}
                        title={BULK_JOBS_TITLE}
                        show={isOpenImportModal}
                        url={routes.JOB_HISTORY.api}
                        redirectUrl={routes.JOB_HISTORY.to(orgId)}
                        handleShow={value => setIsOpenImportModal(value)}
                    />
                </div>
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ headcountplan, auth }) => ({
    headCountPlanList: headcountplan.headcounts,
    loader: headcountplan.loader,
    totalCount: headcountplan.total,
    storedPageSize: headcountplan.size,
    storedFilters: headcountplan.filters,
    storedSorter: headcountplan.sorter,
    storedActiveSorter: headcountplan.activeSorter,
    storedActiveFilters: headcountplan.activeFilters,

    feature: auth.uiFeatures.headcountplan.view,
    addPermission: auth.uiPermissions.job.add,
})

const mapDispatchToProps = {
    getHeadCountPlanList: getHeadCountPlans,
}

export default connect(mapStateToProps, mapDispatchToProps)(Requisition)
