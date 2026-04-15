/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment,
    useState,
    useEffect,
} from 'react'
import { connect } from 'react-redux'
import { Drawer, DatePicker, Select, InputNumber, TimePicker, Button, Input } from 'antd'
import axios from 'axios'
import { useParams } from 'react-router-dom'

import { addToast } from 'components/Toast/actions'
import Spinner from 'components/UI/Spinner/Spinner'
import moment from 'moment';
import 'antd/dist/antd.css'
import './DrawerFilter.css'

const { Option } = Select;
const APP_URL = process.env.REACT_APP_APP_URL;
const { RangePicker } = DatePicker;

const ranges = {
    Today: [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'day'), moment().subtract(1, 'day')],
    'Tomorrow': [moment().add(1, 'day'), moment().add(1, 'day')],
    'Next 7 days': [moment(), moment().add(7, 'days')],
    'Last 7 days': [moment().subtract(7, 'days'),moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
    'Next Month': [moment().add(1, 'month').startOf('month'), moment().add(1, 'month').endOf('month')],
}

const DrawerFilter = props => {
    const {
        addToaster,
        showFilter,
        onCloseHandler,
        filters = {},
        setFilters,
        type,
        applyFilter,
        mappedFields = {},
        locations: jobLocations 
    } = props
    const { uuid: orgId } = useParams();
    const [loader, setLoader] = useState(false)
    const [jobRoles, setJobRoles] = useState(null)
    const [locations, setLocations] = useState(null)
    const [users, setUsers] = useState(null);
    const [sourcingPartners, setSourcingPartners] = useState(null)
    const [jobs, setJobs] = useState();
    const [languages, setLanguages] = useState(null);
    const [count, setCount] = useState(0);
    const [error, setError] = useState({});
    const fetchJobs = (search) => {
        let url = `${APP_URL}/${orgId}/jobs/`
        if (search) {
            url += `?page=1&page_count=10&job_id__icontains=${search}`
        } else {
            url += `?page=1&page_count=10`
        }
        axios.get(url)
            .then(res => {
                if (res.data.data) setJobs(res.data.data)
            })
            .catch(err => {
                setJobs([])
                if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                else addToaster('error', 'Error', 'Something went wrong')
            })
            .finally(() => {
                setCount(count=>count-1)
                if (count === 0) setLoader(false)
            })
    }

    // Get all locations
    function fetchLocations(search) {
        let url = `${APP_URL}/${orgId}/locations/`
        if (search) {
            url += `?page=1&page_count=10&name__icontains=${search}`
        } else {
            url += `?page=1&page_count=10`
        }
        axios.get(url)
            .then(res => {
                if (res.data.data) setLocations(res.data.data)
            })
            .catch(err => {
                setLocations([])
                if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                else addToaster('error', 'Error', 'Something went wrong')
            }).finally(() => {
                setCount(count=>count-1)
                if (count === 0) setLoader(false)
            })
    }
    function fetchLangauges() {
        const url = `${APP_URL}/${orgId}/lists/?name=Language`
        axios.get(url)
            .then(res => {
                if (res.data.data?.length) setLanguages(res.data.data[0]?.list)
            })
            .catch(err => {
                setLanguages([])
                if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                else addToaster('error', 'Error', 'Something went wrong')
            }).finally(() => {
                setCount(count=>count-1)
                if (count === 0) setLoader(false)
            })
    }

    // Get all job roles
    function fetchRoles(search) {
        let url = `${APP_URL}/${orgId}/jobs/role`
        if (search) {
            url += `?page=1&page_count=10&name__icontains=${search}`
        } else {
            url += `?page=1&page_count=10`
        }
        axios.get(url)
            .then(res => {
                if (res.data.data) setJobRoles(res.data.data)
            })
            .catch(err => {
                setJobRoles([])
                if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                else addToaster('error', 'Error', 'Something went wrong')
            })
            .finally(() => {
                setCount(count=>count-1)
                if (count === 0) setLoader(false)
            })
    }

    // Get all sourcing partners
    function fetchSources(search) {
        let url = `${APP_URL}/${orgId}/jobs/hiring_partner`
        if (search) {
            url += `?page=1&page_count=10&name__icontains=${search}`
        } else {
            url += `?page=1&page_count=10`
        }
        axios.get(url)
            .then(res => {
                if (res.data.data) setSourcingPartners(res.data.data)
            })
            .catch(err => {
                setSourcingPartners([])
                if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                else addToaster('error', 'Error', 'Something went wrong')
            })
            .finally(() => {
                setCount(count=>count-1)
                if (count === 0) setLoader(false)
            })
    }

    //Get all users 
    function fetchUsers(search) {
        let url = `${APP_URL}/${orgId}/users/org_users?type=active&ordering=first_name`;
        if (search) {
            url += `&page=1&page_count=10&first_name__icontains=${search}`
        } else {
            url += `&page=1&page_count=10`
        }
        axios.get(url)
            .then(res => {
                if (res.data.data) setUsers(res.data.data)
            })
            .catch(err => {
                setSourcingPartners([])
                if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                else addToaster('error', 'Error', 'Something went wrong')
            })
            .finally(() => {
                setCount(count=>count-1)
                if (count === 0) setLoader(false)
            })
    }

    useEffect(() => {

        if (showFilter) {
            // Conditionally performing the api calls
            // Perform respective api call only at the first time
            let loaderCount = count
            if (
                locations === null
                || jobRoles === null
                || sourcingPartners === null
                || users === null
                || languages === null
            ) setLoader(true)   
            if(jobLocations?.length){
                setLocations(jobLocations)
            }else{
                if (locations === null) {fetchLocations();loaderCount++}
            }
            if (jobRoles === null) {fetchRoles();loaderCount++}
            if (sourcingPartners === null) {fetchSources();loaderCount++}
            if (users === null) {fetchUsers();loaderCount++}
            if (languages === null) {fetchLangauges();loaderCount++}
            setCount(loaderCount);

        }
    }, [orgId, showFilter])

    const handleApplyFilter = () => {
        let newState = filters
        Object.keys(newState).forEach((k) => {
            // checking chartData keys values .if all are empty then, apply button must disable
            if (newState[k]?.length === 0) {
                delete newState[k];
            }
        })
        setFilters(newState)
        if (Object.keys(newState).length) {
            localStorage.setItem('filterData', JSON.stringify({ ...newState, key: type }));
        } else {
            localStorage.removeItem('filterData');
        }
        if(!filters.stage && (filters.date_of_action_from?.length || filters.date_of_action_from?.length || filters.actor?.length)){
            setError({stage:'Please select a stage'});
            return
        }              
        setError({})
        applyFilter(newState);
        onCloseHandler()
    }

    const handleClearFilter = () => {
        setFilters({});
        applyFilter({});
        onCloseHandler()
        localStorage.removeItem('filterData');
    }
    // useEffect(() => {
    //     if (Object.keys(existingFilters).length === 0 && Object.keys(filters).length) {
    //         setFilters({});
    //     }
    // }, [existingFilters])

    useEffect(() => {
        let filterData = localStorage.getItem('filterData');
        if (filterData && type) {
            filterData = JSON.parse(filterData);
            if (filterData.key === type) {
                delete filterData['key'];
                setFilters(filterData);
                applyFilter(filterData);
            } else {
                localStorage.removeItem('filterData');
            }
        }
    }, []);
    
    return (
        <Fragment>
            {loader && <Spinner />}
            <Drawer
                className={'drawer-custom'}
                width={600}
                title='Filters'
                placement='right'
                visible={showFilter}
                onClose={onCloseHandler}
                headerStyle={{ fontSize: '20px' }}
            >
                <div className='drawer-filter'>
                    <div className='drawer-filter-sections'>
                        <div className='d-flex flex-wrap ml-0'>
                        {mappedFields['status'] && mappedFields['status']['multiple'] !== false  && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['status']['label']}</p>
                                <Select
                                    mode={"multiple"}
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    maxTagCount={1}
                                    onClear={()=>setFilters({...filters, status:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, status: [...filters.status || [], {value:a.value, label:a['children']}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, status: [...filters.status?.filter?.(item=>item.value!==x)]})}
                                    value={ filters.status && filters.status?.map(i=>i.value)}
                                    style={{
                                        width: '100%',
                                    }}
                                    allowClear
                                >
                                    {mappedFields['status']['options']?.map((option) => <Option value={option['value']}>{option['text']}</Option>)}
                                </Select>
                            </div>}     
                            {mappedFields['status'] && mappedFields['status']['multiple'] === false  && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['status']['label']}</p>
                                <Select
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    maxTagCount={1}
                                    onClear={()=>setFilters({...filters, status:[]})}
                                    onChange={(e) => setFilters({ ...filters, status: e ? [e] : []})}
                                    value={filters.status && filters.status[0]}
                                    style={{
                                        width: '100%',
                                    }}
                                    allowClear
                                >
                                    {mappedFields['status']['options']?.map((option) => <Option value={option['value']}>{option['text']}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['stage'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['stage']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    maxTagCount={1}
                                    onSelect={(x,a)=>{setFilters({ ...filters, stage: [...filters.stage || [], {value:a.value, label:a['children']}]});setError({})}}
                                    onDeselect={(x)=>{setFilters({ ...filters, stage: [...filters.stage?.filter?.(item=>item.value!==x)]});setError({})}}
                                    onClear={()=>setFilters({...filters, stage:[]})}
                                    value={filters.stage && filters.stage?.map(i=>i.value)}
                                    style={{
                                        width: '100%',
                                    }}
                                    allowClear
                                >
                                    {mappedFields['stage']['options']?.map((option) => <Option value={option['value']}>{option['text']}</Option>)}
                                </Select>
                                <p className={'text-danger m-0'}>{error.stage}</p>
                            </div>}
                            {mappedFields['jobRole'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['jobRole']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    maxTagCount={1}
                                    value={filters.jobRole && filters.jobRole || []}
                                    onSearch={val => fetchRoles(val)}
                                    onChange={(e) => setFilters({ ...filters, jobRole: e?.length ? e : []  })}
                                    style={{
                                        width: '100%',
                                    }}
                                    allowClear
                                >
                                    {jobRoles?.map((roles) => <Option value={roles.name}>{roles.name}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['work_city'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['work_city']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    onSearch={val => !jobLocations && fetchLocations(val)}
                                    onFocus={() => !jobLocations && fetchLocations()}
                                    value={filters.work_city || []}
                                    onChange={(e) => setFilters({ ...filters, work_city: e?.length ? e : [] })}
                                    allowClear
                                >
                                    {locations?.map((location) => <Option value={location.name}>{location.name}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['jobType'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['jobType']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    onClear={()=>setFilters({...filters, jobType:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, jobType: [...filters.jobType || [], {value:a.value, label:a['children']}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, jobType: [...filters.jobType?.filter?.(item=>item.value!==x)]})}
                                    value={filters.jobType && filters.jobType?.map(i=>i.value)}
                                    allowClear
                                >
                                     {[{ key: 'Part', label: 'Part time' }, { key: 'Full', label: 'Full time' }, { key: 'Contract', label: 'Contract' }]?.map((option) => <Option value={option.key}>{option.label}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['documents'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['documents']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    onClear={()=>setFilters({...filters, documents:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, documents: [...filters.documents || [], {value:a.value, label:a['children']}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, documents: [...filters.documents?.filter?.(item=>item.value!==x)]})}
                                    value={filters.documents && filters.documents?.map(i=>i.value)}
                                    allowClear
                                >
                                    {[{ value: 'aadhaar', text: 'Aadhaar' },
                                    { value: 'voterId', text: 'Voter ID' },
                                    { value: 'drivingLicense', text: 'Driving License' },
                                    { value: 'pan', text: 'PAN' },
                                    { value: 'bankPassbook', text: 'Bank Passbook' }]
                                        .map((items) => <Option value={items.value}>{items.text}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['assets'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['assets']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    onClear={()=>setFilters({...filters, assets:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, assets: [...filters.assets || [], {value:a.value, label:a['children']}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, assets: [...filters.assets?.filter?.(item=>item.value!==x)]})}
                                    value={filters.assets && filters.assets?.map(i=>i.value)}
                                    allowClear
                                >
                                    {[{ value: 'Bike', text: 'Bike' },
                                    { value: 'Smartphone', text: 'Smartphone' },
                                    { value: 'Laptop', text: 'Laptop' },]
                                        .map((items) => <Option value={items.value}>{items.text}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['openings'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['openings']['label']}</p>
                                <Input maxLength={7}
                                    className={`drawer-select ${error.openings && `errorField`}`}
                                    placeholder={'Openings'}
                                    controls={false}
                                    style={{
                                        width: '100%',
                                    }}
                                    status={'error'}
                                    value={filters.openings && filters.openings[0]}
                                    onChange={(e) => {
                                        let value = e.target.value ;
                                        setFilters({ ...filters, openings: value ? [value] : []})
                                        if(value && (isNaN(value) || value == 0)){
                                            setError({openings:'Please enter valid number'});
                                        }else{
                                            setError({openings:''});
                                        }
                                    }} />
                                <p className={'text-danger m-0'}>{error.openings}</p>
                            </div>}
                            {mappedFields['gender'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['gender']['label']}</p>
                                <Select
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    onClear={()=>setFilters({...filters, gender:[]})}
                                    onChange={(e) => setFilters({ ...filters, gender: e ? [e] : []})}
                                    value={filters.gender && filters.gender[0]}
                                    allowClear
                                >
                                    <Option value="Male">Male</Option>
                                    <Option value="Female">Female</Option>
                                </Select>
                            </div>}
                            {mappedFields['age'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['age']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    onChange={(e) => setFilters({ ...filters, age: e?.length ? e : []  })}
                                    value={filters.age && filters.age || []}
                                    allowClear
                                >
                                    {["18-25", "26-30", "31-35", "36-45", "45+"].map((age) => <Option value={age}>{age}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['language'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['language']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    onChange={(e) => setFilters({ ...filters, language: e?.length ? e : []  })}
                                    value={filters.language && filters.language || []}
                                    allowClear
                                >
                                    {languages?.map((language) => <Option value={language.key}>{language.value}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['teams'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['teams']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    onBlur={()=>fetchUsers()}
                                    onSearch={val => fetchUsers(val)}
                                    onClear={()=>setFilters({...filters, teams:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, teams: [...filters.teams || [], {value:a.value, label:a['children']?.join(' ')}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, teams: [...filters.teams?.filter?.(item=>item.value!==x)]})}
                                    value={filters.teams && filters.teams?.map(i=>i.value)}
                                    allowClear
                                >
                                    {users?.map((user) => <Option value={user.email}>{user.first_name} {user.last_name}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['actor'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['actor']['label']}</p>
                                <Select
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    mode="multiple"
                                    maxTagCount={1}
                                    onBlur={()=>fetchUsers()}
                                    onSearch={val => fetchUsers(val)}
                                    onClear={()=>setFilters({...filters, actor:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, actor: [...filters.actor || [], {value:a.value, label:a['children']?.join(' ')}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, actor: [...filters.actor?.filter?.(item=>item.value!==x)]})}
                                    value={filters.actor && filters.actor?.map(i=>i.value)}
                                    allowClear
                                >
                                    {users?.map((user) => <Option value={user.email}>{user.first_name} {user.last_name}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['vendor'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['vendor']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    onSearch={val => fetchSources(val)}
                                    onClear={()=>setFilters({...filters, vendor:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, vendor: [...filters.vendor || [], {value:a.value, label:a['children']}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, vendor: [...filters.vendor?.filter?.(item=>item.value!==x)]})}
                                    value={filters.vendor && filters.vendor?.map(i=>i.value)}
                                    allowClear
                                >
                                    {sourcingPartners?.map((sourcingPartners) => <Option value={sourcingPartners?.name}>{sourcingPartners?.name}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['job'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['job']['label']}</p>
                                <Select
                                    className={'drawer-select'}
                                    filterOption={false}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    showSearch
                                    onFocus={()=>fetchJobs()}
                                    onSearch={val => fetchJobs(val)}
                                    value={filters.job && filters.job || []}
                                    allowClear
                                    onChange={(e) => setFilters({ ...filters, job: e?.length ? e : []  })}
                                >
                                    {jobs?.map((job) => <Option value={job?.job_id}>{job?.job_id}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['education'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['education']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    allowClear
                                    onSearch={val => fetchUsers(val)}
                                    onClear={()=>setFilters({...filters, education:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, education: [...filters.education || [], {value:a.value, label:a['children']}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, education: [...filters.education?.filter?.(item=>item.value!==x)]})}
                                    value={filters.education && filters.education?.map(i=>i.value)}
                                >
                                    {[{ key: '8', label: '8th' }, { key: '10', label: '10th' }, { key: '12', label: '12th' }, { key: 'Graduate', label: 'Graduate' }]?.map((sourcingPartners) => <Option value={sourcingPartners.key}>{sourcingPartners.label}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['created_by'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['created_by']['label']}</p>
                                <Select
                                    mode="multiple"
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    maxTagCount={1}
                                    allowClear
                                    onClear={()=>setFilters({...filters, created_by:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, created_by: [...filters.created_by || [], {value:a.value, label:a['children']}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, created_by: [...filters.created_by?.filter?.(item=>item.value!==x)]})}
                                    value={filters.created_by && filters.created_by?.map(i=>i.value)}
                                >
                                    {[{ key: 'Referral,Walkin', label: 'Internal Team' }, { key: 'Sourced', label: 'Vendor' }]?.map((option) => <Option value={option.key}>{option.label}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['ExpType'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['ExpType']['label']}</p>
                                <Select
                                    className={'drawer-select'}
                                    placeholder={'Select'}
                                    style={{
                                        width: '100%',
                                    }}
                                    allowClear
                                    onClear={()=>setFilters({...filters, ExpType:[]})}
                                    onSelect={(x,a)=>setFilters({ ...filters, ExpType: [...filters.ExpType || [], {value:a.value, label:a['children']}]})}
                                    onDeselect={(x)=>setFilters({ ...filters, ExpType: [...filters.ExpType?.filter?.(item=>item.value!==x)]})}
                                    value={filters.ExpType && filters.ExpType?.map(i=>i.value)}
                                >
                                    {[{ key: 'Fresher', label: 'Fresher' }, { key: 'Experienced', label: 'Experienced' }]?.map((sourcingPartners) => <Option value={sourcingPartners.key}>{sourcingPartners.label}</Option>)}
                                </Select>
                            </div>}
                            {mappedFields['shiftStart'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>Shift</p>
                                <div className='d-flex'>
                                    <div className='col-md-6 pl-0 pr-2'>
                                        <TimePicker value={filters.shiftStart && moment(filters.shiftStart[0], 'HH:mm:ss')}
                                            showNow={false}
                                            placeholder={'Starts'}
                                            onChange={(e) => setFilters({ ...filters, shiftStart: [e.format('HH:mm:ss')], shiftEnd: [moment(e.add(1, 'hour'), 'HH:mm:ss').format('HH:mm:ss')] })}
                                            defaultOpenValue={moment('00:00:00', 'HH:mm:ss')} />
                                    </div>
                                    <div className='col-md-6 pl-0 ml-2 pr-2'>
                                        <TimePicker value={filters.shiftEnd && moment(filters.shiftEnd[0], 'HH:mm:ss')}
                                            showNow={false}
                                            placeholder={'Ends'}
                                            onChange={(e) => {
                                                if (filters.shiftStart[0] && e.isAfter(moment(filters.shiftStart[0], 'HH:mm:ss'))) {
                                                    setFilters({ ...filters, shiftEnd: [e.format('HH:mm:ss')] })
                                                }
                                            }}
                                            defaultOpenValue={moment('00:00:00', 'HH:mm:ss')} />
                                    </div>
                                </div>
                            </div>}
                            {mappedFields['MinSalary'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>Salary</p>
                                <div className='d-flex'>
                                    <div className='col-md-6 pl-0 pr-2'>
                                        <InputNumber min={1} max={filters.MaxSalary ? filters.MaxSalary[0] - 1 : 2147483647}
                                            className={'drawer-select'}
                                            placeholder={'Minimum'}
                                            controls={false}
                                            style={{
                                                width: '100%',
                                            }}
                                            value={filters.MinSalary && filters.MinSalary[0]}
                                            onChange={(e) => setFilters({ ...filters, MinSalary: e ? [e] : []})} />
                                    </div>
                                    <div className='col-md-6 pl-0 ml-2 pr-2'>
                                        <InputNumber min={filters.MinSalary ? filters.MinSalary[0] + 1 : 1} max={2147483647}
                                            className={'drawer-select'}
                                            placeholder={'Maximum'}
                                            controls={false}
                                            style={{
                                                width: '100%',
                                            }}
                                            value={filters.MaxSalary && filters.MaxSalary[0]}
                                            onChange={(e) => setFilters({ ...filters, MaxSalary: e ? [e] : []})}
                                        />
                                    </div>
                                </div>
                            </div>}
                            {mappedFields['MinExp'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>Experience years range</p>
                                <div className='d-flex'>
                                    <div className='col-md-6 pl-0 pr-2'>
                                        <Select
                                            className={'drawer-select'}
                                            placeholder={'Minimum'}
                                            style={{
                                                width: '100%',
                                            }}
                                            value={filters.MinExp && filters.MinExp[0]}
                                            allowClear
                                            onChange={(e) => setFilters({ ...filters, MinExp: [e] })}
                                        >
                                            {Array.from(Array(15).keys())?.map(i => !(filters['MaxExp'] && filters['MaxExp'] <= i) && <Option value={i}>{i} yrs</Option>)}
                                        </Select>
                                    </div>
                                    <div className='col-md-6 pl-0 ml-2 pr-2'>
                                        <Select
                                            className={'drawer-select'}
                                            placeholder={'Maximum'}
                                            style={{
                                                width: '100%',
                                            }}
                                            value={filters.MaxExp && filters.MaxExp[0]}
                                            allowClear
                                            onChange={(e) => setFilters({ ...filters, MaxExp: [e] })}
                                        >
                                            {Array.from(Array(15).keys())?.map(i => !(filters['MinExp'] && filters['MinExp'] >= i) && <Option value={i}>{i} yrs</Option>)}
                                        </Select>
                                    </div>
                                </div>
                            </div>}
                            {mappedFields['created_at_start'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>{mappedFields['created_at_start']['label'].replace('from', '')}</p>
                                <RangePicker ranges={ranges} allowClear className={'drawer-select'} style={{ width: '100%' }} placeholder={['Start Date', 'End Date']}
                                    value={[filters.created_at_start ? moment(filters.created_at_start[0]) : null, filters.created_at_end ? moment(filters.created_at_end[0]) : null]}
                                    renderExtraFooter={() => <Button type="default" size={'small'} onClick={() =>setFilters({ ...filters, created_at_start: null, created_at_end: null })} >Clear</Button>}
                                    onChange={([start, end]) =>setFilters({ ...filters, created_at_start: [start?.format('YYYY-MM-DDTHH:mm:ss')], created_at_end: [end?.format('YYYY-MM-DDTHH:mm:ss')] })}
                                    />
                            </div>}
                            {mappedFields['target_date_to_finish_hiring_start'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>Expiry date</p>
                                <RangePicker ranges={ranges} className={'drawer-select'} style={{ width: '100%' }} placeholder={['Start Date', 'End Date']}
                                    allowEmpty allowClear={false}
                                    value={[filters.target_date_to_finish_hiring_start ? moment(filters.target_date_to_finish_hiring_start[0]) : null, filters.target_date_to_finish_hiring_end ? moment(filters.target_date_to_finish_hiring_end[0]) : null]}
                                    renderExtraFooter={() => <Button type="default" size={'small'} onClick={() =>setFilters({ ...filters, target_date_to_finish_hiring_start: null, target_date_to_finish_hiring_end: null })} >Clear</Button>}
                                    onChange={([start, end]) =>setFilters({ ...filters, target_date_to_finish_hiring_start: [start?.format('YYYY-MM-DD')], target_date_to_finish_hiring_end: [end?.format('YYYY-MM-DD')] })}
                                    />
                            </div>}
                            {mappedFields['date_of_action_from'] && <div className='col-md-6 pl-0 mt-3'>
                                <p className='drawer-filter-label'>Date of Action</p>
                                <RangePicker ranges={ranges} className={'drawer-select'} style={{ width: '100%' }} placeholder={['Start Date', 'End Date']}
                                    allowEmpty allowClear={false}
                                    value={[filters.date_of_action_from ? moment(filters.date_of_action_from[0]) : null, filters.date_of_action_to ? moment(filters.date_of_action_to[0]) : null]}
                                    renderExtraFooter={() => <Button type="default" size={'small'} onClick={() =>setFilters({ ...filters, date_of_action_from: null, date_of_action_to: null })} >Clear</Button>}
                                    onChange={([start, end]) =>setFilters({ ...filters, date_of_action_from: [start?.format('YYYY-MM-DDTHH:mm:ss')], date_of_action_to: [end?.format('YYYY-MM-DDTHH:mm:ss')] })} />
                                    <p className={'text-danger m-0'}>{error.stage}</p>

                            </div>}
                        </div>
                    </div>
                    <div className='drawer-filter-btn-container'>
                        <button
                            type='button'
                            className='fancy_btn_custom'
                            onClick={() => handleClearFilter()}
                        >
                            Clear
                        </button>
                        <button
                            type='button'
                            style={{ width: '144px', height: '40px', fontWeight: '700', fontSize: '14px' }}
                            className='fancy_btn active'
                            onClick={() => handleApplyFilter()}
                            disabled={Object.keys(filters).length === 0 || error.openings}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </Drawer>
        </Fragment>
    )
}

const mapDispatchToProps = {
    addToaster: addToast,
}

export default connect(null, mapDispatchToProps)(DrawerFilter)