/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment,
    useState,
    useEffect,
} from 'react'
import { connect } from 'react-redux'
import { Drawer } from 'antd'
import {
    PlusOutlined,
    MinusOutlined,
    CloseOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import { useParams } from 'react-router-dom'

import { addToast } from 'components/Toast/actions'
import Spinner from 'components/UI/Spinner/Spinner'

import 'antd/dist/antd.css'
import './OverlayFilter.css'

const APP_URL = process.env.REACT_APP_APP_URL;

const OverlayFilterSection = ({
    data,
    chartData,
    backendKey,
    title = '',
    setChartData,
    dataIndex = null,
    type = 'checkbox',
}) => {
    const [isExpanded, setExpand] = useState(false)

    const onItemClickHandler = (key, name) => {
        let currentData = chartData[key] ? [...chartData[key]] : []
        const indexOfElement = currentData
            && Array.isArray(currentData)
            && currentData.length > 0
            && currentData.findIndex(item => item === name)

        let tempData
        if (indexOfElement !== -1 && currentData.length > 0) {
            currentData.splice(indexOfElement, 1)
            tempData = {
                ...chartData,
                [key]: [...currentData]
            }
        } else {
            tempData = {
                ...chartData,
                [key]: [
                    ...currentData,
                    name
                ]
            }
        }
        setChartData(tempData)
    }

    const onDateChange = (key, value) => {
        const tempData = {
            ...chartData,
            [key]: value
        }
        setChartData(tempData)
    }

    let content = null
    if (type === 'date') content = (
        <div className={`section-content ${isExpanded ? 'active' : ''}`}>
            {
                data
                && Array.isArray(data)
                && data.length > 0
                && data.map((item, index) => (
                    <div
                        className='section-item-date'
                        key={`${title}-${backendKey[index]}`}
                    >
                        <label>{item}</label>
                        <input
                            type={type}
                            value={chartData[backendKey[index]] || ''}
                            onChange={e => onDateChange(backendKey[index], e.target.value)}
                        />
                    </div>
                ))
            }
        </div>
    )
    else content = (
        <div className={`section-content ${isExpanded ? 'active' : ''}`}>
            {
                data
                && Array.isArray(data)
                && data.length > 0
                && data.map(item => (
                    <div
                        className='section-item'
                        key={`${title}-${item.id}`}
                    >
                        <input
                            type={type}
                            onChange={() => onItemClickHandler(backendKey, item[dataIndex])}
                            checked={chartData[backendKey] ? chartData[backendKey].some(entry => entry === item[dataIndex]) : false}
                        />
                        <label
                            role='presentation'
                            onClick={() => onItemClickHandler(backendKey, item[dataIndex])}
                        >
                            {dataIndex ? item[dataIndex] : item}
                        </label>
                    </div>
                ))
            }
        </div>
    )


    return (
        <div className='overlay-filter-section'>
            <div className='section-top'>
                <span className='section-title'>{title}</span>
                {
                    isExpanded
                        ? <MinusOutlined onClick={() => setExpand(false)} />
                        : <PlusOutlined onClick={() => setExpand(true)} />
                }
            </div>
            {content}
            <hr />
        </div>
    )
}

const OverlayFilter = props => {
    const {
        addToaster,
        showFilter,
        onCloseHandler,
        filterData = {},
        filterDataHandler,
        showDateFilter = true,
        partnerName
    } = props

    const { uuid: orgId } = useParams();
    const [loader, setLoader] = useState(false)
    const [jobRoles, setJobRoles] = useState(null)
    const [locations, setLocations] = useState(null)
    const [chartData, setChartData] = useState(filterData)
    const [sourcingPartners, setSourcingPartners] = useState(null)

    useEffect(() => {
        let count = 0

        // Get all locations
        function fetchLocations() {
            count += 1
            const url = `${APP_URL}/${orgId}/locations/`
            axios.get(url)
                .then(res => {
                    if (res.data.data) setLocations(res.data.data)
                })
                .catch(err => {
                    setLocations([])
                    if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                    else addToaster('error', 'Error', 'Something went wrong')
                })
                .finally(() => {
                    count -= 1
                    if (count === 0) setLoader(false)
                })
        }

        // Get all job roles
        function fetchRoles() {
            const url = `${APP_URL}/${orgId}/jobs/role`

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
                    count -= 1
                    if (count === 0) setLoader(false)
                })
        }

        // Get all sourcing partners
        function fetchSources() {
            const url = `${APP_URL}/${orgId}/jobs/hiring_partner`

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
                    count -= 1
                    if (count === 0) setLoader(false)
                })
        }

        if (showFilter) {
            // Conditionally performing the api calls
            // Perform respective api call only at the first time
            if (
                locations === null
                || jobRoles === null
                || sourcingPartners === null
            ) setLoader(true)
            if (locations === null) fetchLocations()
            if (jobRoles === null) fetchRoles()
            if (sourcingPartners === null) fetchSources()
        }
    }, [orgId, showFilter])

    const handleApplyFilter = () => {
        filterDataHandler(chartData)
        onCloseHandler()
    }

    const handleClearFilter = () => {
        setChartData({})
        filterDataHandler({})
        onCloseHandler()
    }


    Object.keys(chartData).forEach((k) => {
        // checking chartData keys values .if all are empty then, apply button must disable
        if (chartData[k].length === 0) {
            let newState = Object.assign({}, chartData)
            delete newState[k];
            setChartData(newState)

        }
    })


    return (
        <Fragment>
            {loader && <Spinner />}
            <Drawer
                title='Filters'
                placement='right'
                visible={showFilter}
                onClose={onCloseHandler}
                closeIcon={<CloseOutlined />}
            >
                <div className='overlay-filter'>
                    <div className='overlay-filter-sections'>
                        <OverlayFilterSection
                            data={locations}
                            dataIndex='name'
                            title='Location'
                            backendKey='job_work_location__work_location__name'
                            chartData={chartData}
                            setChartData={setChartData}
                        />
                        <OverlayFilterSection
                            data={jobRoles}
                            dataIndex='name'
                            title='Role'
                            backendKey='role__name'
                            chartData={chartData}
                            setChartData={setChartData}
                        />
                        {partnerName ? null
                            : (
<OverlayFilterSection
                                data={sourcingPartners ? [
                                    ...sourcingPartners,
                                    {
                                        id: 'Referral',
                                        name: 'Referral'
                                    },
                                    {
                                        id: 'Walkin',
                                        name: 'Walkin'
                                    }
                                ] : sourcingPartners}
                                dataIndex='name'
                                title='Source'
                                backendKey='sourcing_partner__name'
                                chartData={chartData}
                                setChartData={setChartData}
/>
)}
                        {
                            showDateFilter
                                ? (
                                    <OverlayFilterSection
                                        data={['Start Date', 'End Date']}
                                        title='Date'
                                        type='date'
                                        backendKey={['start_date', 'end_date']}
                                        chartData={chartData}
                                        setChartData={setChartData}
                                    />
                                ) : null
                        }
                    </div>
                    <div className='overlay-filter-btn-container'>
                        <button
                            type='button'
                            className='fancy_btn_custom'
                            onClick={() => handleClearFilter()}
                        >
                            Clear
                        </button>
                        <button
                            type='button'
                            className='fancy_btn apply_button active'
                            onClick={() => {
                                window.sendEvent("Hire_Filters_applied",{
                                    Filltered_Fields:JSON.stringify(chartData)
                                    })
                                    
                                handleApplyFilter()
                            }}
                            disabled={Object.keys(chartData).length === 0}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </Drawer>
        </Fragment>
    )
}

const mapStateToProps = ({ auth }) => ({
    partnerName: auth.partner?.name
})

const mapDispatchToProps = {
    addToaster: addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(OverlayFilter)