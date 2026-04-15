/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useState,
    useEffect,
} from 'react'
import {
    Bar,
    Pie,
    Line,
    Funnel,
} from '@ant-design/charts'
import { Empty } from 'antd'
import { connect } from 'react-redux'
import axios from 'axios'


import Spinner from 'components/UI/Spinner/Spinner'
import { addToast } from 'components/Toast/actions'

import 'antd/dist/antd.css'
import './Charts.css'

const BarChart = ({
    data = [],
    xField = '',
    yField = '',
}) => {
    const config = {
        data,
        xField,
        yField,
        forceFit: true,
        label: {
            visible: true,
            position: 'middle',
        },
    }

    return <Bar {...config} />
}

const PieChart = ({
    data = [],
    angleField = '',
    colorField = '',
}) => {
    const config = {
        data,
        angleField,
        colorField,
        radius: 0.8,
        forceFit: true,
        label: {
            offset: 20,
            type: 'outer',
            visible: true,
        },
        legend: {
            position: 'bottom',
        },
    }

    return <Pie {...config} />
}

const LineChart = ({
    data = [],
    xField = '',
    yField = '',
}) => {
    const config = {
        data,
        xField,
        yField,
        forceFit: true,
        padding: 'auto',
    }

    return <Line {...config} />
}

const FunnelChart = ({
    data = [],
    xField = '',
    yField = '',
}) => {
    const config = {
        data,
        xField,
        yField,
        legend: true,
        conversionTag: false,
        minSize: 0.5,
        shape:'pyramid'
    }

    return <Funnel {...config} />
}

export const Charts = ({
    children,
    style = {},
}) => {
    return (
        <div className='charts-container' style={style}>
            {children}
        </div>
    )
}

const Chart = ({
    api,
    type,
    title = '',
    addToaster,
    style = {},
    postData = {},
    queryParams = {},
    apiMethod = 'post',
    canvasWidth = null,
    canvasHeight = null,
}) => {
    const [loader, setLoader] = useState(false)
    const [chartData, setChartData] = useState([])
    const [stringParam, setStringParam] = useState('')
    const [numberParam, setNumberParam] = useState('')

    let queryParamsString = ''
    Object.keys(queryParams).forEach((item, index) => {
        let prefix = ''
        if (index === 0) prefix = '?'
        else prefix = '&'

        queryParamsString += `${prefix}${item}=${queryParams[item]}`
    })

    const url = `${api}${queryParamsString}`

    function fetchChartData() {
        setLoader(true)
        axios(
            apiMethod === 'post'
                ? {
                    url,
                    data: postData,
                    method: apiMethod,
                } : {
                    url,
                    method: apiMethod,
                }
        )
            .then(res => {
                const currentData = res.data.data
                if (currentData && currentData.length > 0) {
                    setChartData(currentData)

                    Object.keys(currentData[0]).forEach(item => {
                        if (typeof currentData[0][item] === 'string') setStringParam(item)
                        if (typeof currentData[0][item] === 'number') setNumberParam(item)
                    })
                } else setChartData(currentData)
            })
            .catch(err => {
                if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                else addToaster('error', 'Error', 'Something went wrong')
            })
            .finally(() => setLoader(false))
    }

    useEffect(() => {   
        fetchChartData()
    }, [postData])

    let selectedChart = null
    let isEmpty = false

    if (chartData.length > 0) {
        if (type === 'bar')
            selectedChart = (
                <BarChart
                    data={chartData}
                    xField={numberParam}
                    yField={stringParam}
                />
            )
        if (type === 'pie')
            selectedChart = (
                <PieChart
                    data={chartData}
                    angleField={numberParam}
                    colorField={stringParam}
                />
            )
        if (type === 'line')
            selectedChart = (
                <LineChart
                    data={chartData}
                    xField={stringParam}
                    yField={numberParam}
                />
            )
        if (type === 'funnel')
            selectedChart = (
                <FunnelChart
                    data={chartData}
                    xField={stringParam}
                    yField={numberParam}
                />
            )
    } else {
        isEmpty = true
        selectedChart = (
            <Empty
                description='No Chart Data'
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        )
    }

    return (
        <div
            style={style}
            className='chart'
        >
            {loader && <Spinner />}
            <div className='title'>{title}</div>
            <div
                className={`chart-canvas ${isEmpty ? 'empty' : ''}`}
                style={{
                    width: canvasWidth || 360,
                    height: canvasHeight || 360,
                }}
            >
                {selectedChart}
            </div>
        </div>
    )
}

const mapDispatchToProps = {
    addToaster: addToast,
}

export default connect(null, mapDispatchToProps)(Chart)
