/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment,
    useState,
    useEffect,
} from 'react'
import { connect, useSelector } from 'react-redux'
import { Drawer, Select, Input, DatePicker } from 'antd'
import axios from 'axios'
import get from 'lodash/get';
import moment from 'moment';
import { useParams } from 'react-router-dom'

import { addToast } from 'components/Toast/actions'
import Spinner from 'components/UI/Spinner/Spinner'
import 'antd/dist/antd.css'
import './DrawerFilter.css'
import TagSearch from '../../../components/TagSearch/TagSearch';
import { getDefaultLocations, getLocations } from '../../Config/Location/helpers';
import { getRoles, getRolesDefault } from '../../../containers/Hiring/JobRole/helpers';

const { Option } = Select;

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
    
    // Ensure filters is always an object to prevent map errors
    const safeFilters = filters || {};
    const { uuid: orgId } = useParams();
    const [loader, setLoader] = useState(false)
    const [count, setCount] = useState(0);
    const [error, setError] = useState({});
    const [optionsList, setOptionsList] = useState({});
    const savedFilteredData = useSelector(state => state.task.savedFilteredData);
    const [csvTypeField, setCsvTypeField] = useState({});

    useEffect(() => {
        if (count <= 0 && loader === true) {
            setLoader(false)
        }
    }, [loader, count])

    // Remove this below useEffect and the state variable and all its associated code
    // when we have the capability of handling both existing and IN queries in the API
    useEffect(() => {
        mappedFields?.forEach((filter) => {
            if (filter?.type === 'csv') {
                setCsvTypeField(filter);
            }
        })
    }, [mappedFields])

    useEffect(() => {
        if(savedFilteredData?.[props?.processKey || "All_Workflows"]){
            localStorage.setItem('filterData', JSON.stringify({ ...(savedFilteredData?.[props?.processKey || "All_Workflows"]), key: type }));
            return;
        }
        const defaultFilter = {};
        if(mappedFields?.length){
            mappedFields?.forEach(filter => {
                if(filter?.defaultValue){
                    if(filter?.type === "select"){
                        if(filter?.data?.defaultLocation || filter?.data?.defaultRole){
                            defaultFilter[filter?.key] = [{ value: filter?.defaultValue, label: filter?.defaultValue, type: filter?.type }]
                        } else {
                            defaultFilter[filter?.key] = [{ value: filter?.defaultValue, label: filter?.defaultValue, type: filter?.type }]
                        }
                    } else if(filter?.type === "text"){
                        defaultFilter[filter?.key] = [filter?.defaultValue]
                    } else if(filter?.type === "number") {
                        defaultFilter[filter?.key] = [filter?.defaultValue]
                    } else if(filter?.type === "date"){
                        defaultFilter[filter?.key] = [{ value: filter?.defaultValue, label: filter?.defaultValue, type: filter?.type }]
                    } else if(filter?.type === "csv"){
                        defaultFilter[filter?.key] = [filter?.defaultValue]
                    }
                }
            })
        }
        // Ensure we always set a valid object to prevent map errors
        setFilters(defaultFilter || {});
        
        // Transform default filters from drawer format (array) to filterData format (primitive for select types)
        const transformedDefaultFilterData = {};
        Object.keys(defaultFilter).forEach(key => {
            const filterConfig = mappedFields?.find(f => f.key === key);
            if (filterConfig?.type === 'select' && Array.isArray(defaultFilter[key]) && defaultFilter[key].length > 0) {
                // For select filters, use primitive value for consistent field naming
                transformedDefaultFilterData[key] = defaultFilter[key][0]?.value || defaultFilter[key][0];
            } else {
                // For other types, keep the same format
                transformedDefaultFilterData[key] = defaultFilter[key];
            }
        });
        
        if(Object.keys(defaultFilter)?.length){
            localStorage.setItem('filterData', JSON.stringify({ ...transformedDefaultFilterData, key: type }));
            applyFilter(transformedDefaultFilterData);
        } else {
            localStorage.removeItem('filterData')
        }
    }, [props?.processKey, mappedFields, type, JSON.stringify(savedFilteredData)])

    function fetchOptions(value) {
        let appId = '';
        // this below code is needed because eval will put the appId inside the url
        // orgId is already in scope appId is not in scope so we are initializing the appId.
        if (value?.data?.url?.includes('appId')) {
            if(props?.processKey){
                appId = props?.apps?.filter(item => item.process_key === props.processKey)[0]?.id;
            } else {
                return;
            }
        }
        let url = eval('`' + value?.data?.url + '`');
        axios.get(url)
            .then(res => {
                if (res) setOptionsList((prevState) => { return { ...prevState, [value.key]: get(res, value.path, '') } })
            })
            .catch(err => {
                setOptionsList((prevState) => { return { ...prevState, [value.key]: [] } })
                if (err.response?.data.message) addToaster('error', 'Error', err?.response?.data?.message)
                else addToaster('error', 'Error', 'Something went wrong')
            })
            .finally(() => {
                setCount(count => count - 1, () => { if (count <= 0) setLoader(false) })
            })
    }

    useEffect(() => {

        if (showFilter) {
            // Conditionally performing the api calls
            // Perform respective api call only at the first time
            let loaderCount = count
            setLoader(true)
            mappedFields?.map(async (filter) => {
                if (!optionsList[filter?.key]) {
                    if(filter?.data?.url && !filter?.path){
                        setOptionsList((prevState) => { return { ...prevState, [filter?.key]: "PATH_ERROR" } })
                    }
                    if (filter?.path && filter?.data?.url){
                        // preventing loader count increase as if we don't have processKey and url includes appId 
                        // it won't be able to push the appId inside the url and fetch call will not happen
                        if(!(filter?.data?.url?.includes("appId") && !props.processKey)){
                            loaderCount++;
                        }
                        fetchOptions(filter);                    
                    } else if (filter?.data?.defaultLocation){
                        const response = await getDefaultLocations(orgId); 
                        setOptionsList((prevState) => { return { ...prevState, [filter?.key]: response?.length ? [...response?.map(item => [item])] : [] } });
                    } else if(filter?.data?.defaultRole) {
                        const response = await getRolesDefault(orgId)
                        setOptionsList((prevState) => { return { ...prevState, [filter?.key]: response?.length ? [...response?.map(item => [item])] : [] } });
                    }
                }
            })
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
        
        // Transform filters from drawer format (array) to filterData format (primitive for select types)
        const transformedFilterData = {};
        Object.keys(newState).forEach(key => {
            const filterConfig = mappedFields?.find(f => f.key === key);
            if (filterConfig?.type === 'select' && Array.isArray(newState[key]) && newState[key].length > 0) {
                // For select filters, use primitive value for consistent field naming
                transformedFilterData[key] = newState[key][0]?.value || newState[key][0];
            } else {
                // For other types, keep the same format
                transformedFilterData[key] = newState[key];
            }
        });
        
        if (Object.keys(newState).length) {
            localStorage.setItem('filterData', JSON.stringify({ ...transformedFilterData, key: type }));
        } else {
            localStorage.removeItem('filterData');
        }
        if (!filters.stage && (filters.date_of_action_from?.length || filters.date_of_action_from?.length || filters.actor?.length)) {
            setError({ stage: 'Please select a stage' });
            return
        }
        setError({})
        applyFilter(transformedFilterData);
        onCloseHandler()
    }

    const handleClearFilter = () => {
        setFilters({});
        applyFilter({});
        onCloseHandler()
        localStorage.removeItem('filterData');
    }

    useEffect(() => {
        let filterData = localStorage.getItem('filterData');
        if (filterData && type) {
            filterData = JSON.parse(filterData);
            if (filterData.key === type) {
                delete filterData['key'];
                
                // Convert filterData (primitive format) back to filters (array format) for UI
                const uiFilters = {};
                Object.keys(filterData).forEach(key => {
                    const filterConfig = mappedFields?.find(f => f.key === key);
                    // If it's a select type and not already in array format, convert it
                    if (filterConfig?.type === 'select' && !Array.isArray(filterData[key])) {
                        // Convert primitive back to array format for UI
                        uiFilters[key] = [{ value: filterData[key], label: filterData[key], type: 'select' }];
                    } else {
                        // For other types or if already in array format, keep the same format
                        uiFilters[key] = filterData[key];
                    }
                });
                
                setFilters(uiFilters);
                // Apply filterData as-is (already in primitive format)
                applyFilter(filterData);
            } else {
                localStorage.removeItem('filterData');
            }
        }
    }, []);

    const updateInputValueName = (evt, key) => {
        setFilters({ ...filters, [key]: evt?.id ? [{ value: evt?.id, label: evt?.name, type: evt?.type }] : [] })
    };

    const searchLocation = async (e, filter) => {
        if (!e) {
            return setOptionsList({ ...optionsList, [filter?.key]: [] })
        };
        let response;
        if (filter?.data?.defaultLocation)
            response = await getLocations(e, orgId)
        else if (filter?.data?.defaultRole)
            response = await getRoles(e, orgId)
        if (response?.length) {
            setOptionsList({ ...optionsList, [filter?.key]: [...response] })
        } else {
            setOptionsList({ ...optionsList, [filter?.key]: [] })

        }
    };

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
                            {
                                mappedFields?.map(item => {
                                    if (item?.type === 'select') {
                                        if (item?.data?.defaultLocation || item?.data?.defaultRole) {
                                            return (
                                                <div className='col-md-6 pl-0 mt-3 drawer-location-filter'>
                                                    <p className='drawer-filter-label'>{item['label']}</p>
                                                    <TagSearch
                                                        disabled={filters[csvTypeField?.key]?.length > 0}
                                                        onChange={(value) => updateInputValueName(value, item?.key)}
                                                        onSearch={(e) => searchLocation(e, item)}
                                                        data={optionsList?.[item?.key]}
                                                        className="locationSearch"
                                                        label={item?.placeholderText || "Search"}
                                                        defaultValue={Array.isArray(filters?.[item?.key]) && filters?.[item?.key]?.map(i => i.label)}
                                                    />
                                                </div>
                                            )
                                        }
                                        else if (!item?.options?.length) {
                                            const showPathError = optionsList?.[item?.key] === "PATH_ERROR";
                                            return (
                                                <div className='col-md-6 pl-0 mt-3'>
                                                    <p className='drawer-filter-label'>{showPathError ? "Path is not configured" : item['label']}</p>
                                                    <Select
                                                        showSearch
                                                        className={'drawer-select'}
                                                        placeholder={item?.placeholderText || 'Select'}
                                                        filterOption={(inputValue, option) => {
                                                            return option?.['children']?.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0;
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        maxTagCount={1}
                                                        onFocus={() => !optionsList?.[item?.key] && fetchOptions(item)}
                                                        onClear={() => setFilters({ ...filters, [item?.key]: [] })}
                                                        onSelect={(x, a) => setFilters({ ...filters, [item?.key]: [{ value: a.value, label: a['children'] }] })}
                                                        onDeselect={(x) => setFilters({ ...filters, [item?.key]: [...(Array.isArray(filters?.[item?.key]) ? filters?.[item?.key]?.filter?.(item => item.value !== x) : [])] })}
                                                        value={Array.isArray(filters?.[item?.key]) && filters?.[item?.key]?.map(i => i.value)}
                                                        allowClear
                                                        disabled={showPathError || filters[csvTypeField?.key]?.length > 0}
                                                    >
                                                        {Array.isArray(optionsList?.[item?.key]) && optionsList?.[item?.key]?.length && 
                                                            optionsList?.[item?.key]?.map((option, index) => 
                                                                (
                                                                    <Option 
                                                                        key={option?.id+option?.name+index}
                                                                        value={option?.name ? option?.name : option}
                                                                    >
                                                                        {option?.name ? option?.name : option}
                                                                    </Option>
                                                                )
                                                            )
                                                        }
                                                    </Select>
                                                </div>
                                            )
                                        }
                                        else if (item?.options?.length) {
                                            return (
                                                <div className='col-md-6 pl-0 mt-3'>
                                                    <p className='drawer-filter-label'>{item['label']}</p>
                                                    <Select
                                                        showSearch
                                                        className={'drawer-select'}
                                                        placeholder={item?.placeholderText || 'Select'}
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        maxTagCount={1}
                                                        onClear={() => setFilters({ ...filters, [item?.key]: [] })}
                                                        onSelect={(x, a) => setFilters({ ...filters, [item?.key]: [{ value: a.value, label: a['children'] }] })}
                                                        onDeselect={(x) => setFilters({ ...filters, [item?.key]: [...(Array.isArray(filters?.[item?.key]) ? filters?.[item?.key]?.filter?.(item => item.value !== x) : [])] })}
                                                        value={Array.isArray(filters?.[item?.key]) && filters?.[item?.key]?.map(i => i.value)}
                                                        allowClear
                                                        disabled={filters[csvTypeField?.key]?.length > 0}
                                                    >
                                                        {item?.options?.map((option, index) => <Option key={option?.id+option['value']+index} value={option['value']}>{option['text']}</Option>)}
                                                    </Select>
                                                </div>
                                            )
                                        }
                                    }
                                    else if (item?.type === 'text') {
                                        return (
                                            <div className='col-md-6 pl-0 mt-3'>
                                                <p className='drawer-filter-label'>{item['label']}</p>
                                                <Input
                                                    className={`drawer-select ${error.openings && `errorField`}`}
                                                    placeholder={item?.placeholderText || 'Type here..'}
                                                    controls={false}
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                    disabled={filters[csvTypeField?.key]?.length > 0}
                                                    status={'error'}
                                                    value={filters?.[item?.key] && filters?.[item?.key][0]}
                                                    onChange={(e) => {
                                                        let value = e.target.value;
                                                        setFilters({ ...filters, [item.key]: value ? [value] : [] })
                                                    }} />
                                                <p className={'text-danger m-0'}>{error.openings}</p>
                                            </div>
                                        )
                                    }
                                    else if (item?.type === 'number') {
                                        return (
                                            <div className='col-md-6 pl-0 mt-3'>
                                                <p className='drawer-filter-label'>{item['label']}</p>
                                                <Input
                                                    className={`drawer-select ${error.openings && `errorField`}`}
                                                    placeholder={item?.placeholderText || 'Type here..'}
                                                    controls={false}
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                    // Remove all these disabled condition on all the other types based on the csvtype field when
                                                    // the API simultaneously supports IN queries as well
                                                    disabled={filters[csvTypeField?.key]?.length > 0}
                                                    status={'error'}
                                                    value={filters?.[item?.key] && filters?.[item?.key][0]}
                                                    onChange={(e) => {
                                                        let value = e.target.value;
                                                        setFilters({ ...filters, [item.key]: value ? [value] : [] })
                                                        if (value && (isNaN(value) || value == 0)) {
                                                            setError({ openings: 'Please enter valid number' });
                                                        } else {
                                                            setError({ openings: '' });
                                                        }
                                                    }} />
                                                <p className={'text-danger m-0'}>{error.openings}</p>
                                            </div>
                                        )
                                    }
                                    else if (item?.type === 'date') {
                                        return (
                                            <div className='col-md-6 pl-0 mt-3'>
                                                <p className='drawer-filter-label'>{item['label']}</p>
                                                <DatePicker
                                                    allowClear
                                                    date
                                                    disabled={filters[csvTypeField?.key]?.length > 0}
                                                    value={filters?.[item?.key] && filters?.[item?.key][0] && moment(filters?.[item?.key][0]?.value)}
                                                    className={'drawer-select'}
                                                    style={{ width: '100%' }}
                                                    placeholder={item?.placeholderText || 'Select Date'}
                                                    onChange={(e, date) => setFilters({ ...filters, [item.key]: e ? [{ value: e?.format('YYYY-MM-DD'), label: e?.format('YYYY-MM-DD'), type: 'date' }] : [] })}
                                                    onClear={() => setFilters({ ...filters, [item?.key]: [] })}
                                                />
                                            </div>
                                        )
                                    }
                                    else if (item?.type === 'csv') {
                                        return (
                                            <div className='col-md-6 pl-0 mt-3'>
                                                <p className='drawer-filter-label'>{item['label']}</p>
                                                <Input
                                                    className={`drawer-select ${error.openings && `errorField`}`}
                                                    placeholder={item?.placeholderText || 'Type here..'}
                                                    controls={false}
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                    status={'error'}
                                                    value={filters?.[item?.key] && filters?.[item?.key][0]?.value}
                                                    onChange={(e) => {
                                                        let value = e.target.value;
                                                        if (value && value !== '') {
                                                            if (/^[a-zA-Z0-9 ,]*$/.test(value)) {
                                                                setFilters({ [item.key]: value ? [{type: 'csv', value}] : [] })
                                                                setError({});
                                                            } else {
                                                                setError({ openings: 'Invalid Comma separated value input. Please check for any special characters other than comma' });
                                                            }
                                                        } else if (value === '') {
                                                            let tempFilters = { ...filters };
                                                            delete tempFilters?.[item?.key];
                                                            setFilters(tempFilters);
                                                            setError({});
                                                        }
                                                    }} />
                                                {filters[csvTypeField?.key]?.length > 0 && <p className='text-muted drawer-filter-field-note'>Note: Applying this filter will disable the rest.</p>}
                                                <p className={'text-danger m-0'}>{error.openings}</p>
                                            </div>
                                        )
                                    }

                                })
                            }
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

const mapStateToProps = ({ auth, task }) => ({
    processKey: task.processKey,
    apps: task?.apps,
})

const mapDispatchToProps = {
    addToaster: addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(DrawerFilter)