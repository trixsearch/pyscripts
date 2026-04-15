/* eslint-disable no-restricted-globals */
import React, {
    useRef,
    useState,
    Fragment,
    useEffect,
    useContext,
    createContext,
} from 'react'
import {
    Table, Tag, Input, Button, Space, Form
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'

import moment from 'moment';
import { Button as AppButton } from '../AppButton/AppButton'
import Spinner from '../Spinner/Spinner'
import 'antd/dist/antd.css'
import './AdvTable.css'

const EditableContext = createContext(null)

export const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm()
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    )
}

export const EditableCell = ({
    title,
    record,
    editable,
    children,
    dataIndex,
    updateTable,
    inputType = 'string',
    isYearMonth = false,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false)
    const inputRef = useRef(null)
    const form = useContext(EditableContext)

    useEffect(() => {
        if (editing) {
            inputRef.current.focus()
        }
    }, [editing])

    const toggleEdit = () => {
        setEditing(!editing)
        form.setFieldsValue({
            [dataIndex]: record[dataIndex],
        })
    }

    const save = async () => {
        try {
            let year
            let month
            let value

            const values = await form.validateFields()
            let modifiedValues = { ...values }

            Object.keys(modifiedValues).forEach(valueKey => {
                if (modifiedValues[valueKey] !== undefined) {
                    if (inputType === 'number') modifiedValues[valueKey] = parseInt(modifiedValues[valueKey], 10)
                    if (isYearMonth) {
                        const splitData = valueKey.split('-')
                        year = splitData[0]
                        month = splitData[1]
                        value = modifiedValues[valueKey]
                    }
                }
            })

            toggleEdit()

            if (value !== undefined) {
                if (isYearMonth) {
                    updateTable({
                        ...record,
                        ...modifiedValues
                    }, {
                        id: record.id,
                        role: record.role,
                        location: record.location,
                        year,
                        month,
                        value,
                    })
                } else {
                    updateTable({
                        ...record,
                        ...modifiedValues
                    })
                }
            }
        } catch (errInfo) {
            // eslint-disable-next-line no-console
            console.log('Save failed:', errInfo)
        }
    }

    let childNode = children

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
            >
                <Input
                    onBlur={save}
                    ref={inputRef}
                    type={inputType}
                    onPressEnter={save}
                />
            </Form.Item>
        ) : (
            <div
                role='presentation'
                onClick={toggleEdit}
                className='editable-cell-value-wrap'
            >
                {children}
            </div>
        )
    }

    return <td {...restProps}>{childNode}</td>
}

export const getFilteredValueProp = (filterData, backendKey) => ({
    filteredValue: filterData[backendKey] ? [filterData[backendKey],] : null,
})

