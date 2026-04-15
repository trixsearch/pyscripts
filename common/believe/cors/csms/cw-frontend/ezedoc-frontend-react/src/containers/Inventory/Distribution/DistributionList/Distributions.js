/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment,
    useState,
    useEffect
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import moment from 'moment'
import axios from 'axios'

import routes from 'urls'
import { DATETIME_FORMAT } from 'Data/constants'
import Empty from 'components/Empty'
import { parseQueryString, Item, isMobile } from 'containers/utils'

import { Button as AppButton } from 'components/UI/AppButton/AppButton'
import {
    AdvTable,
    clearFiltersHandler,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'

import { getDistributions } from 'store/actions/index'
import DropDownButton from 'components/UI/AppButton/DropDownButton'
import ReturnedAssetDetails from './ReturnedAssetDetails'

import './Distributions.css'

const APP_URL = process.env.REACT_APP_APP_URL;

const Distributions = props => {

    const {
        loader,
        feature,
        history,
        totalCount,
        storedSorter,
        storedFilters,
        addPermission,
        distributions,
        storedPageSize,
        storedActiveSorter,
        storedExtraColumns,
        storedActiveFilters,
        getDistributionList,
        distributionManagePerm,
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
    const [stateLoader, setStateLoader] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [returnDetails, setReturnDetails] = useState([])
    const [extraColumns, setExtraColumns] = useState(storedExtraColumns)

    const handleModal = (isModalOpen, distributionId = null) => {
        if (isModalOpen) setReturnDetails([])
        setShowModal(isModalOpen)
        setStateLoader(!!distributionId)
        if (distributionId) {
            const url = `/api/inventory/asset_distribution/${distributionId}/return_assets`
            axios.get(url)
                .then(res => setReturnDetails(res.data.data))
                // eslint-disable-next-line no-console
                .catch(err => console.log('err >>', err))
                .finally(() => setStateLoader(false))
        }
    }

    let columns = [
        {
            title: () => (
                <div className='adv-table-total-items-parent'>
                    Alloted To
                    <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
                </div>
            ),
            width: 180,
            dataIndex: 'allottee_name',
            key: 'allotedTo',
            backendKey: 'distribution__allottee__first_name',
            sorter: true,
            ellipsis: true,
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'distribution__allottee__first_name' ? ['descend'] : ['ascend', 'descend'],
            render: (allottee_name, record) => allottee_name ? <Item type='text' data={allottee_name} id={record.id} name='distribution-allottee-name' /> : '',
            ...getColumnSearchProps(filterData, 'distribution__allottee__first_name', 'allottee name'),
            sortOrder: activeSorter.columnKey === 'allotedTo' ? activeSorter.order : false,
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            backendKey: 'quantity',
            sorter: true,
            ellipsis: true,
            render: (quantity, record) => quantity ? <Item type='text' data={quantity} id={record.id} name='distribution-quantity' /> : '',
            ...getColumnSearchProps(filterData, 'quantity', 'quantity', 'number'),
            sortOrder: activeSorter.columnKey === 'quantity' ? activeSorter.order : false,
        },
        {
            title: 'Time',
            dataIndex: 'allotted_at',
            key: 'time',
            ellipsis: true,
            render: (allotted_at, record) => allotted_at ? <Item type='text' data={moment(allotted_at).local().format(DATETIME_FORMAT)} id={record.id} name='distribution-allotted-at' /> : '',
        },
        {
            title: 'Asset Name',
            dataIndex: 'asset_name',
            key: 'assetName',
            backendKey: 'asset__name',
            sorter: true,
            ellipsis: true,
            render: (asset_name, record) => asset_name ? <Item type='text' data={asset_name} id={record.id} name='distribution-asset-name' /> : '',
            ...getColumnSearchProps(filterData, 'asset__name', 'asset'),
            sortOrder: activeSorter.columnKey === 'assetName' ? activeSorter.order : false,
        },
        {
            title: 'Location',
            dataIndex: 'location_detailed',
            key: 'location',
            backendKey: 'location__name',
            sorter: true,
            ellipsis: true,
            render: (location_detailed, record) => location_detailed ? <Item type='text' data={location_detailed.name} id={record.id} name='distribution-location-name' /> : '',
            ...getColumnSearchProps(filterData, 'location__name', 'location'),
            sortOrder: activeSorter.columnKey === 'location' ? activeSorter.order : false,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (text, record) => {
                let bgColor
                if (text === 'Distributed') bgColor = '#16a085'
                else if (text === 'Partially Returned') bgColor = '#f1c40f'
                else if (text === 'Fully Returned') bgColor = '#e67e22'

                const customStyle = {
                    width: 150,
                    height: 28,
                    border: 'none',
                    borderRadius: 5,
                    color: '#ffffff',
                    background: bgColor,
                    outline: 'none',
                    cursor: text !== 'Distributed' ? 'pointer' : 'auto',
                }

                return (
                    <AppButton
                        variant='status-btn'
                        onClick={() => text !== 'Distributed' && handleModal(true, record.id)}
                        customStyle={customStyle}
                    >
                        {text}
                    </AppButton>
                )
            }
        },
    ]

    const fetchExtraFields = () => {
        axios
            .get(`${APP_URL}/${orgId}/config/custom_attribute/get_attribute?type=externalusers`)
            .then(res => setExtraColumns(res.data.data.components))
    }

    useEffect(() => {
        // Fetch extra field details
        fetchExtraFields()
    }, [])

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
        if (feature) getDistributionList('PARTNER', currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, extraColumns, history)
    }, [
        feature,
        filterData,
        sorterData,
        currentPage,
        currentPageSize,
        getDistributionList,
    ])
    

    let columnDetails = [...columns]
    if (distributions && typeof (extraColumns)!=="object") {
        // Creating & Maintaining Extra (Dynamic) Column Details
        const extraColumnDetails = extraColumns.map(column => {
            const compKey = column.key
            const compLabel = column.label
            const compType = column.type
            const columnData = {
                title: compLabel,
                dataIndex: 'allottee_extra_details',
                key: compKey,
                backendKey: `distribution__allottee__extra_fields__${compKey}`,
                sorter: true,
                ellipsis: true,
                width: 150,
                render: (allottee_extra_details, record) => allottee_extra_details ? <Item type='text' data={allottee_extra_details[compKey]} id={record.id} name={`distribution-extra-field-${compKey}`} /> : '',
                ...getColumnSearchProps(filterData, `distribution__allottee__extra_fields__${compKey}`, compLabel, compType),
                sortOrder: activeSorter.columnKey === compKey ? activeSorter.order : false,
            }
            return columnData
        })

        const lastItem = columns.pop()
        columnDetails = [...columns, ...extraColumnDetails, lastItem]
    }

    const handleTableChange = (pagination, filters, sorter) => {
        const data = {
            setFilterData,
            setSorterData,
            setCurrentPage,
            setActiveSorter,
            setActiveFilters,
            setCurrentPageSize,
            columns: columnDetails,
            initialSortData: 'distribution__allottee__first_name',
            firstColumnKey: columnDetails[0].key,
            firstColumnCustomTitle: 'Alloted To',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'distributions', data)
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    return (
        <Fragment>
            <ReturnedAssetDetails
                showModal={showModal}
                stateLoader={stateLoader}
                handleModal={handleModal}
                returnDetails={returnDetails}
            />
            <div className='main_changable_container' style={{ 'height': window.innerHeight - 59 }}>
                <div className='process_details_tab_cont config_location_view'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
                        <li className='process_tab_last_li'>
                            <div className='process_details_btn_cont'>
                                <Fragment>
                                <DropDownButton
                                    id='stock_transfer_dropdown'
                                    defaultButtonCondition
                                    defaultButtonName='Inter-Location Stock Transfers'
                                    handleClick={() => history.push(routes.DISTRIBUTION_INTER_TRANSFER_LIST.path)}
                                >
                                    <li style={{ padding: '2px 0' }}>
                                        <NavLink to={routes.DISTRIBUTION_OTHER_TRANSFER_LIST.path}>
                                            Others
                                        </NavLink>
                                    </li>
                                </DropDownButton>
                                </Fragment>
                                {addPermission && !distributionManagePerm ? (
                                    <NavLink to={routes.DISTRIBUTION_CREATE.to(orgId, page)}>
                                        <button
                                            type='button'
                                            className='process_fancy_btn fancy_btn active'
                                        >
                                            Distribute
                                        </button>
                                    </NavLink>
                                ) : null}
                            </div>
                        </li>
                    </ul>
                    {distributions.length === 0 && isMobile() ? <Empty/> 
                    : (
<AdvTable
                        loading={loader}
                        columns={columnDetails}
                        dataSource={distributions}
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

const mapStateToProps = ({ distribution, auth }) => ({
    loader: distribution.loader,
    totalCount: distribution.total,
    distributions: distribution.data,
    storedPageSize: distribution.size,
    storedFilters: distribution.filters,
    storedSorter: distribution.sorter,
    storedActiveSorter: distribution.activeSorter,
    storedActiveFilters: distribution.activeFilters,
    storedExtraColumns: distribution.extraColumns,

    feature: auth.uiFeatures.organisationassetdistribution.view,
    distributionManagePerm: auth.uiFeatures.distribution.manage,
    addPermission: auth.uiPermissions.organisationassetdistribution.add,
})

const mapDispatchToProps = {
    getDistributionList: getDistributions,
}

export default connect(mapStateToProps, mapDispatchToProps)(Distributions)
