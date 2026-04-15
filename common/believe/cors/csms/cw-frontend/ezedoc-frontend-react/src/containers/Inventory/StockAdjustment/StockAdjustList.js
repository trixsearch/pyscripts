/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { connect } from 'react-redux'
import moment from 'moment'

// import routes from 'urls'

import {
    getStockAdjustList,
} from 'store/actions/index'
import { DATETIME_FORMAT } from 'Data/constants'
import { parseQueryString, Item } from 'containers/utils'
import Spinner from 'components/UI/Spinner/Spinner'
import { addToast } from 'components/Toast/actions'
import {
    AdvTable,
    clearFiltersHandler,
    getFilteredValueProp,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'

import './StockAdjustList.css'

const StockAdjustList = props => {
    const {
        history,
        getStockAdjustList:getStockAdjustData,
        feature,
        loader,
        totalCount,
        stockAdjustData,
        storedSorter,
        storedFilters,
        storedPageSize,
        storedActiveFilters,
        storedActiveSorter
    } = props;

    const location = useLocation()
    const { page = 1 } = parseQueryString(location.search)
    const [filterData, setFilterData] = useState(storedFilters)
    const [activeFilters, setActiveFilters] = useState(storedActiveFilters)
    const [sorterData, setSorterData] = useState(storedSorter)
    const [activeSorter, setActiveSorter] = useState(storedActiveSorter)
    const [currentPage, setCurrentPage] = useState(Number(page) || 1)
    const [currentPageSize, setCurrentPageSize] = useState(storedPageSize)


    const columns = [
        {
            title: () => (
                <div className='adv-table-total-items-parent'>
                    Asset Name
                    <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
                </div>
            ),
            dataIndex: 'asset',
            key: 'assetName',
            backendKey: 'asset__name',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'asset__name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'asset__name', 'name'),
            render: (asset, record) => asset ? <Item type='text' data={asset} id={record.id} name='stock-adjust-asset' /> : '',
            sortOrder: activeSorter.columnKey === 'assetName' ? activeSorter.order : false,
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            backendKey: 'quantity',
            sorter: true,
            ellipsis: true,
            render: (quantity, record) => quantity ? <Item type='text' data={quantity} id={record.id} name='stock-adjust-quantity' /> : '',
            ...getColumnSearchProps(filterData, 'quantity', 'quantity', 'number'),
            sortOrder: activeSorter.columnKey === 'quantity' ? activeSorter.order : false,
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            backendKey: 'location__name',
            sorter: true,
            ellipsis: true,
            render: (locationName, record) => locationName ? <Item type='text' data={locationName} id={record.id} name='stock-location-name' /> : '',
            ...getColumnSearchProps(filterData, 'location__name', 'location'),
            sortOrder: activeSorter.columnKey === 'location' ? activeSorter.order : false,
        },
        {
            title: 'Type',
            dataIndex: 'adjustment_type',
            key: 'type',
            backendKey: 'adjustment_type',
            filters: [
                { text: 'Damage', value: 'DAMAGE' },
                { text: 'Reconcile', value: 'RECONCILE' },
            ],
            filterMultiple: false,
            render: (adjustment_type, record) => <Item type='text' data={adjustment_type === 'DAMAGE' ? 'Damage' : 'Reconcile'} id={record.id} name='stock-adjust-status' />,
            ...getFilteredValueProp(filterData, 'adjustment_type'),
        },
        {
            title: 'Adjusted At',
            dataIndex: 'created_at',
            key: 'adjustedAt',
            backendKey: 'created_at',
            sorter: true,
            ellipsis: true,
            render: (created_at, record) => created_at ? <Item type='text' data={moment(created_at).local().format(DATETIME_FORMAT)} id={record.id} name='stock-adjust-created-at' /> : '',
            sortOrder: activeSorter.columnKey === 'adjustedAt' ? activeSorter.order : false,
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
        if (feature) getStockAdjustData(currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
      }, [
        feature,
        filterData,
        sorterData,
        getStockAdjustData,
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
        tableOnChangeHandler(pagination, filters, sorter, 'stockAdjust', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    return (
        <div className='stock-adjustments-list-page'>
            {loader && <Spinner />}
            <div className='main_changable_container' style={{ 'height': window.innerHeight - 59 }}>
                <div className='process_details_tab_cont stock_adjustments_view'>
                    <div className='stock_adjustments_table_list_box'>
                        <AdvTable
                            loading={loader}
                            columns={columns}
                            dataSource={stockAdjustData}
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
            </div>
        </div>
    )
}

const mapStateToProps = (state) => ({
    stockAdjustData: state.stockAdjust.data,
    feature:state.auth.uiFeatures.organisationstocks.view,
    loader: state.stockAdjust.loader,
    message: state.stockAdjust.message,
    totalCount: state.stockAdjust.total,

    storedPageSize: state.stockAdjust.size,
    storedFilters: state.stockAdjust.filters,
    storedSorter: state.stockAdjust.sorter,
    storedActiveSorter: state.stockAdjust.activeSorter,
    storedActiveFilters: state.stockAdjust.activeFilters,
})

const mapDispatchToProps = {
    addToast,
    getStockAdjustList,
}

export default connect(mapStateToProps, mapDispatchToProps)(StockAdjustList)
