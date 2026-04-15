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
    getKit,
    deleteKit
} from '../../../../store/actions/index'
import Spinner from '../../../../components/UI/Spinner/Spinner'

import DeleteModal from '../../../../components/UI/DeleteModel/DeleteModal'

import './KitList.css'

const KitsList = props => {

    const {
        history,
        totalCount,
        loader,
        kits,
        feature,
        renderPage,
        addPermission,
        getKit: getKits,
        editPermission,
        deletePermission,
        storedSorter,
        storedFilters,
        storedPageSize,
        storedActiveFilters,
        storedActiveSorter
    } = props

    const [kitId, setKitId] = useState('')
    const [kitName, setKitName] = useState('')
    const [showWarning, setShowWarning] = useState(false)

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
        setKitId(id)
        setKitName(name)
    }

    const handleDelete = () => {
        props.deleteKit(kitId, totalCount, currentPageSize, currentPage, renderPage)
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
            key: 'kitName',
            backendKey: 'name',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'name', 'name'),
            render: (text, record) => {
                return editPermission
                    ? <Item type='navlink' data={text} path={routes.KIT_EDIT.to(orgId, record.id, page)} id={record.id} name='kit-name-navlink' />
                    : <Item type='text' data={text} id={record.id} name='kit-name' />
            },
            sortOrder: activeSorter.columnKey === 'kitName' ? activeSorter.order : false,
        },
        {
            title: 'Description',
            dataIndex: 'descriptions',
            key: 'descriptions',
            backendKey: 'descriptions',
            ellipsis: true,
            sorter: true,
            render: (descriptions, record) => descriptions ? <Item type='text' data={descriptions} id={record.id} name='kit-description' /> : '',
            ...getColumnSearchProps(filterData, 'descriptions', 'description'),
            sortOrder: activeSorter.columnKey === 'descriptions' ? activeSorter.order : false,
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
                        name='kit-delete-icon'
                    >
                        <DeleteOutlined
                            data-tip
                            data-for={`kit-delete-icon-${record.id}`}
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
        if (feature) getKits(currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
    }, [
        feature,
        filterData,
        sorterData,
        renderPage,
        getKits,
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
        tableOnChangeHandler(pagination, filters, sorter, 'kits', data)
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
                                        <NavLink to={routes.KIT_CREATE.to(orgId, page)}>
                                            <button type='button' className='process_fancy_btn fancy_btn active'>
                                                <span>Add Kit</span>
                                            </button>
                                        </NavLink>
                                    </div>
                                ) : <div />
                                }
                            </div>
                        </li>
                    </ul>
                    <DeleteModal
                        show={showWarning}
                        itemName={kitName}
                        handleDelete={handleDelete}
                        hideWarning={() => setShowWarning(false)}
                    />
                    {kits.length === 0 && isMobile() ? <Empty/>
                    : (
<AdvTable
                        loading={loader}
                        columns={columns}
                        dataSource={kits}
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

const mapStateToProps = ({ auth, kit }) => ({
    kits: kit.data,
    totalCount: kit.total,
    loader: kit.loader,
    renderPage: kit.renderPage,
    feature: auth.uiFeatures.organisationkit.view,
    addPermission: auth.uiPermissions.organisationkit.add,
    editPermission: auth.uiPermissions.organisationkit.change,
    deletePermission: auth.uiPermissions.organisationkit.delete,
    storedPageSize: kit.size,
    storedFilters: kit.filters,

    storedSorter: kit.sorter,
    storedActiveSorter: kit.activeSorter,
    storedActiveFilters: kit.activeFilters,

})

const mapDispatchToProps = {
    getKit,
    deleteKit
}

export default connect(mapStateToProps, mapDispatchToProps)(KitsList)
