/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import routes from 'urls'

import Empty from 'components/Empty'
import { parseQueryString, Item, isMobile } from "containers/utils";
import {
    AdvTable,
    clearFiltersHandler,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'
import { DeleteOutlined } from '@ant-design/icons'
import {
    getSupplier,
    deleteSupplier,
} from '../../../../store/actions/index';
import Spinner from '../../../../components/UI/Spinner/Spinner'

import DeleteModel from '../../../../components/UI/DeleteModel/DeleteModal'

import './SuppliersList.css'

const SuppliersList = props => {
    const [supplierId, setSupplierId] = useState('')
    const [supplierName, setSupplierName] = useState('')
    const [showWarning, setShowWarning] = useState(false)

    const {
        history,
        totalCount,
        loader,
        feature,
        suppliers,
        renderPage,
        addPermission,
        getSupplier: getSuppliers,
        editPermission,
        deletePermission,
        storedSorter,
        storedFilters,
        storedPageSize,
        storedActiveFilters,
        storedActiveSorter
    } = props

    const location = useLocation()
    const { page = 1 } = parseQueryString(location.search)
    const { uuid: orgId } = useParams();

    const [filterData, setFilterData] = useState(storedFilters)
    const [activeFilters, setActiveFilters] = useState(storedActiveFilters)
    const [sorterData, setSorterData] = useState(storedSorter)
    const [activeSorter, setActiveSorter] = useState(storedActiveSorter)
    const [currentPage, setCurrentPage] = useState(Number(page) || 1)
    const [currentPageSize, setCurrentPageSize] = useState(storedPageSize)

    const showWarningModal = (id, name) => {
        setShowWarning(true)
        setSupplierId(id)
        setSupplierName(name)
    }

    const handleDelete = () => {
        props.deleteSupplier(supplierId, totalCount, currentPageSize, currentPage, renderPage)
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
            key: 'supplierName',
            backendKey: 'name',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'name', 'name'),
            render: (text, record) => {
                return editPermission
                    ? <Item type='navlink' data={text} path={routes.SUPPLIER_EDIT.to(orgId, record.id, page)} id={record.id} name='supplier-name-navlink' />
                    : <Item type='text' data={text} id={record.id} name='supplier-name' />
            },
            sortOrder: activeSorter.columnKey === 'supplierName' ? activeSorter.order : false,
        },
        {
            title: 'Supplier Address',
            dataIndex: 'address',
            key: 'supplierAddress',
            backendKey: 'address',
            ellipsis: true,
            sorter: true,
            render: (address, record) => address ? <Item type='text' data={address} id={record.id} name='supplier-address' /> : '',
            ...getColumnSearchProps(filterData, 'address', 'address'),
            sortOrder: activeSorter.columnKey === 'supplierAddress' ? activeSorter.order : false,
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            align: 'center',
            width: '7%',
            render: (text, record) => {
                let content = null
                if (deletePermission) content = (
                    <Item
                        type='icon'
                        data='Delete'
                        id={record.id}
                        name='supplier-delete-icon'
                    >
                        <DeleteOutlined
                            data-tip
                            data-for={`supplier-delete-icon-${record.id}`}
                            onClick={() => showWarningModal(record.id, record.name)}
                        />
                    </Item>
                )
                return content
            }
        }
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
        if (feature) getSuppliers(currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
    }, [
        feature,
        filterData,
        sorterData,
        renderPage,
        getSuppliers,
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
            initialSortData: 'name',
            firstColumnKey: columns[0].key,
            firstColumnCustomTitle: 'Name',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'suppliers', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    return (
        <div>
            {loader && (<Spinner />)}
            <div className='main_changable_container' style={{ 'height': window.innerHeight - 59 }}>
                <div className='process_details_tab_cont config_location_view'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
                        <li className='process_tab_last_li'>
                            <div className='process_details_btn_cont'>
                                {addPermission ? (
                                    <div>
                                        <NavLink to={routes.SUPPLIER_CREATE.to(orgId, page)}>
                                            <button type='button' className='process_fancy_btn fancy_btn active'>
                                                <span>Add Supplier</span>
                                            </button>
                                        </NavLink>
                                    </div>
                                ) : <div />
                                }
                            </div>
                        </li>
                    </ul>
                    <DeleteModel
                        show={showWarning}
                        itemName={supplierName}
                        handleDelete={handleDelete}
                        hideWarning={() => setShowWarning(false)}
                    />
                    {suppliers.length === 0 && isMobile() ? <Empty/>
                    : (
<AdvTable
                        loading={loader}
                        columns={columns}
                        dataSource={suppliers}
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
        </div>
    )
}

const mapStateToProps = ({ supplier, auth }) => ({
    totalCount: supplier.total,
    loader: supplier.loader,
    suppliers: supplier.data,
    renderPage: supplier.renderPage,
    feature: auth.uiFeatures.organisationsupplier.view,
    addPermission: auth.uiPermissions.organisationsupplier.add,
    editPermission: auth.uiPermissions.organisationsupplier.change,
    deletePermission: auth.uiPermissions.organisationsupplier.delete,
    storedPageSize: supplier.size,
    storedFilters: supplier.filters,

    storedSorter: supplier.sorter,
    storedActiveSorter: supplier.activeSorter,
    storedActiveFilters: supplier.activeFilters,
})

const mapDispatchToProps = {
    getSupplier,
    deleteSupplier,
}

export default connect(mapStateToProps, mapDispatchToProps)(SuppliersList)
