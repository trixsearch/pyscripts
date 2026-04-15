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
    EditableRow,
    EditableCell,
} from 'components/UI/AntDesignTable/AdvTable'

import {
    setPlanning,
} from 'store/actions/index'

import './HeadCount.css'

const HeadCountPlanning = props => {

    const {
        loader,
        feature,
        history,
        totalCount,
        savePlanning,
        storedPageSize,
        planPermission,
        headCountPlanList,
        addJobPermission,
    } = props

    const locationInfo = useLocation()
    const { page = 1, next = 1 } = parseQueryString(locationInfo.search)
    const { uuid: orgId } = useParams();

    const [currentPage, setCurrentPage] = useState(Number(page) || 1)
    const [currentPageSize, setCurrentPageSize] = useState(storedPageSize)
    const [dataSource, setDataSource] = useState(headCountPlanList)
    const [dirtyData, setDirtyData] = useState([])

    const mArr = new Array(12).fill(0)
    let mReducer = 0

    const dynamicColumns = mArr
        && Array.isArray(mArr)
        && mArr.map(() => {
            const month = moment().add(mReducer, 'month').format('MMMM')
            const year = moment().add(mReducer, 'month').format('YYYY')
            mReducer += 1
            return {
                title: `${month.substring(0, 3)} ${year}`,
                dataIndex: `${year}-${month}`,
                width: 100,
                editable: true,
                inputType: 'number',
                isYearMonth: true,
            }
        })

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
            ellipsis: true,
            fixed: 'left',
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='headcount-role' placement='left' /> : ''),
        },
        {
            title: 'Location',
            dataIndex: 'location_name',
            key: 'location',
            backendKey: 'location__name',
            width: 150,
            ellipsis: true,
            fixed: 'left',
            render: (text, record) => (text ? <Item type='text' data={text} id={record.id} name='headcount-location' placement='right' /> : ''),
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

    const handleTableChange = pagination => {
        setCurrentPage(pagination.current)
        setCurrentPageSize(pagination.pageSize)
    }

    const updateTable = (row, payload) => {
        const newData = [...dataSource]
        const index = newData.findIndex(item => row.key === item.key)
        const itemData = newData[index]
        newData.splice(index, 1, { ...itemData, ...row })

        const newDirtyData = [...dirtyData]
        const index2 = newDirtyData.findIndex(item => payload.id === item.id && payload.year === item.year && payload.month === item.month)
        const itemPayload = {
            id: payload.id,
            role: payload.role,
            location: payload.location,
            year: payload.year,
            month: payload.month,
            total_count: payload.value,
        }
        if (index2 === -1) newDirtyData.push(itemPayload)
        else newDirtyData.splice(index2, 1, itemPayload)

        setDataSource(newData)
        setDirtyData(newDirtyData)
    }

    const handleSave = () => {
        if (feature) savePlanning(dirtyData)
        history.push(routes.HEAD_COUNT.to(orgId, next))
    }

    const columnsDetails = columns.map((col) => {
        if (!col.editable) {
            return col
        }

        return {
            ...col,
            onCell: record => ({
                record,
                updateTable,
                title: col.title,
                editable: col.editable,
                inputType: col.inputType,
                dataIndex: col.dataIndex,
                isYearMonth: col.isYearMonth || false,
            }),
        }
    })

    return (
        <Fragment>
            <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
                <div className='process_details_tab_cont headcount-planning'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
                        <li className='process_tab_last_li'>
                            <div className='process_details_btn_cont'>
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
                                {
                                    planPermission ? (
                                        <button
                                            type='button'
                                            onClick={() => handleSave()}
                                            className='process_fancy_btn fancy_btn active'
                                        >
                                            Save
                                        </button>
                                    ) : null
                                }
                            </div>
                        </li>
                    </ul>
                    <AdvTable
                        loading={loader}
                        columns={columnsDetails}
                        components={{
                            body: {
                                row: EditableRow,
                                cell: EditableCell,
                            },
                        }}
                        dataSource={dataSource}
                        pagination={{
                            total: totalCount,
                            current: currentPage,
                            pageSize: currentPageSize,
                        }}
                        rowKey={record => record.id}
                        rowClassName={() => 'editable-row'}
                        onChange={handleTableChange}
                    />
                </div>
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ headcountplan, auth }) => ({
    headCountPlanList: headcountplan.headcounts2,
    loader: headcountplan.loader,
    totalCount: headcountplan.total2,
    storedPageSize: headcountplan.size2,

    feature: auth.uiFeatures.headcountplan.view,
    planPermission: auth.uiPermissions.headcountplan.add && auth.uiPermissions.headcountplan.change,
    addJobPermission: auth.uiPermissions.job.add
})

const mapDispatchToProps = {
    savePlanning: setPlanning,
}

export default connect(mapStateToProps, mapDispatchToProps)(HeadCountPlanning)
