/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment,
    useState,
    useEffect
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import {
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons'
import moment from 'moment'

import routes from 'urls'
import { DATETIME_FORMAT } from 'Data/constants'
import Empty from 'components/Empty'
import { parseQueryString, Item, isMobile } from 'containers/utils'
import Warning from 'components/WarningModal'

import {
    AdvTable,
    clearFiltersHandler,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'

import { editSupply, deleteSupply, getSupply } from 'store/actions/index'

import './Supplies.css'

const SuppliesList = props => {

    const {
        loader,
        feature,
        history,
        supplies,
        authUser,
        totalCount,
        renderPage,
        getSupplies,
        storedSorter,
        storedFilters,
        approveSupply,
        deleteASupply,
        addPermission,
        editPermission,
        storedPageSize,
        deletePermission,
        storedActiveSorter,
        storedActiveFilters,
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
    const [isReject, setIsReject] = useState(false)
    const [supplyId, setSupplyId] = useState('')

    const showWarningModal = (id, isRejection) => {
        setShowWarning(true)
        setSupplyId(id)
        setIsReject(isRejection)
    }

    const handleDelete = () => {
        deleteASupply(supplyId, totalCount, currentPageSize, currentPage, renderPage)
        setShowWarning(false)
    }

    const columns = [
        {
            title: () => (
                <div className='adv-table-total-items-parent'>
                    Asset Name
                    <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
                </div>
            ),
            width: 195,
            dataIndex: 'asset_name',
            key: 'assetName',
            backendKey: 'asset__name',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'asset__name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'asset__name', 'asset'),
            render: (text, record) => {
                return editPermission && !record.checked && authUser === record.created_by
                    ? <Item type='navlink' data={text} path={routes.SUPPLY_EDIT.to(orgId, record.id, page)} id={record.id} name='supply-name-navlink' />
                    : <Item type='text' data={text} id={record.id} name='supply-name' />
            },
            sortOrder: activeSorter.columnKey === 'assetName' ? activeSorter.order : false,
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            backendKey: 'quantity',
            sorter: true,
            ellipsis: true,
            render: (quantity, record) => quantity ? <Item type='text' data={quantity} id={record.id} name='supply-quantity' /> : '',
            ...getColumnSearchProps(filterData, 'quantity', 'quantity', 'number'),
            sortOrder: activeSorter.columnKey === 'quantity' ? activeSorter.order : false,
        },
        {
            title: 'Location',
            dataIndex: 'location_detailed',
            key: 'location',
            backendKey: 'location__name',
            sorter: true,
            ellipsis: true,
            render: (location_detailed, record) => location_detailed ? <Item type='text' data={location_detailed.name} id={record.id} name='supply-location-name' /> : '',
            ...getColumnSearchProps(filterData, 'location__name', 'location'),
            sortOrder: activeSorter.columnKey === 'location' ? activeSorter.order : false,
        },
        {
            title: 'Supplier',
            dataIndex: 'supplier_name',
            key: 'supplier',
            backendKey: 'supplier__name',
            sorter: true,
            ellipsis: true,
            render: (supplier_name, record) => supplier_name ? <Item type='text' data={supplier_name} id={record.id} name='supply-supplier-name' /> : '',
            ...getColumnSearchProps(filterData, 'supplier__name', 'supplier'),
            sortOrder: activeSorter.columnKey === 'supplier' ? activeSorter.order : false,
        },
        {
            title: 'Ordered',
            dataIndex: 'ordered_at',
            key: 'ordered',
            ellipsis: true,
            render: (ordered_at, record) => ordered_at ? <Item type='text' data={moment(ordered_at).local().format(DATETIME_FORMAT)} id={record.id} name='stock-adjust-ordered-at' /> : '',
        },
        {
            title: 'Arrived',
            dataIndex: 'arrived_at',
            key: 'arrived',
            ellipsis: true,
            render: (arrived_at, record) => arrived_at ? <Item type='text' data={moment(arrived_at).local().format(DATETIME_FORMAT)} id={record.id} name='stock-adjust-arrived-at' /> : '',
        },
        {
            title: 'Checker',
            dataIndex: 'checker_name',
            key: 'checkerName',
            backendKey: 'org_check__checker__first_name',
            sorter: true,
            ellipsis: true,
            render: (checker_name, record) => checker_name ? <Item type='text' data={checker_name} id={record.id} name='supply-checker-name' /> : '',
            ...getColumnSearchProps(filterData, 'org_check__checker__first_name', 'checker name'),
            sortOrder: activeSorter.columnKey === 'checkerName' ? activeSorter.order : false,
        },
        {
            title: 'Checker Email',
            dataIndex: 'checker_email',
            key: 'checkerEmail',
            backendKey: 'org_check__checker__email',
            sorter: true,
            ellipsis: true,
            render: (checker_email, record) => checker_email ? <Item type='text' data={checker_email} id={record.id} name='supply-checker-email' /> : '',
            ...getColumnSearchProps(filterData, 'org_check__checker__email', 'checker email'),
            sortOrder: activeSorter.columnKey === 'checkerEmail' ? activeSorter.order : false,
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            width: '7%',
            align: 'center',
            render: (text, record) => {
                let content = null
                if (!record.checked) {
                    if (deletePermission && authUser === record.created_by) content = (
                        <Item
                            type='icon'
                            data='Delete'
                            id={record.id}
                            name='supply-delete-icon'
                        >
                            <DeleteOutlined
                                data-tip
                                data-for={`supply-delete-icon-${record.id}`}
                                onClick={() => showWarningModal(record.id, false)}
                            />
                        </Item>
                    )
                    if (editPermission && authUser === record.checker_email) content = (
                        <Fragment>
                            <Item
                                type='icon'
                                data='Approve'
                                id={record.id}
                                name='supply-approve-icon'
                            >
                                <CheckCircleOutlined
                                    data-tip
                                    data-for={`supply-approve-icon-${record.id}`}
                                    onClick={() => approveSupply(orgId, record.org_check, { checked: true }, null, null, renderPage)}
                                />
                            </Item>
                            &nbsp;&nbsp;
                            <Item
                                type='icon'
                                data='Reject'
                                id={record.id}
                                name='supply-reject-icon'
                            >
                                <CloseCircleOutlined
                                    data-tip
                                    data-for={`supply-reject-icon-${record.id}`}
                                    onClick={() => showWarningModal(record.id, true)}
                                />
                            </Item>
                        </Fragment>
                    )
                }
                return content
            }
        },
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
        if (feature) getSupplies(currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
    }, [
        feature,
        filterData,
        sorterData,
        renderPage,
        getSupplies,
        currentPage,
        currentPageSize,
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
            initialSortData: 'asset__name',
            firstColumnKey: columns[0].key,
            firstColumnCustomTitle: 'Asset Name',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'supplies', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    return (
        <Fragment>
            <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
                <div className='process_details_tab_cont config_location_view'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
                        <li className='process_tab_last_li'>
                            <div className='process_details_btn_cont'>
                                {
                                    addPermission ? (
                                        <div>
                                            <NavLink to={`/inventory/supply/create?next=${page}`}>
                                                <button
                                                    type='button'
                                                    className='process_fancy_btn fancy_btn active'
                                                >
                                                    Add Supply
                                                </button>
                                            </NavLink>
                                        </div>
                                    ) : null
                                }
                            </div>
                        </li>
                    </ul>
                    <Warning
                        show={showWarning}
                        message={`Are you sure you want to ${isReject ? 'reject' : 'delete'} this supply ?`}
                        primaryBtn={{
                            text: `${isReject ? 'Reject' : 'Delete'}`,
                            onClick: handleDelete
                        }}
                        secondaryBtn={{
                            text: 'Cancel',
                            onClick: () => setShowWarning(false)
                        }}
                    />
                    {supplies.length === 0 && isMobile() ? <Empty/>
                    : (
<AdvTable
                        loading={loader}
                        columns={columns}
                        dataSource={supplies}
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
                </div>
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ supply, auth }) => ({
    loader: supply.loader,
    supplies: supply.data,
    totalCount: supply.total,
    renderPage: supply.renderPage,
    storedPageSize: supply.size,
    storedFilters: supply.filters,
    storedSorter: supply.sorter,
    storedActiveSorter: supply.activeSorter,
    storedActiveFilters: supply.activeFilters,

    authUser: auth.username,
    feature: auth.uiFeatures.organisationsupply.view,
    addPermission: auth.uiPermissions.organisationsupply.add,
    editPermission: auth.uiPermissions.organisationsupply.change,
    deletePermission: auth.uiPermissions.organisationsupply.delete,
})

const mapDispatchToProps = {
    getSupplies: getSupply,
    approveSupply: editSupply,
    deleteASupply: deleteSupply,
}

export default connect(mapStateToProps, mapDispatchToProps)(SuppliesList)
