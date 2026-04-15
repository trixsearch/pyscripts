/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment, useState, useEffect
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { EditOutlined } from '@ant-design/icons'
import axios from 'axios'
import moment from 'moment'

import routes from 'urls'
import { DATETIME_FORMAT } from 'Data/constants'
import { parseQueryString, Item } from 'containers/utils'
import {
    AdvTable,
    clearFiltersHandler,
    getFilteredValueProp,
    getColumnSearchProps,
    tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'
import DeleteModal from 'components/UI/DeleteModel/DeleteModal'
import BulkImport from 'components/UI/DocumentUpload/BulkImport'

import { addToast } from 'components/Toast/actions'
import { getUsers, recoverUser, deleteUser } from 'store/actions/index'
import { HasAccess } from '../../../../platformDataStoreContext'
import UnauthorizedPage from '../../../UnauthorizedPage'

import UserActivity from '../userDetails/UserActivity'

import './UserList.css'
import { CW_SERVICE_USER_UPDATE, CW_SERVICE_USER_VIEW } from '../../../../Data/constants'

const APP_URL = process.env.REACT_APP_APP_URL;

const FilterOptions = [
    {
        id: 'active',
        name: 'Existing Users',
    },
    {
        id: 'inactive',
        name: 'Deleted Users',
    },
    {
        id: 'all',
        name: 'All Users',
    },
]

const UsersList = props => {

    const {
        users,
        loader,
        feature,
        history,
        totalCount,
        renderPage,
        storedSorter,
        storedFilters,
        viewPermission,
        editPermission,
        storedPageSize,
        storedUserType,
        // deletePermission,
        storedActiveSorter,
        storedActiveFilters,
        getUsers: getUserList,
        deleteUser: deleteAUser,
        // recoverUser: recoverAUser,
        storedExtraColumns
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
    const [isOpenImportModal, setIsOpenImportModal] = useState(false)
    const [userType, setUserType] = useState(storedUserType)
    const [stateLoader, setStateLoader] = useState(false)
    const [userData, setUserData] = useState([])
    const [showWarning, setShowWarning] = useState(false)
    const [selectedUser] = useState({
        id: null,
        name: null
    })
    const [extraColumns, setExtraColumns] = useState(storedExtraColumns)

    // const showWarningModal = (id, name) => {
    //     setShowWarning(true)
    //     setSelectedUser({ id, name })
    // }

    const handleDelete = () => {
        deleteAUser(orgId, selectedUser.id, totalCount, currentPageSize, currentPage, renderPage)
        setShowWarning(false)
    }

    const rowSelection = {
        selectedRowKeys: [...userData],
        onChange: selectedRowKeys => {
            setUserData([...selectedRowKeys])
        },
        getCheckboxProps: record => ({
            disabled: record.is_deleted,
        }),
    }

    let columns = [
        {
            title: () => (
                <div className='adv-table-total-items-parent'>
                    Full Name
                    <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
                </div>
            ),
            dataIndex: 'full_name',
            key: 'fullName',
            backendKey: 'first_name',
            sorter: true,
            ellipsis: true,
            width: 180,
            fixed: 'left',
            defaultSortOrder: 'ascend',
            sortDirections: sorterData === 'first_name' ? ['descend'] : ['ascend', 'descend'],
            ...getColumnSearchProps(filterData, 'first_name', 'full name'),
            render: (text, record) => <Item type='text' data={text} id={record.id} name='user-name' placement='right' />,
            sortOrder: activeSorter.columnKey === 'fullName' ? activeSorter.order : false,
        },
        {
            title: 'Mobile',
            dataIndex: 'mobile',
            key: 'mobile',
            backendKey: 'mobile',
            sorter: true,
            ellipsis: true,
            width: 110,
            render: (mobile, record) => mobile ? <Item type='text' data={mobile} id={record.id} name='user-mobile' /> : '',
            ...getColumnSearchProps(filterData, 'mobile', 'mobile'),
            sortOrder: activeSorter.columnKey === 'mobile' ? activeSorter.order : false,
        },
        // {
        //     title: 'Department',
        //     dataIndex: 'department',
        //     key: 'department',
        //     backendKey: 'department__name',
        //     sorter: true,
        //     ellipsis: true,
        //     width: 110,
        //     render: (department, record) => department ? <Item type='text' data={department.name} id={record.id} name='user-department' /> : '',
        //     ...getColumnSearchProps(filterData, 'department__name', 'department'),
        //     sortOrder: activeSorter.columnKey === 'department' ? activeSorter.order : false,
        // },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            backendKey: 'location__name',
            sorter: true,
            ellipsis: true,
            width: 110,
            render: (location, record) => location ? <Item type='text' data={location.name} id={record.id} name='user-location' /> : '',
            ...getColumnSearchProps(filterData, 'location__name', 'location'),
            sortOrder: activeSorter.columnKey === 'location' ? activeSorter.order : false,
        },
        {
            title: 'Manager',
            dataIndex: 'manager',
            key: 'manager',
            backendKey: 'manager__email',
            sorter: true,
            ellipsis: true,
            width: 110,
            render: (manager, record) => manager ? <Item type='text' data={manager.email} id={record.id} name='user-manager-email' /> : '',
            ...getColumnSearchProps(filterData, 'manager__email', 'manager'),
            sortOrder: activeSorter.columnKey === 'manager' ? activeSorter.order : false,
        },
        {
            title: 'Role',
            dataIndex: 'roles',
            key: 'role',
            backendKey: 'groups__name',
            sorter: true,
            ellipsis: true,
            width: 110,
            render: (roles, record) => roles ? <Item type='text' data={roles?.[0]?.name} id={record.id} name='user-role' /> : '',
            ...getColumnSearchProps(filterData, 'groups__name', 'role'),
            sortOrder: activeSorter.columnKey === 'role' ? activeSorter.order : false,
        },
        // {
        //     title: 'Partners',
        //     dataIndex: 'partner',
        //     key: 'partner',
        //     backendKey: 'partner__name',
        //     sorter: true,
        //     ellipsis: true,
        //     width: 110,
        //     render: (partner, record) => partner ? <Item type='text' data={record.partner.name} id={record.id} name='user-partner' /> : '',
        //     ...getColumnSearchProps(filterData, 'partner__name', 'partner'),
        //     sortOrder: activeSorter.columnKey === 'partner' ? activeSorter.order : false,
        // },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'status',
            backendKey: 'is_active',
            filters: [
                { text: 'Active', value: 'true' },
                { text: 'Inactive', value: 'false' },
            ],
            filterMultiple: false,
            width: 110,
            render: (is_active, record) => <Item type='text' data={is_active ? 'Active' : 'Inactive'} id={record.id} name='user-status' />,
            ...getFilteredValueProp(filterData, 'is_active'),
        },
        {
            title: 'Last Seen',
            dataIndex: 'last_login',
            key: 'lastSeen',
            ellipsis: true,
            width: 110,
            render: (last_login, record) => last_login ? <Item type='text' data={moment(last_login).local().format(DATETIME_FORMAT)} id={record.id} name='user-last-seen' /> : 'Never',
        },
        {
                title: 'Actions',
                dataIndex: 'actions',
                key: 'actions',
                width: 70,
                fixed: 'right',
                align: 'center',
                render: (text, record) => {
                    let content = null

                if (!record.is_deleted) {
                    content = (
                        <HasAccess
                            permissions={[CW_SERVICE_USER_UPDATE]}
                            yes={() => (
                                <NavLink to={routes.USER_EDIT.to(orgId, record.id, page)} >
                                    <EditOutlined
                                        data-tip
                                        data-for={`users-edit-icon-${record.id}`}
                                    />
                                </NavLink>
                            )}
                        />
                    )
                    return content
                }
                }
                },
        // {
        //     title: 'Actions',
        //     dataIndex: 'actions',
        //     key: 'actions',
        //     width: 70,
        //     fixed: 'right',
        //     align: 'center',
        //     render: (text, record) => {
        //         let content = null
        //         if (deletePermission && !record.is_deleted && record.roles?.[0]?.name !== 'Owner') content = (
        //             <Item
        //                 type='icon'
        //                 data='Delete'
        //                 id={record.id}
        //                 placement='left'
        //                 name='user-delete-icon'
        //             >
        //                 <DeleteOutlined
        //                     data-tip
        //                     data-for={`user-delete-icon-${record.id}`}
        //                     onClick={() => showWarningModal(record.id, record.full_name)}
        //                 />
        //             </Item>
        //         )
        //         if (isOwnerOrSuperAdmin && record.is_deleted) content = (
        //             <Item
        //                 type='icon'
        //                 data='Recover'
        //                 id={record.id}
        //                 placement='left'
        //                 name='user-recover-icon'
        //             >
        //                 <RedoOutlined
        //                     data-tip
        //                     rotate='-90'
        //                     onClick={() => recoverAUser(orgId, record.id)}
        //                     data-for={`user-recover-icon-${record.id}`}
        //                 />
        //             </Item>
        //         )
        //         return content
        //     }
        // },
    ]

    const fetchExtraFields = () => {
        axios
            .get(`${APP_URL}/${orgId}/config/custom_attribute/get_attribute?type=users`)
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
        if (feature) getUserList(orgId, currentPage, currentPageSize, userType, filterData, sorterData, activeFilters, activeSorter, extraColumns, history)
    }, [
        orgId,
        feature,
        userType,
        filterData,
        sorterData,
        renderPage,
        getUserList,
        currentPage,
        currentPageSize,
    ])

    let columnDetails = [...columns]
    if (users) {
        // Creating & Maintaining Extra (Dynamic) Column Details
        let extraColumnDetails = []
        extraColumns.forEach(column => {
            const compKey = column.key
            const compLabel = column.label
            const compType = column.type
            let columnData = {}
            if (column.type !== 'list') {
                columnData = {
                    title: compLabel,
                    dataIndex: 'extra_fields',
                    key: compKey,
                    backendKey: `extra_fields__${compKey}`,
                    sorter: true,
                    ellipsis: true,
                    width: 110,
                    render: (extra_fields, record) => extra_fields ? <Item type='text' data={extra_fields[compKey]} id={record.id} name={`user-extra-field-${compKey}`} /> : '',
                    ...getColumnSearchProps(filterData, `extra_fields__${compKey}`, compLabel, compType),
                    sortOrder: activeSorter.columnKey === compKey ? activeSorter.order : false,
                }

            } else {
                columnData = {
                    title: compLabel,
                    dataIndex: 'extra_fields',
                    key: compKey,
                    backendKey: `extra_fields__${compKey}`,
                    ellipsis: true,
                    width: 110,
                    render: (extra_fields, record) => {
                        if (extra_fields[compKey]) {
                            if (typeof (extra_fields[compKey]) === 'object') {
                                let multiData = []
                                if (column.isMulti === true) {
                                    extra_fields[compKey].forEach(data => multiData.push(data.value))
                                } else {
                                    multiData.push(extra_fields[compKey].value)
                                }
                                return (
                                    <Item
                                        type='list'
                                        id={record.id}
                                        multiData={multiData}
                                        name={`user-extra-field-${compKey}`}
                                    />
                                )
                            }
                        } return ""
                    }
                }
            }
            extraColumnDetails.push(columnData)

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
            initialSortData: 'first_name',
            firstColumnCustomTitle: 'Full Name',
            firstColumnKey: columnDetails[0].key,
        }
        tableOnChangeHandler(pagination, filters, sorter, 'users', data)
    }

    const handleFilterDropdownChange = value => {
        setUserType(FilterOptions.filter(option => option.id === value)[0])
        setCurrentPage(1)
    }

    const sendActivationLinkHandler = () => {
        if (userData.length !== 0) {
            setStateLoader(true)
            axios.post(
                `${APP_URL}/${orgId}/users/org_users/send_account_activation_link`,
                { user_data: userData }
            )
                .then(() => props.addToast('success', 'Success', 'Account Activation Link sent successfully'))
                .catch(() => props.addToast('error', 'Error', 'Something went wrong'))
                .finally(() => {
                    setUserData([])
                    setStateLoader(false)
                })
        }
    }

    const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
    }

    const url = `${APP_URL}/${orgId}/users/org_users/bulk_import_user`
    const title = 'Import Users'

    return (
        <HasAccess
                permissions={[CW_SERVICE_USER_VIEW]}
                yes={() => (
                    <Fragment>
                        <div className='main_changable_container' style={{ 'height': window.innerHeight - 56 - 3 }}>
                            <div className='process_details_tab_cont config_user_view'>
                                <UserActivity
                                    filter={userType}
                                    user_data={userData}
                                    show={viewPermission}
                                    filterOptions={FilterOptions}
                                    sendActivationLink={sendActivationLinkHandler}
                                    handleFilterChange={handleFilterDropdownChange}
                                    onImportUsers={() => setIsOpenImportModal(true)}
                                />
                                <DeleteModal
                                    show={showWarning}
                                    handleDelete={handleDelete}
                                    itemName={selectedUser.name}
                                    hideWarning={() => setShowWarning(false)}
                                />
                                <AdvTable
                                    loading={loader || stateLoader}
                                    columns={columnDetails}
                                    dataSource={users}
                                    pagination={{
                                        total: totalCount,
                                        current: currentPage,
                                        pageSize: currentPageSize,
                                    }}
                                    rowSelection={rowSelection}
                                    rowKey={record => record.id}
                                    onChange={handleTableChange}
                                    rowClassName={record => record.is_deleted ? 'deleted-user' : ''}
                                    activeFilters={activeFilters}
                                    handleClearFilters={handleClearFilters}
                                />
                                <BulkImport
                                    url={url}
                                    title={title}
                                    history={history}
                                    show={isOpenImportModal}
                                    redirectUrl={`/custom-workflow/org/${orgId}/config/users/import-history`}
                                    handleShow={value => setIsOpenImportModal(value)}
                                />
                            </div>
                        </div>
                    </Fragment>
                )}
                no={() => (
                    <UnauthorizedPage />
                )}
        />
    )
}

const mapStateToProps = ({ users, auth }) => ({
    users: users.data,
    loader: users.loader,
    totalCount: users.total,
    renderPage: users.renderPage,
    storedPageSize: users.size,
    storedUserType: users.userType,
    storedFilters: users.filters,
    storedSorter: users.sorter,
    storedActiveSorter: users.activeSorter,
    storedActiveFilters: users.activeFilters,
    feature: auth.uiFeatures.organisationuser.view,
    viewPermission: auth.uiPermissions.organisationuser.view,
    editPermission: auth.uiPermissions.organisationuser.change,
    deletePermission: auth.uiPermissions.organisationuser.delete,
    storedExtraColumns: users.extraColumns,
})

const mapDispatchToProps = {
    getUsers,
    addToast,
    deleteUser,
    recoverUser,
}

export default connect(mapStateToProps, mapDispatchToProps)(UsersList)
