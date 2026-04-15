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
    getAsset,
    deleteAsset,
} from '../../../../store/actions/index'
import Spinner from '../../../../components/UI/Spinner/Spinner'

import DeleteModel from '../../../../components/UI/DeleteModel/DeleteModal'

import './AssetList.css'

const AssetsList = props => {
    const [assetId, setAssetId] = useState('')
    const [assetName, setAssetName] = useState('')
    const [showWarning, setShowWarning] = useState(false)

    const {
        history,
        totalCount,
        loader,
        assets,
        feature,
        renderPage,
        addPermission,
        getAsset: getAssets,
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
        setAssetId(id)
        setAssetName(name)
    }

    const handleDelete = () => {
        props.deleteAsset(assetId, totalCount, currentPageSize, currentPage, renderPage)
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
            key: 'assetName',
            backendKey: 'name',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'name', 'asset name'),
            render: (text, record) => {
                return editPermission
                    ? <Item type='navlink' data={text} path={routes.ASSET_EDIT.to(orgId, record.id, page)} id={record.id} name='asset-name-navlink' />
                    : <Item type='text' data={text} id={record.id} name='asset-name' />
            },
            sortOrder: activeSorter.columnKey === 'assetName' ? activeSorter.order : false,
        },
        {
            title: 'Description',
            dataIndex: 'descriptions',
            key: 'description',
            backendKey: 'descriptions',
            ellipsis: true,
            sorter: true,
            render: (descriptions, record) => descriptions ? <Item type='text' data={descriptions} id={record.id} name='asset-description' /> : '',
            ...getColumnSearchProps(filterData, 'descriptions', 'descriptions'),
            sortOrder: activeSorter.columnKey === 'description' ? activeSorter.order : false,
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
                        name='asset-delete-icon'
                    >
                        <DeleteOutlined
                            data-tip
                            data-for={`asset-delete-icon-${record.id}`}
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
        if (feature) getAssets(currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
    }, [
        feature,
        filterData,
        sorterData,
        renderPage,
        getAssets,
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
        tableOnChangeHandler(pagination, filters, sorter, 'assets', data)
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
                                        <NavLink to={routes.ASSET_CREATE.to(orgId, page)}>
                                            <button type='button' className='process_fancy_btn fancy_btn active'>
                                                <span>Add Asset</span>
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
                        itemName={assetName}
                        handleDelete={handleDelete}
                        hideWarning={() => setShowWarning(false)}
                    />
                    {assets.length === 0 && isMobile() ? <Empty/>
                    : (
<AdvTable
                        loading={loader}
                        columns={columns}
                        dataSource={assets}
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

const mapStateToProps = ({ asset, auth }) => ({
    assets: asset.data,
    totalCount: asset.total,
    loader: asset.loader,
    renderPage: asset.renderPage,
    feature: auth.uiFeatures.organisationasset.view,
    addPermission: auth.uiPermissions.organisationasset.add,
    editPermission: auth.uiPermissions.organisationasset.change,
    deletePermission: auth.uiPermissions.organisationasset.delete,
    storedPageSize: asset.size,
    storedFilters: asset.filters,

    storedSorter: asset.sorter,
    storedActiveSorter: asset.activeSorter,
    storedActiveFilters: asset.activeFilters,
})

const mapDispatchToProps = {
    getAsset,
    deleteAsset
}

export default connect(mapStateToProps, mapDispatchToProps)(AssetsList)