export const getColumnSearchProps = (filterData, backendKey, placeholder, type = 'string') => ({
    filterDropdown: ({
        setSelectedKeys, selectedKeys, confirm, clearFilters
    }) => (
        <div style={{ padding: 8 }}>
            <Input
                type={type}
                value={selectedKeys[0]}
                onPressEnter={() => {
                    if (placeholder === "jobrole name") window.sendEvent('Hire_Search_job_roles')
                    if (placeholder === "location name") window.sendEvent('Hire_Search_locations')
                    if (placeholder === "vendor name") window.sendEvent('Hire_Vendors_search')
                    confirm()
                }}
                placeholder={`Search ${placeholder}`}
                style={{ marginBottom: 8, display: 'block' }}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            />
            <Space>
                <Button
                    size='small'
                    type='primary'
                    style={{ width: 100 }}
                    icon={<SearchOutlined />}
                    onClick={() => {
                        window.sendEvent("Hire_Searches_done")
                        if (placeholder === "jobrole name") window.sendEvent('Hire_Search_job_roles')
                        if (placeholder === "location name") window.sendEvent('Hire_Search_locations')
                        confirm()
                    }}
                >
                    Search
                </Button>
                <Button
                    size='small'
                    style={{ width: 90 }}
                    onClick={() => { clearFilters(); confirm() }}
                >
                    Reset
                </Button>
            </Space>
        </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    ...getFilteredValueProp(filterData, backendKey),
})

export const tableOnChangeHandler = (pagination, filters, sorter, url, data) => {
    const {
        columns,
        setFilterData,
        setSorterData,
        firstColumnKey,
        setCurrentPage,
        initialSortData,
        setActiveSorter,
        setActiveFilters,
        setCurrentPageSize,
        firstColumnCustomTitle,
    } = data

    // Setting filter data
    let filtersObj = {}
    let activeFiltersData = []
    Object.keys(filters).map(item => {
        if (filters[item]) {
            let filterKey = null
            let record = {}
            // eslint-disable-next-line no-unused-expressions
            columns
                && Array.isArray(columns)
                && columns.length > 0
                && columns.map(col => {
                    if (col.key === item) {
                        filterKey = col.backendKey
                        if (firstColumnKey === item) {
                            record = {
                                ...col,
                                title: firstColumnCustomTitle
                            }
                        } else record = col
                    }
                    return null
                })
            if (filterKey) {
                if (filters[item] !== null && typeof (filters[item][0]) === 'object') {
                    filtersObj[filterKey] = filters[item].map(a => a.value).join(',') || '';
                } else {
                    filtersObj[filterKey] = filters[item].join(',') || '';
                }
                let value = ''
                if (url === 'users' && item === 'status' && filterKey) value = filters[item][0] === 'true' ? 'Active' : 'Inactive'
                else if (url === 'stockAdjust' && item === 'type' && filterKey) value = filters[item][0] === 'DAMAGE' ? 'Damage' : 'Reconcile'
                else if (filters[item] !== null && typeof (filters[item][0]) === 'object') {
                    value = filters[item].map(a => a.label).join(',') || '';
                } else {
                    value = filtersObj[filterKey]
                }
                activeFiltersData.push({
                    value,
                    record,
                })
            }


        }
        return null
    })
    setActiveFilters([...activeFiltersData])
    setFilterData(filtersObj)

    // Setting sorter data
    if (!sorter.column && !sorter.order) setSorterData(initialSortData)
    else setSorterData(sorter.order === 'ascend' ? sorter.column.backendKey : `-${sorter.column.backendKey}`)
    setActiveSorter(sorter)

    // Setting pagination data
    setCurrentPage(pagination.current)
    setCurrentPageSize(pagination.pageSize)
}

export const clearFiltersHandler = (setFilterData, setActiveFilters) => {
    setFilterData({})
    setActiveFilters([])
    localStorage.removeItem('filterData');
}

const ActiveFilter = ({
    activeFilters = [],
    handleClearFilters,
}) => (
    <div className={`adv-table-active-filters ${activeFilters.length > 0 ? 'active' : ''}`}>
        {
            activeFilters.length > 0
            && (
                <Fragment>
                    Active Filters:
                    &nbsp;
                    {
                        activeFilters
                        && Array.isArray(activeFilters)
                        && activeFilters.map(item => (
                            item.record.title && (
                                <Tag key={item.record.title}>
                                    {item.record.title}
                                    :&nbsp;
                                    {isNaN(item.value) && item.value.split(' ').length === 1 && item.value.split('-').length === 3 && moment(item.value, 'YYYY-MM-DDTHH:mm:ss').isValid() ? moment(item.value).format('DD MMM YYYY') : item.value}
                                </Tag>
                            )
                        ))
                    }
                    &nbsp;
                    <AppButton
                        variant='link'
                        onClick={() => handleClearFilters()}
                    >
                        Clear All
                    </AppButton>
                </Fragment>
            )
        }
    </div>
)

export const AdvTable = ({
    size,
    rowKey,
    scroll,
    columns,
    loading,
    onChange,
    dataSource,
    pagination,
    rowClassName,
    rowSelection,
    activeFilters,
    components = {},
    handleClearFilters,
    expandable = {},
    pageSizeOptions = [5, 10, 20, 50],
    hideOnSinglePage
}) => (
    <Fragment>
        {activeFilters?.length ? <ActiveFilter
            activeFilters={activeFilters}
            handleClearFilters={handleClearFilters}
        /> : null}
        <Table
            id="m-table"
            size={size || 'middle'} // Size of the table
            rowKey={rowKey} // Keys of the table body rows
            columns={columns} // Table columns info
            loading={{
                spinning: !!loading, // State of loader
                indicator: <Spinner />, // Custom Loader Component
            }}
            onChange={onChange} // onChange handler
            dataSource={dataSource} // Table data
            rowClassName={rowClassName} // ClassName of the table body rows
            rowSelection={rowSelection} // Selection of row & actions related to it
            showSorterTooltip={false} // Sorter tooltip for the table header
            components={components} // Override default table components
            expandable={expandable}
            scroll={scroll || {
                y: 'max-content'
            }} // Scroll option of the table
            pagination={{
                size: 'default',
                showSizeChanger: true,
                position: ['bottomCenter'],
                pageSizeOptions: pageSizeOptions,
                hideOnSinglePage: hideOnSinglePage || false,
                ...pagination
            }} // Table pagination data
        />
    </Fragment>
)
