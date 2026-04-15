import React, { useState, useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
 Input, Button, Modal, Spin, Tooltip 
} from 'antd'
import { FilterOutlined, CopyOutlined, ExpandAltOutlined } from '@ant-design/icons'
import Tabs, { TabPane } from 'components/Tabs/Tabs'
import { AdvTable, getColumnSearchProps } from 'components/UI/AntDesignTable/AdvTable'
import Spinner from 'components/UI/Spinner/Spinner'
import { CW_SERVICE_DRISHTI_VIEW } from 'Data/constants'
import './Drishti.css'

const APP_URL = process.env.REACT_APP_APP_URL
const PAGE_SIZE = 10

const formatDate = val => (val ? new Date(val).toLocaleString() : '-')

// Datetime range filter for Start Time / End Time columns
const getDateTimeRangeFilterProps = (filterData, fromKey, toKey) => ({
    filterDropdown: ({
 setSelectedKeys, selectedKeys, confirm, clearFilters 
}) => (
        <div style={{ padding: 8, minWidth: 230 }}>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>From</div>
            <Input
                type='datetime-local'
                value={selectedKeys[0] || ''}
                onChange={e => setSelectedKeys([e.target.value, selectedKeys[1] || ''])}
                style={{ marginBottom: 8, display: 'block' }}
            />
            <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>To</div>
            <Input
                type='datetime-local'
                value={selectedKeys[1] || ''}
                onChange={e => setSelectedKeys([selectedKeys[0] || '', e.target.value])}
                style={{ marginBottom: 8, display: 'block' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
                <Button size='small' type='primary' onClick={confirm} style={{ flex: 1 }}>Filter</Button>
                <Button size='small' onClick={() => { clearFilters(); confirm() }} style={{ flex: 1 }}>Reset</Button>
            </div>
        </div>
    ),
    filterIcon: filtered => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    filteredValue: (filterData[fromKey] || filterData[toKey])
        ? [filterData[fromKey] || '', filterData[toKey] || '']
        : null,
})

const SectionTable = ({
 title, columns, data, rowKey, loading 
}) => (
    <div className='drishti_section'>
        <h6 className='drishti_section_title'>{title}</h6>
        <AdvTable
            loading={loading}
            columns={columns}
            dataSource={data || []}
            rowKey={rowKey}
            hideOnSinglePage
        />
    </div>
)

const TASK_COLUMNS = [
    {
 title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true 
},
    {
 title: 'Assignee', dataIndex: 'assignee', key: 'assignee', ellipsis: true 
},
    {
 title: 'Group', dataIndex: 'group', key: 'group', ellipsis: true 
},
    {
 title: 'Create Time', dataIndex: 'createTime', key: 'createTime', width: 160, render: formatDate 
},
    {
 title: 'End Time', dataIndex: 'endTime', key: 'endTime', width: 160, render: formatDate 
},
    {
 title: 'Delete Reason', dataIndex: 'deleteReason', key: 'deleteReason', ellipsis: true 
},
]

// --- Single process result block (used for both single and multi-result searches) ---
const ProcessResultBlock = ({ orgId, processDetails, showHeader }) => {
    const [tasks, setTasks] = useState(null)
    const [dlqJobs, setDlqJobs] = useState(null)
    const [subLoading, setSubLoading] = useState(true)

    React.useEffect(() => {
        const pid = processDetails.id
        setSubLoading(true)
        Promise.all([
            axios.get(`${APP_URL}/${orgId}/drishti/process/${pid}/tasks/`),
            axios.get(`${APP_URL}/${orgId}/drishti/process/${pid}/deadletter-jobs/`),
        ]).then(([tasksRes, dlqRes]) => {
            if (tasksRes.data.success) setTasks(tasksRes.data.data)
            if (dlqRes.data.success) setDlqJobs(dlqRes.data.data)
        }).finally(() => setSubLoading(false))
    }, [processDetails.id])

    return (
        <div className='drishti_process_block'>
            {showHeader && (
                <div className='drishti_process_block_header'>
                    <span className='drishti_process_block_id'>{processDetails.id}</span>
                </div>
            )}
            <div className='drishti_section'>
                <h6 className='drishti_section_title'>Process Details</h6>
                <table className='table table-bordered drishti_result_table'>
                    <tbody>
                        {Object.entries(processDetails).map(([key, val]) => (
                            <tr key={key}>
                                <td className='drishti_result_key'>{key}</td>
                                <td>{val !== null && val !== undefined ? String(val) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <SectionTable title='Tasks' columns={TASK_COLUMNS} data={tasks} rowKey='id' loading={subLoading} />
            <VariablesSection orgId={orgId} processId={processDetails.id} />
            <ActivitiesSection orgId={orgId} processId={processDetails.id} />
            <ProcessDLQSection orgId={orgId} data={dlqJobs} loading={subLoading} />
        </div>
    )
}

// --- Process DLQ Section (within ProcessResultBlock, mirrors DrishtiDLQ stacktrace pattern) ---
const ProcessDLQSection = ({ orgId, data, loading }) => {
    const [stacktraceModal, setStacktraceModal] = useState({ visible: false, content: '', loading: false })

    const handleViewStacktrace = async (jobId) => {
        setStacktraceModal({ visible: true, content: '', loading: true })
        try {
            const res = await axios.get(`${APP_URL}/${orgId}/drishti/jobs/deadletter/${jobId}/stacktrace/`)
            setStacktraceModal({
                visible: true,
                content: res.data.success
                    ? (res.data.data || 'No stacktrace available.')
                    : (res.data.message || 'No stacktrace available.'),
                loading: false,
            })
        } catch (err) {
            setStacktraceModal({ visible: true, content: err.response?.data?.message || 'Failed to load stacktrace.', loading: false })
        }
    }

    const columns = [
        {
 title: 'ID', dataIndex: 'id', key: 'id', ellipsis: true, width: 220 
},
        {
 title: 'Process Instance ID', dataIndex: 'processInstanceId', key: 'processInstanceId', ellipsis: true, width: 220 
},
        {
 title: 'Element Name', dataIndex: 'elementName', key: 'elementName', ellipsis: true 
},
        {
 title: 'Handler Type', dataIndex: 'handlerType', key: 'handlerType', ellipsis: true 
},
        {
 title: 'Exception Message', dataIndex: 'exceptionMessage', key: 'exceptionMessage', ellipsis: true 
},
        {
 title: 'Create Time', dataIndex: 'createTime', key: 'createTime', width: 180, render: formatDate 
},
        {
            title: 'Actions',
key: 'actions',
width: 110,
            render: (_, record) => (
                <Button size='small' onClick={() => handleViewStacktrace(record.id)}>Stacktrace</Button>
            ),
        },
    ]

    return (
        <div className='drishti_section'>
            <h6 className='drishti_section_title'>Dead Letter Jobs</h6>
            <AdvTable
                loading={loading}
                columns={columns}
                dataSource={data || []}
                rowKey='id'
                hideOnSinglePage
            />
            <Modal
                title={(
                    <div className='drishti_modal_title'>
                        <span>Exception Stacktrace</span>
                        {!stacktraceModal.loading && (
                            <Tooltip title='Copy to Clipboard'>
                                <Button
                                    size='small'
                                    icon={<CopyOutlined />}
                                    onClick={() => navigator.clipboard.writeText(stacktraceModal.content)}
                                />
                            </Tooltip>
                        )}
                    </div>
                )}
                visible={stacktraceModal.visible}
                open={stacktraceModal.visible}
                onCancel={() => setStacktraceModal({ visible: false, content: '', loading: false })}
                footer={null}
                width={800}
            >
                {stacktraceModal.loading
                    ? <div className='drishti_stacktrace_loading'><Spin /></div>
                    : <pre className='drishti_stacktrace'>{stacktraceModal.content}</pre>
                }
            </Modal>
        </div>
    )
}

const formatJson = (val) => {
    try {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val
        return JSON.stringify(parsed, null, 2)
    } catch {
        return String(val)
    }
}

// --- Variables Section (backend search by name) ---
const VariablesSection = ({ orgId, processId }) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [filterData, setFilterData] = useState({})
    const [jsonModal, setJsonModal] = useState({ visible: false, name: '', content: '' })

    const fetchVariables = async (name) => {
        setLoading(true)
        try {
            const params = name ? { name } : {}
            const res = await axios.get(`${APP_URL}/${orgId}/drishti/process/${processId}/variables/`, { params })
            if (res.data.success) setData(res.data.data || [])
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { fetchVariables('') }, [processId])

    const handleTableChange = (_, filters) => {
        const name = filters.name?.[0] || ''
        const prevName = filterData.name || ''
        if (name !== prevName) {
            setFilterData({ name })
            fetchVariables(name)
        }
    }

    const columns = useMemo(() => [
        {
 title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true, ...getColumnSearchProps(filterData, 'name', 'Variable Name') 
},
        {
            title: 'Value',
dataIndex: 'value',
key: 'value',
ellipsis: true,
            render: (val, record) => {
                const isJson = val !== null && val !== undefined && (record.type === 'json' || typeof val === 'object')
                if (isJson) {
                    const displayText = typeof val === 'string' ? val : JSON.stringify(val)
                    return (
                        <span className='drishti_json_cell'>
                            <span className='drishti_json_cell_text'>{displayText}</span>
                            <Tooltip title='View JSON'>
                                <ExpandAltOutlined
                                    className='drishti_json_expand'
                                    onClick={() => setJsonModal({ visible: true, name: record.name, content: formatJson(val) })}
                                />
                            </Tooltip>
                        </span>
                    )
                }
                return val !== null && val !== undefined ? String(val) : '-'
            },
        },
        {
 title: 'Type', dataIndex: 'type', key: 'type', width: 100 
},
        {
 title: 'Last Updated', dataIndex: 'lastUpdatedTime', key: 'lastUpdatedTime', width: 160, render: formatDate 
},
    ], [filterData])

    return (
        <div className='drishti_section'>
            <h6 className='drishti_section_title'>Variables</h6>
            <AdvTable
                loading={loading}
                columns={columns}
                dataSource={data}
                rowKey='name'
                hideOnSinglePage
                onChange={handleTableChange}
            />
            <Modal
                title={(
                    <div className='drishti_modal_title'>
                        <span>{jsonModal.name}</span>
                        <Tooltip title='Copy to Clipboard'>
                            <Button
                                size='small'
                                icon={<CopyOutlined />}
                                onClick={() => navigator.clipboard.writeText(jsonModal.content)}
                            />
                        </Tooltip>
                    </div>
                )}
                visible={jsonModal.visible}
                open={jsonModal.visible}
                onCancel={() => setJsonModal({ visible: false, name: '', content: '' })}
                footer={null}
                width={700}
            >
                <pre className='drishti_stacktrace'>{jsonModal.content}</pre>
            </Modal>
        </div>
    )
}

// --- Activities Section (backend search + pagination + datetime range filter) ---
const ActivitiesSection = ({ orgId, processId }) => {
    const [data, setData] = useState([])
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(PAGE_SIZE)
    const [loading, setLoading] = useState(false)
    const [filterData, setFilterData] = useState({})

    const fetchActivities = async (page, filters, size) => {
        setLoading(true)
        try {
            const params = { page, page_size: size }
            if (filters.activityName) params.activityName = filters.activityName
            if (filters.activityType) params.activityType = filters.activityType
            if (filters.startTimeFrom) params.startTimeFrom = filters.startTimeFrom
            if (filters.startTimeTo) params.startTimeTo = filters.startTimeTo
            if (filters.endTimeFrom) params.endTimeFrom = filters.endTimeFrom
            if (filters.endTimeTo) params.endTimeTo = filters.endTimeTo
            const res = await axios.get(`${APP_URL}/${orgId}/drishti/process/${processId}/activities/`, { params })
            if (res.data.success) {
                const d = res.data.data?.data ?? res.data.data
                setData(Array.isArray(d) ? d : [])
                setTotal(res.data.data?.total || 0)
            }
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { fetchActivities(1, {}, PAGE_SIZE) }, [processId])

    const handleTableChange = (pagination, filters) => {
        const newFilters = {}
        if (filters.activityName?.[0]) newFilters.activityName = filters.activityName[0]
        if (filters.activityType?.[0]) newFilters.activityType = filters.activityType[0]
        if (filters.startTime?.[0]) newFilters.startTimeFrom = filters.startTime[0]
        if (filters.startTime?.[1]) newFilters.startTimeTo = filters.startTime[1]
        if (filters.endTime?.[0]) newFilters.endTimeFrom = filters.endTime[0]
        if (filters.endTime?.[1]) newFilters.endTimeTo = filters.endTime[1]
        setFilterData(newFilters)
        setCurrentPage(pagination.current)
        setPageSize(pagination.pageSize)
        fetchActivities(pagination.current, newFilters, pagination.pageSize)
    }

    const columns = useMemo(() => [
        {
 title: 'Activity Name', dataIndex: 'activityName', key: 'activityName', ellipsis: true, ...getColumnSearchProps(filterData, 'activityName', 'Activity Name') 
},
        {
 title: 'Type', dataIndex: 'activityType', key: 'activityType', ellipsis: true, ...getColumnSearchProps(filterData, 'activityType', 'Activity Type') 
},
        {
 title: 'Assignee', dataIndex: 'assignee', key: 'assignee', ellipsis: true 
},
        {
            title: 'Start Time',
dataIndex: 'startTime',
key: 'startTime',
width: 200,
render: formatDate,
            ...getDateTimeRangeFilterProps(filterData, 'startTimeFrom', 'startTimeTo'),
        },
        {
            title: 'End Time',
dataIndex: 'endTime',
key: 'endTime',
width: 200,
render: formatDate,
            ...getDateTimeRangeFilterProps(filterData, 'endTimeFrom', 'endTimeTo'),
        },
        {
 title: 'Delete Reason', dataIndex: 'deleteReason', key: 'deleteReason', ellipsis: true 
},
    ], [filterData])

    return (
        <div className='drishti_section'>
            <h6 className='drishti_section_title'>Activities</h6>
            <AdvTable
                loading={loading}
                columns={columns}
                dataSource={data}
                rowKey='id'
                pagination={{ total, current: currentPage, pageSize, showSizeChanger: true }}
                onChange={handleTableChange}
            />
        </div>
    )
}

const VARIABLE_RESULT_COLUMNS = (onDetail) => [
    {
 title: 'Process ID', dataIndex: 'id', key: 'id', ellipsis: true, width: 280, render: val => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{val}</span>
},
    { title: 'Process Definition ID', dataIndex: 'processDefinitionId', key: 'processDefinitionId', ellipsis: true },
    {
 title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true 
},
    {
 title: 'Start Time', dataIndex: 'startTime', key: 'startTime', width: 160, render: formatDate 
},
    {
 title: 'End Time', dataIndex: 'endTime', key: 'endTime', width: 160, render: formatDate 
},
    {
 title: 'Delete Reason', dataIndex: 'deleteReason', key: 'deleteReason', ellipsis: true 
},
    {
        title: 'Actions',
key: 'actions',
width: 80,
        render: (_, record) => (
            <Button size='small' type='primary' onClick={() => onDetail(record.id)}>Detail</Button>
        ),
    },
]

// --- Search Tab ---
const DrishtiSearch = ({ orgId }) => {
    const location = useLocation()
    const [searchId, setSearchId] = useState('')
    const [variableName, setVariableName] = useState('')
    const [variableValue, setVariableValue] = useState('')
    const [searchType, setSearchType] = useState('process_id')
    const [loading, setLoading] = useState(false)
    const [processResults, setProcessResults] = useState([])
    const [resultMode, setResultMode] = useState('detail') // 'detail' | 'list'
    const [error, setError] = useState('')

    const resetInputs = () => { setSearchId(''); setVariableName(''); setVariableValue('') }
    const clearResults = () => { setProcessResults([]); setError('') }

    // Core search — takes explicit params so it can be called from useEffect too
    const doSearch = async (type, id, varName, varVal) => {
        setLoading(true)
        setProcessResults([])
        setError('')
        try {
            let params
            if (type === 'variable') {
                params = { variableName: varName }
                if (varVal) params.variableValue = varVal
            } else {
                params = { [type]: id }
            }
            const res = await axios.get(`${APP_URL}/${orgId}/drishti/process/`, { params })
            if (!res.data.success) { setError(res.data.message || 'Not found.'); return }
            const data = res.data.data
            setResultMode(type === 'variable' ? 'list' : 'detail')
            setProcessResults(Array.isArray(data) ? data : [data])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch.')
        } finally {
            setLoading(false)
        }
    }

    // Auto-search when opened via Detail button (URL has ?process_id=xxx)
    React.useEffect(() => {
        const params = new URLSearchParams(location.search)
        const pid = params.get('process_id')
        if (pid) {
            setSearchId(pid)
            setSearchType('process_id')
            doSearch('process_id', pid)
        }
    }, [])

    const handleSearch = () => {
        if (searchType === 'variable') {
            if (!variableName.trim()) { setError('Please enter a Variable Name.'); return }
        } else if (!searchId.trim()) { setError('Please enter an ID to search.'); return }
        doSearch(searchType, searchId.trim(), variableName.trim(), variableValue.trim())
    }

    const switchType = (type) => { setSearchType(type); clearResults(); resetInputs() }

    const openDetail = (pid) => {
        window.open(`${window.location.pathname}?process_id=${pid}`, '_blank')
    }

    return (
        <div className='drishti_tab_content'>
            {loading && <Spinner />}
            <div className='drishti_search_type_row'>
                <label className='drishti_radio_label'>
                    <input type='radio' value='process_id' checked={searchType === 'process_id'} onChange={() => switchType('process_id')} />
                    &nbsp;Process Instance ID
                </label>
                <label className='drishti_radio_label'>
                    <input type='radio' value='task_id' checked={searchType === 'task_id'} onChange={() => switchType('task_id')} />
                    &nbsp;Task ID
                </label>
                <label className='drishti_radio_label'>
                    <input type='radio' value='variable' checked={searchType === 'variable'} onChange={() => switchType('variable')} />
                    &nbsp;Variable
                </label>
            </div>

            {searchType === 'variable' ? (
                <div className='drishti_search_row'>
                    <Input
                        className='drishti_search_input'
                        placeholder='Variable Name'
                        value={variableName}
                        onChange={e => setVariableName(e.target.value)}
                        onPressEnter={handleSearch}
                    />
                    <Input
                        className='drishti_search_input'
                        placeholder='Variable Value (optional)'
                        value={variableValue}
                        onChange={e => setVariableValue(e.target.value)}
                        onPressEnter={handleSearch}
                    />
                    <Button type='primary' onClick={handleSearch}>Search</Button>
                </div>
            ) : (
                <div className='drishti_search_row'>
                    <Input
                        className='drishti_search_input'
                        placeholder={searchType === 'process_id' ? 'Enter Process Instance ID' : 'Enter Task ID'}
                        value={searchId}
                        onChange={e => setSearchId(e.target.value)}
                        onPressEnter={handleSearch}
                    />
                    <Button type='primary' onClick={handleSearch}>Search</Button>
                </div>
            )}

            {error && <p className='drishti_error'>{error}</p>}

            {processResults.length > 0 && resultMode === 'list' && (
                <div className='drishti_results'>
                    <p className='drishti_result_count'>
Found
{processResults.length}
{' '}
process
{processResults.length > 1 ? 'es' : ''}
                    </p>
                    <AdvTable
                        columns={VARIABLE_RESULT_COLUMNS(openDetail)}
                        dataSource={processResults}
                        rowKey='id'
                        hideOnSinglePage
                    />
                </div>
            )}

            {processResults.length > 0 && resultMode === 'detail' && (
                <div className='drishti_results'>
                    {processResults.map(proc => (
                        <ProcessResultBlock key={proc.id} orgId={orgId} processDetails={proc} showHeader={false} />
                    ))}
                </div>
            )}
        </div>
    )
}

// --- Async Jobs Tab ---
const ASYNC_JOB_COLUMNS = [
    {
 title: 'ID', dataIndex: 'id', key: 'id', ellipsis: true, width: 220 
},
    {
 title: 'Process Instance ID', dataIndex: 'processInstanceId', key: 'processInstanceId', ellipsis: true, width: 220 
},
    {
 title: 'Element Name', dataIndex: 'elementName', key: 'elementName', ellipsis: true 
},
    {
 title: 'Handler Type', dataIndex: 'handlerType', key: 'handlerType', ellipsis: true 
},
    {
 title: 'Retries', dataIndex: 'retries', key: 'retries', width: 80 
},
    {
 title: 'Exception Message', dataIndex: 'exceptionMessage', key: 'exceptionMessage', ellipsis: true 
},
    {
 title: 'Create Time', dataIndex: 'createTime', key: 'createTime', width: 180, render: val => (val ? new Date(val).toLocaleString() : '-') 
},
    {
 title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', width: 180, render: val => (val ? new Date(val).toLocaleString() : '-') 
},
]

const DrishtiAsyncJobs = ({ orgId }) => {
    const [data, setData] = useState([])
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(PAGE_SIZE)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchJobs = async (page, size) => {
        setLoading(true)
        setError('')
        try {
            const res = await axios.get(`${APP_URL}/${orgId}/drishti/jobs/`, {
                params: { page, page_size: size },
            })
            if (res.data.success) {
                setData(res.data.data.data || [])
                setTotal(res.data.data.total || 0)
            } else {
                setError(res.data.message || 'Failed to fetch jobs.')
                setData([])
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch jobs.')
            setData([])
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { fetchJobs(1, PAGE_SIZE) }, [orgId])

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current)
        setPageSize(pagination.pageSize)
        fetchJobs(pagination.current, pagination.pageSize)
    }

    return (
        <div className='drishti_tab_content'>
            {loading && <Spinner />}
            {error && <p className='drishti_error'>{error}</p>}
            <AdvTable
                loading={loading}
                columns={ASYNC_JOB_COLUMNS}
                dataSource={data}
                rowKey='id'
                pagination={{ total, current: currentPage, pageSize, showSizeChanger: true }}
                onChange={handleTableChange}
            />
        </div>
    )
}

// --- DLQ Tab ---
const DrishtiDLQ = ({ orgId }) => {
    const [data, setData] = useState([])
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(PAGE_SIZE)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [filterData, setFilterData] = useState({})
    const [stacktraceModal, setStacktraceModal] = useState({ visible: false, content: '', loading: false })

    const fetchJobs = async (page, processId, size) => {
        setLoading(true)
        setError('')
        try {
            const params = { page, page_size: size }
            if (processId) params.process_id = processId
            const res = await axios.get(`${APP_URL}/${orgId}/drishti/jobs/deadletter/`, { params })
            if (res.data.success) {
                setData(res.data.data.data || [])
                setTotal(res.data.data.total || 0)
            } else {
                setError(res.data.message || 'Failed to fetch dead letter jobs.')
                setData([])
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch dead letter jobs.')
            setData([])
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { fetchJobs(1, undefined, PAGE_SIZE) }, [orgId])

    const handleTableChange = (pagination, filters) => {
        const newFilterData = {}
        Object.keys(filters).forEach(key => {
            if (filters[key]) newFilterData[key] = filters[key][0]
        })
        setFilterData(newFilterData)
        setCurrentPage(pagination.current)
        setPageSize(pagination.pageSize)
        fetchJobs(pagination.current, newFilterData.processInstanceId, pagination.pageSize)
    }

    const handleViewStacktrace = async (jobId) => {
        setStacktraceModal({ visible: true, content: '', loading: true })
        try {
            const res = await axios.get(`${APP_URL}/${orgId}/drishti/jobs/deadletter/${jobId}/stacktrace/`)
            setStacktraceModal({
                visible: true,
                content: res.data.success
                    ? (res.data.data || 'No stacktrace available.')
                    : (res.data.message || 'No stacktrace available.'),
                loading: false,
            })
        } catch (err) {
            setStacktraceModal({ visible: true, content: err.response?.data?.message || 'Failed to load stacktrace.', loading: false })
        }
    }

    const dlqColumns = [
        {
            title: 'Process Instance ID',
            dataIndex: 'processInstanceId',
            key: 'processInstanceId',
            ellipsis: true,
            width: 220,
            ...getColumnSearchProps(filterData, 'processInstanceId', 'Process Instance ID'),
        },
        {
 title: 'Element Name', dataIndex: 'elementName', key: 'elementName', ellipsis: true 
},
        {
 title: 'Handler Type', dataIndex: 'handlerType', key: 'handlerType', ellipsis: true 
},
        {
 title: 'Exception Message', dataIndex: 'exceptionMessage', key: 'exceptionMessage', ellipsis: true 
},
        {
 title: 'Create Time', dataIndex: 'createTime', key: 'createTime', width: 180, render: val => (val ? new Date(val).toLocaleString() : '-') 
},
        {
            title: 'Actions',
            key: 'actions',
            width: 110,
            render: (_, record) => (
                <Button size='small' onClick={() => handleViewStacktrace(record.id)}>
                    Stacktrace
                </Button>
            ),
        },
    ]

    return (
        <div className='drishti_tab_content'>
            {loading && <Spinner />}
            {error && <p className='drishti_error'>{error}</p>}
            <AdvTable
                loading={loading}
                columns={dlqColumns}
                dataSource={data}
                rowKey='id'
                pagination={{ total, current: currentPage, pageSize, showSizeChanger: true }}
                onChange={handleTableChange}
            />
            <Modal
                title={(
                    <div className='drishti_modal_title'>
                        <span>Exception Stacktrace</span>
                        {!stacktraceModal.loading && (
                            <Tooltip title='Copy to Clipboard'>
                                <Button
                                    size='small'
                                    icon={<CopyOutlined />}
                                    onClick={() => navigator.clipboard.writeText(stacktraceModal.content)}
                                />
                            </Tooltip>
                        )}
                    </div>
                )}
                visible={stacktraceModal.visible}
                open={stacktraceModal.visible}
                onCancel={() => setStacktraceModal({ visible: false, content: '', loading: false })}
                footer={null}
                width={800}
            >
                {stacktraceModal.loading
                    ? <div className='drishti_stacktrace_loading'><Spin /></div>
                    : <pre className='drishti_stacktrace'>{stacktraceModal.content}</pre>
                }
            </Modal>
        </div>
    )
}

// --- Main Drishti Page ---
const Drishti = () => {
    const { uuid: orgId } = useParams()
    const [activeTab, setActiveTab] = useState('Process Instance Overview')

    return (
        <div className='main_changable_container drishti_page'>
            <Tabs
                showSelectBackground
                activeTabKey={activeTab}
                onSwitchTab={tab => setActiveTab(tab.key || tab.title)}
                className='drishti_tabs_bar'
            >
                <TabPane title='Process Instance Overview' key='Process Instance Overview' permissions={[CW_SERVICE_DRISHTI_VIEW]}>
                    <DrishtiSearch orgId={orgId} />
                </TabPane>
                <TabPane title='Async Jobs' key='Async Jobs' permissions={[CW_SERVICE_DRISHTI_VIEW]}>
                    <DrishtiAsyncJobs orgId={orgId} />
                </TabPane>
                <TabPane title='DLQ' key='DLQ' permissions={[CW_SERVICE_DRISHTI_VIEW]}><DrishtiDLQ orgId={orgId} /></TabPane>
            </Tabs>
        </div>
    )
}

export default Drishti
