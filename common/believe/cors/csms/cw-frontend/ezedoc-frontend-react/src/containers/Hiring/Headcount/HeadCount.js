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

import {
    AdvTable,
    clearFiltersHandler,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'

import {
    getHeadCountPlans,
    setHeadCountRoleLocationData,
} from 'store/actions/index'

import './HeadCount.css'

const HeadCountPlan = props => {

    const {
        loader,
        feature,
        history,
        totalCount,
        storedSorter,
        storedFilters,
        storedPageSize,
        planPermission,
        setSelectedList,
        headCountPlanList,
        storedActiveSorter,
        storedActiveFilters,
        getHeadCountPlanList,
        addJobPermission,
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
    const [selectedKeys, setSelectedKeys] = useState([])

    const mArr = new Array(12).fill(0)
    let mReducer = 0
    const subMenu = [
        'Planned',
        'Achieved',
        'Gap',
    ]
    const subMenuKeys = [
        'plan_count',
        'achieve',
        'gap',
    ]

    const dynamicColumns = mArr
        && Array.isArray(mArr)
        && mArr.map(() => {
            const month = moment().subtract(mReducer, 'month').format('MMMM')
            const year = moment().subtract(mReducer, 'month').format('YYYY')
            mReducer += 1
            return {
                title: `${month} ${year}`,
                children: subMenu.map((subItem, index) => ({
                    title: subItem,
                    dataIndex: year,
                    key: `${year}-${month}-${subItem}`,
                    width: 85,
                    ellipsis: true,
                    render: (text, record) => (text ? <Item type='text' data={record[year] ? record[year][month] ? record[year][month][subMenuKeys[index]] : '-' : '-'} id={record.id} name={`headcount-${year}-${month}-${subItem}`} /> : '-'),
                }))
            }
        })

    const rowSelection = {
        selectedRowKeys: [...selectedKeys],
        onChange: selectedRowKeys => setSelectedKeys([...selectedRowKeys]),
        getCheckboxProps: () => ({
            disabled: !planPermission,
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
            width: 150,
            sorter: true,
            ellipsis: true,
            fixed: 'left',
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'role__name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'role__name', 'role'),
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='headcount-role' placement='left' /> : ''),
            sortOrder: activeSorter.columnKey === 'role' ? activeSorter.order : false,
        },
        {
            title: 'Location',
            dataIndex: 'location_name',
            key: 'location',
            backendKey: 'location__name',
            width: 150,
            sorter: true,
            ellipsis: true,
            fixed: 'left',
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='headcount-location' placement='right' /> : ''),
            ...getColumnSearchProps(filterData, 'location__name', 'location'),
            sortOrder: activeSorter.columnKey === 'location' ? activeSorter.order : false,
        },
        ...dynamicColumns,
    ]

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
        tableOnChangeHandler(pagination, filters, sorter, 'headcountplans', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    const handleNavigate = () => {
        setSelectedList(selectedKeys)
        history.push(routes.HEAD_COUNT_PLAN.to(orgId, currentPage))
    }

    return (
        <Fragment>
            <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
                <div className='process_details_tab_cont headcount-plan-list'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
                        <li className='process_tab_last_li'>
                            <div className='process_details_btn_cont'>
                                {
                                    planPermission && selectedKeys.length ? (
                                        <button
                                            type='button'
                                            onClick={() => handleNavigate()}
                                            className='process_fancy_btn fancy_btn active'
                                        >
                                            Headcount Plan
                                        </button>
                                    ) : null
                                }
                                {
                                    addJobPermission ? (
                                        <NavLink to={routes.REQUISITION.to(orgId, currentPage)}>
                                            <button
                                                type='button'
                                                className='process_fancy_btn fancy_btn active'
                                            >
                                                Show Headcount Gaps
                                            </button>
                                        </NavLink>
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
    planPermission: auth.uiPermissions.headcountplan.add && auth.uiPermissions.headcountplan.change,
    addJobPermission: auth.uiPermissions.job.add
})

const mapDispatchToProps = {
    getHeadCountPlanList: getHeadCountPlans,
    setSelectedList: setHeadCountRoleLocationData,
}

export default connect(mapStateToProps, mapDispatchToProps)(HeadCountPlan)
