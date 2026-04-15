/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from "react-router-dom";

import routes from 'urls';
import Empty from 'components/Empty'
import { parseQueryString, Item, isMobile } from 'containers/utils';
import {
    AdvTable,
    clearFiltersHandler,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'
import {
    SlidersOutlined,
} from '@ant-design/icons'
import Spinner from 'components/UI/Spinner/Spinner'

import {
    getStock,
} from 'store/actions/index'

import './StockList.css'

const StockList = (props) => {
    const {
        history,
        getStock: getStocksList,
        feature,
        loader,
        changePermission,
        totalCount,
        stock,
        storedSorter,
        storedFilters,
        storedPageSize,
        storedActiveFilters,
        storedActiveSorter
    } = props;


    const location = useLocation();
    const { page = 1 } = parseQueryString(location.search);
    const { uuid: orgId } = useParams();

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
            dataIndex: 'asset_name',
            key: 'assetName',
            backendKey: 'product__name',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'product__name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'product__name', 'name'),
            render: (asset_name, record) => asset_name ? <Item type='text' data={asset_name} id={record.id} name='stock-asset-name' /> : '',
            sortOrder: activeSorter.columnKey === 'assetName' ? activeSorter.order : false,
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            backendKey: 'quantity',
            sorter: true,
            ellipsis: true,
            render: (quantity, record) => quantity ? <Item type='text' data={quantity} id={record.id} name='stock-quantity' /> : '',
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
            render: (location_detailed, record) => location_detailed ? <Item type='text' data={location_detailed.name} id={record.id} name='stock-location-name' /> : '',
            ...getColumnSearchProps(filterData, 'location__name', 'location'),
            sortOrder: activeSorter.columnKey === 'location__name' ? activeSorter.order : false,
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            align: 'center',
            width: '7%',
            render: (text, record) => {
                let content = null
                if (changePermission) content = (
                    <Item
                        type='icon'
                        data='Adjust'
                        id={record.id}
                        name='stock-adjust-icon'
                    >
                        <SlidersOutlined
                            data-tip
                            data-for={`stock-adjust-icon-${record.id}`}
                            onClick={() => history.push(routes.STOCK_ADJUST.to(orgId, record.id, page))}
                        />
                    </Item>
                )
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
        if (feature) getStocksList(currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
    }, [
        feature,
        filterData,
        sorterData,
        getStocksList,
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
            initialSortData: 'product__name',
            firstColumnKey: columns[0].key,
            firstColumnCustomTitle: 'Asset Name',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'stocks', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    return (
        <>
            <div>
                {loader && (<Spinner />)}
                <div className='main_changable_container' style={{ 'height': window.innerHeight - 59 }}>
                    <div className='process_details_tab_cont config_location_view'>
                        <div className='stockBtn' >
                            <div className='process_details_btn_cont'>
                                {
                                    changePermission ? (
                                        <NavLink to={routes.STOCK_ADJUST_LIST.to(orgId)}>
                                            <button type='button' className='process_fancy_btn fancy_btn'>
                                                <span>Stock Adjustments</span>
                                            </button>
                                        </NavLink>
                                    ) : null
                                }
                            </div>
                        </div>
                        {stock.length===0 && isMobile() ? <Empty/>
                         : (
<AdvTable
                         loading={loader}
                         columns={columns}
                         dataSource={stock}
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
        </>
    );
}

const mapStateToProps = (state) => ({
    loader: state.stock.loader,
    stock: state.stock.data,
    totalCount: state.stock.total,
    feature: state.auth.uiFeatures.organisationstocks.view,
    changePermission: state.auth.uiPermissions.organisationstocks.change,

    storedPageSize: state.stock.size,
    storedFilters: state.stock.filters,
    storedSorter: state.stock.sorter,
    storedActiveSorter: state.stock.activeSorter,
    storedActiveFilters: state.stock.activeFilters,
})

const mapDispatchToProps = {
    getStock,
}

export default connect(mapStateToProps, mapDispatchToProps)(StockList)
